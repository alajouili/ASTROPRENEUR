"""Human approval system. Agents create proposals; only humans change their status."""
import hashlib
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.screening.schemas import ShortlistPayload
from app.audit.log import append as audit
from app.auth.security import HR_ROLES
from app.models import Proposal, User, utcnow

from pydantic import BaseModel, Field

class EmailPayload(BaseModel):
    # One plain address; the subject must be a single line (no header injection).
    to: str = Field(max_length=254, pattern=r"^[^@\s<>,;]+@[^@\s<>,;]+\.[A-Za-z]{2,}$")
    subject: str = Field(default="TrustHR Notification", min_length=1, max_length=200, pattern=r"^[^\r\n]*$")
    body: str = Field(min_length=1, max_length=10_000)

class SchedulePayload(BaseModel):
    candidate_id: str | None = None
    candidate_name: str | None = None
    candidate_email: str | None = None
    role: str | None = None
    slot: str
    interviewer: str = "Recruiter"
    day: str | None = None
    time: str | None = None

PAYLOAD_MODELS = {
    "shortlist": ShortlistPayload,
    "send_email": EmailPayload,
    "schedule_interview": SchedulePayload,
}


class ApprovalError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def payload_hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def validate_payload(proposal_type: str, payload: dict) -> dict:
    model = PAYLOAD_MODELS.get(proposal_type)
    if model is None:
        raise ApprovalError(400, f"Unknown proposal type {proposal_type!r}")
    return model.model_validate(payload).model_dump()


def create_proposal(
    db: Session, *, type: str, job_id: str | None, payload: dict, evidence: dict, risk_flags: list, created_by: str
) -> Proposal:
    clean = validate_payload(type, payload)
    h = payload_hash(clean)
    proposal = Proposal(
        type=type, job_id=job_id, payload=clean, payload_hash=h,
        evidence=evidence, risk_flags=risk_flags, status="pending", created_by=created_by,
    )
    db.add(proposal)
    db.flush()
    # A recruiter's own draft ("user:<id>") is a user action; anything else comes from an agent.
    actor_type = "user" if created_by.startswith("user:") else "agent"
    audit(db, actor_type=actor_type, actor_id=created_by, action="proposal.created", entity_type="proposal",
          entity_id=proposal.id, details={"type": type, "payload": clean, "payload_hash": h, "risk_flags": len(risk_flags)})
    return proposal


def supersede_pending(db: Session, *, type: str, job_id: str, by: str) -> None:
    for old in db.scalars(select(Proposal).where(Proposal.type == type, Proposal.job_id == job_id, Proposal.status == "pending")):
        old.status = "superseded"
        audit(db, actor_type="agent", actor_id=by, action="proposal.superseded", entity_type="proposal", entity_id=old.id)


def _load_pending(db: Session, proposal_id: str, user: User) -> Proposal:
    if user.role not in HR_ROLES:
        raise ApprovalError(403, "Your role cannot review proposals")
    proposal = db.get(Proposal, proposal_id, with_for_update=True)
    if proposal is None:
        raise ApprovalError(404, "Proposal not found")
    if proposal.status != "pending":
        raise ApprovalError(409, f"Proposal is {proposal.status}, not pending")
    return proposal


def approve(db: Session, proposal_id: str, user: User, edited_payload: dict | None = None, note: str | None = None) -> Proposal:
    """Mark as approved by a human. Execution is a separate step done by the Action Gateway."""
    proposal = _load_pending(db, proposal_id, user)
    if edited_payload is not None:
        clean = validate_payload(proposal.type, edited_payload)
        if clean != proposal.payload:
            new_hash = payload_hash(clean)
            audit(db, actor_type="user", actor_id=user.id, action="proposal.edited", entity_type="proposal",
                  entity_id=proposal.id, details={"before": proposal.payload, "after": clean, "payload_hash": new_hash})
            proposal.payload = clean
            proposal.payload_hash = new_hash
    proposal.status = "approved"
    proposal.reviewed_by = user.id
    proposal.reviewed_at = utcnow()
    proposal.review_note = (note or "")[:1000] or None
    audit(db, actor_type="user", actor_id=user.id, action="proposal.approved", entity_type="proposal",
          entity_id=proposal.id, details={"payload_hash": proposal.payload_hash})
    return proposal


def reject(db: Session, proposal_id: str, user: User, note: str | None = None) -> Proposal:
    proposal = _load_pending(db, proposal_id, user)
    proposal.status = "rejected"
    proposal.reviewed_by = user.id
    proposal.reviewed_at = utcnow()
    proposal.review_note = (note or "")[:1000] or None
    audit(db, actor_type="user", actor_id=user.id, action="proposal.rejected", entity_type="proposal",
          entity_id=proposal.id, details={"note": proposal.review_note})
    return proposal
