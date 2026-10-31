from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from backend.app.db.models import PendingAction, AuditLog

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

async def create_pending_proposal(
    db: AsyncSession,
    candidate_id: str,
    action_type: str,
    payload: dict
) -> PendingAction:
    """
    Creates a pending action proposal that requires explicit human review and approval.
    The system NEVER executes this autonomously.
    """
    action = PendingAction(
        candidate_id=candidate_id,
        action_type=action_type,
        payload=payload,
        status="PENDING",
        created_at=utc_now()
    )
    db.add(action)
    await db.flush()
    return action

async def review_pending_action(
    db: AsyncSession,
    action_id: str,
    decision: str,  # "APPROVED" or "REJECTED"
    reviewer: str,
    review_notes: str | None = None,
    edited_payload: dict | None = None
) -> PendingAction:
    """
    Records human decision (approval or rejection) and optional human edits.
    """
    stmt = select(PendingAction).where(PendingAction.id == action_id)
    result = await db.execute(stmt)
    action = result.scalar_one_or_none()

    if not action:
        raise ValueError(f"Pending action with ID {action_id} not found.")

    if action.status not in ("PENDING", "REJECTED"):
        raise ValueError(f"Cannot review action in status '{action.status}'.")

    if decision not in ("APPROVED", "REJECTED"):
        raise ValueError(f"Invalid decision '{decision}'. Must be APPROVED or REJECTED.")

    action.status = decision
    action.reviewed_by = reviewer
    action.review_notes = review_notes
    action.reviewed_at = utc_now()

    if edited_payload:
        action.payload = edited_payload

    await db.flush()
    return action
