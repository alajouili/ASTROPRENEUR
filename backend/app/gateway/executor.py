"""Action Gateway: deterministic code, no LLM. The only place where actions take effect.

Before executing it re-checks everything, even though the API already did:
the proposal is approved by a human, the reviewer still has an HR role, the
payload has not changed since approval, and every target is valid.
All checks run before any change, so a failed action changes nothing.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.screening.schemas import ShortlistPayload
from app.approvals.service import payload_hash
from app.audit.log import append as audit
from app.auth.security import HR_ROLES
from app.models import AuditLog, Candidate, Proposal, User, utcnow


class GatewayError(Exception):
    pass


def _execute_shortlist(db: Session, proposal: Proposal, actor: User) -> dict:
    payload = ShortlistPayload.model_validate(proposal.payload)
    candidates = list(db.scalars(select(Candidate).where(Candidate.id.in_(payload.candidate_ids)).with_for_update()))
    if len(candidates) != len(payload.candidate_ids):
        raise GatewayError("Unknown candidate in payload")
    for c in candidates:
        if c.job_id != payload.job_id or proposal.job_id != payload.job_id:
            raise GatewayError(f"Candidate {c.id} does not belong to job {payload.job_id}")
        if c.status not in ("screened", "shortlisted"):
            raise GatewayError(f"Candidate {c.id} has status {c.status!r} and cannot be shortlisted")
    changed = []
    for c in candidates:
        if c.status != "shortlisted":
            audit(db, actor_type="user", actor_id=actor.id, action="candidate.status_changed", entity_type="candidate",
                  entity_id=c.id, details={"from": c.status, "to": "shortlisted", "proposal_id": proposal.id})
            c.status = "shortlisted"
            changed.append(c.id)
    return {"shortlisted": changed, "already_shortlisted": [c.id for c in candidates if c.id not in changed]}


EXECUTORS = {"shortlist": _execute_shortlist}


def execute(db: Session, proposal_id: str, actor: User) -> Proposal:
    proposal = db.get(Proposal, proposal_id, with_for_update=True)
    if proposal is None:
        raise GatewayError("Proposal not found")
    if proposal.status != "approved" or proposal.reviewed_by is None:
        raise GatewayError(f"Refused: proposal is {proposal.status!r}, actions need human approval")
    reviewer = db.get(User, proposal.reviewed_by)
    if reviewer is None or reviewer.role not in HR_ROLES or actor.role not in HR_ROLES:
        raise GatewayError("Refused: reviewer or actor lacks an HR role")
    if payload_hash(proposal.payload) != proposal.payload_hash:
        raise GatewayError("proposal tampered: payload changed after approval")

    # Verify the proposal's hash against the audit log entry where it was proposed / approved
    creation_audit = db.scalar(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "proposal",
            AuditLog.entity_id == str(proposal.id),
            AuditLog.action.in_(("proposal.created", "proposal.approved", "proposal.edited")),
        )
        .order_by(AuditLog.id.desc())
        .limit(1)
    )
    if creation_audit is None:
        raise GatewayError("proposal tampered: no audit entry found")
    audit_hash = creation_audit.details.get("payload_hash") or payload_hash(creation_audit.details.get("payload", {}))
    if not audit_hash or audit_hash != proposal.payload_hash:
        raise GatewayError("proposal tampered: hash does not match audit record")

    executor = EXECUTORS.get(proposal.type)
    if executor is None:
        raise GatewayError(f"No executor for {proposal.type!r}")
    try:
        result = executor(db, proposal, actor)
    except GatewayError as exc:
        proposal.status = "failed"
        proposal.execution_result = {"error": str(exc)}
        audit(db, actor_type="system", actor_id="action_gateway", action="action.failed", entity_type="proposal",
              entity_id=proposal.id, details={"error": str(exc)})
        raise
    proposal.status = "executed"
    proposal.executed_at = utcnow()
    proposal.execution_result = result
    audit(db, actor_type="system", actor_id="action_gateway", action="action.executed", entity_type="proposal",
          entity_id=proposal.id, details={"type": proposal.type, "result": result, "approved_by": proposal.reviewed_by})
    return proposal
