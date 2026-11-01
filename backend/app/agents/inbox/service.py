"""Mailbox sync, daily digest and follow-up scan.

sync:      Mailpit -> Security Guard (sanitise + injection rules) -> link sender to a candidate
           -> Inbox agent triage -> Comms agent draft (from that candidate's own record) -> stored.
digest:    one day's inbound emails grouped by type and urgency, with those needing a human.
follow-ups: candidates we emailed N days ago who have not answered -> reminder proposals
           (pending, for human approval). Nothing here sends anything.
"""
from collections import Counter
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.comms.drafts import CandidateContext, draft_reminder, draft_reply
from app.agents.inbox.triage import triage_email
from app.agents.llm import LLMClient
from app.approvals.service import create_proposal
from app.audit.log import append as audit
from app.config import Settings
from app.integrations.mailpit import MailpitClient
from app.models import Candidate, Email, JobOffer, Proposal, utcnow
from app.security.flags import max_severity
from app.security.injection import scan_rules
from app.security.output_guard import check_output
from app.security.sanitize import sanitize

INBOX_AGENT = "agent:inbox"
COMMS_AGENT = "agent:comms"


def _candidate_for(db: Session, address: str) -> Candidate | None:
    if not address:
        return None
    return db.scalar(select(Candidate).where(Candidate.email == address).order_by(Candidate.created_at.desc()).limit(1))


def context_for(db: Session, candidate: Candidate | None, fallback_name: str) -> CandidateContext:
    """The only data a draft may use: this one candidate's record (or just the sender's name)."""
    if candidate is None:
        return CandidateContext(name=fallback_name or "", job_title=None, status=None)
    job = db.get(JobOffer, candidate.job_id)
    return CandidateContext(name=candidate.display_name, job_title=job.title if job else None, status=candidate.status)


def sync_mailbox(db: Session, settings: Settings, client: MailpitClient, llm: LLMClient | None) -> dict:
    known = set(db.scalars(select(Email.mailbox_id)))
    ours = settings.mail_from.lower()
    counts = Counter()
    for message_id in client.list_ids():
        if message_id in known:
            continue
        m = client.get(message_id)
        if m.from_addr == ours:
            to_addr = m.to_addrs[0] if m.to_addrs else ""
            candidate = _candidate_for(db, to_addr)
            db.add(Email(mailbox_id=m.id, direction="out", from_addr=m.from_addr, to_addr=to_addr,
                         subject=m.subject[:500], body=m.text[:20000], sent_at=m.sent_at,
                         candidate_id=candidate.id if candidate else None))
            counts["out"] += 1
            continue

        # Inbound: untrusted. Sanitise and scan subject and body before any agent reads them.
        subject, subject_flags = sanitize(m.subject, 500)
        body, body_flags = sanitize(m.text, settings.max_text_chars)
        flags = subject_flags + body_flags + scan_rules(subject, "subject") + scan_rules(body, "body")
        risk = max_severity(flags)
        candidate = _candidate_for(db, m.from_addr)
        triage = triage_email(subject, body, risk == "high", llm)
        email = Email(
            mailbox_id=m.id, direction="in", from_addr=m.from_addr, from_name=m.from_name[:255],
            to_addr=m.to_addrs[0] if m.to_addrs else ours, subject=subject[:500], body=body, sent_at=m.sent_at,
            candidate_id=candidate.id if candidate else None, type=triage.type, urgency=triage.urgency,
            needs_human=triage.needs_human, summary=triage.summary, risk_level=risk,
            risk_flags=[f.to_dict() for f in flags], triage_engine=triage.engine,
        )
        if triage.type != "SUSPICIOUS":
            draft = draft_reply(triage.type, subject, body, context_for(db, candidate, m.from_name), llm)
            # A draft that fails the Output Guard is not offered at all.
            if all(check_output(part)[0] for part in (draft.subject, draft.body)):
                email.draft_subject, email.draft_body, email.draft_engine = draft.subject, draft.body, draft.engine
        db.add(email)
        db.flush()
        audit(db, actor_type="agent", actor_id=INBOX_AGENT, action="email.triaged", entity_type="email", entity_id=email.id,
              details={"type": triage.type, "urgency": triage.urgency, "needs_human": triage.needs_human,
                       "risk_level": risk, "linked_candidate": bool(candidate), "engine": triage.engine})
        counts["in"] += 1
    return {"new_inbound": counts["in"], "new_outbound": counts["out"]}


def digest(db: Session, day: date | None) -> dict:
    stmt = select(Email).where(Email.direction == "in").order_by(Email.sent_at.desc())
    emails = list(db.scalars(stmt))
    if day is not None:
        emails = [e for e in emails if e.sent_at.astimezone(timezone.utc).date() == day]
    human = [e for e in emails if e.needs_human]
    by_type = Counter(e.type for e in emails)
    by_urgency = Counter(e.urgency for e in emails)
    parts = [f"{n} {t.replace('_', ' ').lower()}" for t, n in by_type.most_common()]
    overview = (f"{len(emails)} email{'s' if len(emails) != 1 else ''}"
                + (f" ({', '.join(parts)})" if parts else "")
                + f"; {len(human)} need{'s' if len(human) == 1 else ''} a human answer.")
    return {
        "date": day.isoformat() if day else None,
        "total": len(emails),
        "overview": overview,
        "by_type": dict(by_type),
        "by_urgency": {u: by_urgency.get(u, 0) for u in ("HIGH", "MEDIUM", "LOW")},
        "needs_human": [{"id": e.id, "from": e.from_name or e.from_addr, "subject": e.subject, "type": e.type,
                         "urgency": e.urgency, "summary": e.summary} for e in human],
    }


def scan_followups(db: Session, settings: Settings, days: int, actor_id: str) -> list[Proposal]:
    """Reminder proposals for addresses whose last email from us is older than `days`
    and who have not written since. One pending reminder per address at most."""
    now = utcnow()
    outbound = list(db.scalars(select(Email).where(Email.direction == "out").order_by(Email.sent_at.desc())))
    latest: dict[str, Email] = {}
    for e in outbound:
        latest.setdefault(e.to_addr, e)
    pending_to = {p.payload.get("to") for p in db.scalars(select(Proposal).where(Proposal.type == "send_email", Proposal.status == "pending"))}
    created = []
    for address, last in latest.items():
        sent_at = last.sent_at if last.sent_at.tzinfo else last.sent_at.replace(tzinfo=timezone.utc)
        if not address or address in pending_to or now - sent_at < timedelta(days=days):
            continue
        replied = db.scalar(select(Email.id).where(Email.direction == "in", Email.from_addr == address, Email.sent_at > last.sent_at).limit(1))
        if replied:
            continue
        candidate = _candidate_for(db, address)
        waited = max(days, (now - sent_at).days)
        draft = draft_reminder(context_for(db, candidate, ""), last.subject, waited)
        proposal = create_proposal(
            db, type="send_email", job_id=candidate.job_id if candidate else None,
            payload={"to": address, "subject": draft.subject, "body": draft.body},
            evidence={"kind": "follow_up", "last_email_id": last.id, "last_sent_at": sent_at.isoformat(),
                      "days_without_reply": waited, "engine": draft.engine},
            risk_flags=[], created_by=COMMS_AGENT,
        )
        created.append(proposal)
    audit(db, actor_type="user", actor_id=actor_id, action="followups.scanned", entity_type="mailbox", entity_id="inbox",
          details={"days": days, "reminders_proposed": len(created)})
    return created
