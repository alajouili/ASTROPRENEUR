"""Screening task: Guard every CV, run the screening graph, rank, and propose a shortlist.

Nothing here changes a decision about a person: candidates move from "received" to
"screened" (a processing state) and the result is a *pending* shortlist proposal.
"""
import re
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.llm import LLMError
from app.agents.screening.graph import build_screening_graph
from app.agents.screening.schemas import Criterion
from app.agents.screening.scoring import rank_key
from app.approvals.service import create_proposal, supersede_pending
from app.audit.log import append as audit
from app.config import Settings
from app.models import BackgroundTask, Candidate, JobOffer, Screening
from app.security.flags import RiskFlag, max_severity
from app.security.guard import guard_document
from app.security.injection import PromptGuardClassifier

AGENT_ID = "agent:screening"
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")


def screen_job(db: Session, task: BackgroundTask, engine, settings: Settings) -> dict:
    job = db.get(JobOffer, task.payload["job_id"])
    if job is None:
        raise ValueError("job not found")
    criteria = [Criterion.model_validate(c) for c in job.criteria]
    candidates = list(db.scalars(
        select(Candidate).where(Candidate.job_id == job.id, Candidate.status == "received").order_by(Candidate.created_at)
    ))
    task.progress_total = len(candidates)
    db.commit()

    graph = build_screening_graph(engine)
    classifier = PromptGuardClassifier(settings)
    screened = failed = 0
    for candidate in candidates:
        try:
            _screen_one(db, candidate, job, criteria, graph, classifier, settings)
            screened += 1
        except (LLMError, OSError, ValueError, RuntimeError) as exc:
            db.rollback()
            candidate = db.get(Candidate, candidate.id)
            candidate.status = "screening_failed"
            candidate.risk_flags = (candidate.risk_flags or []) + [
                RiskFlag("screening_error", "medium", f"Screening failed: {type(exc).__name__}: {str(exc)[:200]}").to_dict()
            ]
            candidate.risk_level = max_severity(candidate.risk_flags)
            audit(db, actor_type="agent", actor_id=AGENT_ID, action="candidate.screening_failed", entity_type="candidate",
                  entity_id=candidate.id, details={"error": type(exc).__name__})
            failed += 1
        task.progress_done += 1
        db.commit()

    proposal_id = propose_shortlist(db, job, settings.shortlist_size)
    db.commit()
    return {"screened": screened, "failed": failed, "proposal_id": proposal_id}


def _screen_one(db: Session, candidate: Candidate, job: JobOffer, criteria, graph, classifier, settings: Settings) -> None:
    content = Path(candidate.stored_path).read_bytes()
    guarded = guard_document(content, candidate.file_kind, settings, classifier)
    flags = list(guarded.flags)
    if not guarded.text.strip():
        raise ValueError("no readable text in document")
    if candidate.email is None:  # contact details are stored on the candidate, never in the scored profile
        m = _EMAIL.search(guarded.text)
        candidate.email = m.group(0)[:255] if m else None

    out = graph.invoke({"cv_text": guarded.text, "criteria": [c.model_dump() for c in criteria]})

    if out.get("identity_keys_dropped"):
        flags.append(RiskFlag("identity_fields_dropped", "low",
                              f"Model returned identity fields that were discarded: {', '.join(out['identity_keys_dropped'])}"))
    if out.get("rejected_evidence"):
        flags.append(RiskFlag("unverified_claims", "low",
                              f"{len(out['rejected_evidence'])} extracted claim(s) ignored: quote not found verbatim in the CV"))
    if any(r["downgraded"] for r in out["results"]):
        flags.append(RiskFlag("unverified_assessment", "low", "A criterion claimed as met had no verifiable quote and was counted as missing"))

    db.add(Screening(
        candidate_id=candidate.id, job_id=job.id, blind_profile=out["profile"], criteria_results=out["results"],
        rejected_evidence=out.get("rejected_evidence", []), score=out["score"], must_have_met=out["must_have_met"],
        must_have_total=out["must_have_total"], justification=out["justification"], engine=out["engine"],
    ))
    candidate.status = "screened"
    candidate.risk_flags = [f.to_dict() for f in flags]
    candidate.risk_level = max_severity(flags)
    audit(db, actor_type="agent", actor_id=AGENT_ID, action="candidate.screened", entity_type="candidate",
          entity_id=candidate.id, details={"score": out["score"], "risk_level": candidate.risk_level, "engine": out["engine"]})


def ranked_screenings(db: Session, job_id: str) -> list[tuple[Candidate, Screening]]:
    rows = db.execute(
        select(Candidate, Screening).join(Screening, Screening.candidate_id == Candidate.id).where(Candidate.job_id == job_id)
    ).all()
    return sorted(
        ((c, s) for c, s in rows),
        key=lambda cs: rank_key(cs[1].score, cs[1].must_have_met, cs[0].created_at.isoformat(), cs[0].id),
    )


def propose_shortlist(db: Session, job: JobOffer, size: int) -> str | None:
    """Propose the top `size` candidates that meet every must-have criterion.
    High-risk CVs are never proposed automatically: they are listed under 'needs_review'.
    Candidates missing a must-have are listed under 'missing_must_haves'. HR can add
    anyone from either list. Nobody is rejected here; every candidate keeps 'screened'."""
    ranked = [(c, s) for c, s in ranked_screenings(db, job.id) if c.status in ("screened", "shortlisted")]
    needs_review = [(c, s) for c, s in ranked if c.risk_level == "high"]
    clean = [(c, s) for c, s in ranked if c.risk_level != "high"]
    eligible = [(c, s) for c, s in clean if s.must_have_met == s.must_have_total]
    missing_must = [(c, s) for c, s in clean if s.must_have_met < s.must_have_total]
    if not eligible:
        return None
    top = eligible[:size]
    supersede_pending(db, type="shortlist", job_id=job.id, by=AGENT_ID)
    evidence = {
        "ranking": [
            {"rank": i + 1, "candidate_id": c.id, "display_name": c.display_name, "score": s.score,
             "must_have": f"{s.must_have_met}/{s.must_have_total}", "risk_level": c.risk_level}
            for i, (c, s) in enumerate(top)
        ],
        "needs_review": [
            {"candidate_id": c.id, "display_name": c.display_name, "score": s.score,
             "flags": sorted({f["code"] for f in c.risk_flags})}
            for c, s in needs_review
        ],
        "missing_must_haves": [
            {"candidate_id": c.id, "display_name": c.display_name, "score": s.score,
             "must_have": f"{s.must_have_met}/{s.must_have_total}"}
            for c, s in missing_must
        ],
    }
    risky = [{"candidate_id": c.id, "risk_level": c.risk_level} for c, _ in top if c.risk_level == "medium"]
    proposal = create_proposal(
        db, type="shortlist", job_id=job.id,
        payload={"job_id": job.id, "candidate_ids": [c.id for c, _ in top]},
        evidence=evidence, risk_flags=risky, created_by=AGENT_ID,
    )
    return proposal.id
