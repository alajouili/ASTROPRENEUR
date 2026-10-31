from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.db.models import PendingAction, Candidate
from backend.app.gateway.approval import review_pending_action
from backend.app.gateway.action_gateway import ActionGateway

router = APIRouter(prefix="/api/approvals", tags=["Human Approval Gateway"])

class ReviewRequest(BaseModel):
    decision: str  # "APPROVED" or "REJECTED"
    reviewer: str = "hr_recruiter_lead"
    review_notes: str | None = None
    edited_payload: dict | None = None

@router.get("")
async def list_pending_approvals(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(PendingAction)
        .options(selectinload(PendingAction.candidate))
        .order_by(desc(PendingAction.created_at))
    )
    res = await db.execute(stmt)
    actions = res.scalars().all()

    return [
        {
            "id": a.id,
            "candidate_id": a.candidate_id,
            "candidate_name": a.candidate.name if a.candidate else "Unknown",
            "candidate_email": a.candidate.email if a.candidate else "",
            "candidate_security_status": a.candidate.security_status if a.candidate else "CLEAN",
            "candidate_score": a.candidate.overall_score if a.candidate else 0.0,
            "action_type": a.action_type,
            "status": a.status,
            "payload": a.payload,
            "reviewed_by": a.reviewed_by,
            "review_notes": a.review_notes,
            "created_at": a.created_at,
            "reviewed_at": a.reviewed_at,
            "executed_at": a.executed_at
        }
        for a in actions
    ]

@router.post("/{action_id}/review")
async def review_action_endpoint(
    action_id: str,
    payload: ReviewRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        updated = await review_pending_action(
            db=db,
            action_id=action_id,
            decision=payload.decision,
            reviewer=payload.reviewer,
            review_notes=payload.review_notes,
            edited_payload=payload.edited_payload
        )
        await db.commit()
        return {
            "status": "SUCCESS",
            "action_id": updated.id,
            "new_status": updated.status,
            "reviewed_by": updated.reviewed_by,
            "reviewed_at": updated.reviewed_at
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{action_id}/dispatch")
async def dispatch_approved_action_endpoint(
    action_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        dispatch_result = await ActionGateway.dispatch_approved_action(
            db=db,
            action_id=action_id,
            actor="HR_AUTHORIZED_USER"
        )
        await db.commit()
        return {
            "status": "DISPATCHED",
            "action_id": action_id,
            "result": dispatch_result
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
