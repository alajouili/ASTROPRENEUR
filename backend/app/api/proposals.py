"""Approval queue. Approving is the only route that can trigger the Action Gateway."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.approvals import service
from app.auth.security import HR_ROLES, require_roles
from app.db import get_db
from app.gateway.executor import GatewayError, execute
from app.models import Proposal, User

router = APIRouter(prefix="/api/proposals", tags=["proposals"])
hr_only = require_roles(*HR_ROLES)


class ApproveIn(BaseModel):
    candidate_ids: list[str] | None = Field(default=None, max_length=50)  # optional HR edit of a shortlist
    note: str | None = Field(default=None, max_length=1000)


class RejectIn(BaseModel):
    note: str | None = Field(default=None, max_length=1000)


def proposal_out(p: Proposal) -> dict:
    return {
        "id": p.id, "type": p.type, "job_id": p.job_id, "payload": p.payload, "evidence": p.evidence,
        "risk_flags": p.risk_flags, "status": p.status, "created_by": p.created_by, "created_at": p.created_at.isoformat(),
        "reviewed_by": p.reviewed_by, "reviewed_at": p.reviewed_at.isoformat() if p.reviewed_at else None,
        "review_note": p.review_note, "execution_result": p.execution_result,
    }


@router.get("")
def list_proposals(status: str | None = None, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> list[dict]:
    stmt = select(Proposal).order_by(Proposal.created_at.desc()).limit(200)
    if status:
        stmt = stmt.where(Proposal.status == status)
    return [proposal_out(p) for p in db.scalars(stmt)]


@router.post("/{proposal_id}/approve")
def approve(proposal_id: str, body: ApproveIn, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    try:
        current = db.get(Proposal, proposal_id)
        edited = None
        if body.candidate_ids is not None and current is not None and current.type == "shortlist":
            edited = {"job_id": current.payload["job_id"], "candidate_ids": body.candidate_ids}
        service.approve(db, proposal_id, user, edited_payload=edited, note=body.note)
        db.commit()  # the human decision is recorded even if execution fails afterwards
    except service.ApprovalError as exc:
        db.rollback()
        raise HTTPException(exc.status_code, exc.message)
    except ValidationError as exc:
        db.rollback()
        raise HTTPException(422, f"Invalid edit: {exc.errors()[0]['msg']}")
    try:
        proposal = execute(db, proposal_id, user)
        db.commit()
    except GatewayError as exc:
        db.commit()  # keeps the 'failed' status and its audit entry
        raise HTTPException(409, f"Approved, but the action was refused: {exc}")
    return proposal_out(proposal)


@router.post("/{proposal_id}/reject")
def reject(proposal_id: str, body: RejectIn, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    try:
        proposal = service.reject(db, proposal_id, user, note=body.note)
        db.commit()
    except service.ApprovalError as exc:
        db.rollback()
        raise HTTPException(exc.status_code, exc.message)
    return proposal_out(proposal)
