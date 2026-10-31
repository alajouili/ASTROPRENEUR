"""Interview Scheduling API.

Handles proposed interview time slots and creates human-approval proposals
for interview confirmations and calendar holds.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.proposals import proposal_out
from app.approvals.service import create_proposal
from app.auth.security import require_roles
from app.db import get_db
from app.models import User

router = APIRouter(prefix="/api/scheduling", tags=["scheduling"])
hr_only = require_roles("recruiter", "hr_admin")


class ScheduleProposalIn(BaseModel):
    candidate_id: str | None = None
    candidate_name: str | None = None
    candidate_email: str | None = None
    role: str | None = None
    slot: str | None = None
    interviewer: str = "Recruiter"
    day: str | None = None
    time: str | None = None


@router.post("/propose", status_code=status.HTTP_201_CREATED)
def propose_interview_slot(
    body: ScheduleProposalIn,
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> dict:
    """Creates a pending proposal for calendar hold / interview scheduling."""
    slot_label = body.slot or f"{body.day or 'Slot'} {body.time or ''}".strip() or "Interview Slot Hold"
    payload = {
        "candidate_id": body.candidate_id or f"cand-adhoc-{user.id[:8]}",
        "candidate_name": body.candidate_name or "Candidate",
        "candidate_email": body.candidate_email or "candidate@trusthr.demo",
        "role": body.role or "Position",
        "slot": slot_label,
        "interviewer": body.interviewer,
        "day": body.day,
        "time": body.time,
    }
    proposal = create_proposal(
        db,
        type="schedule_interview",
        job_id=None,
        payload=payload,
        evidence={"proposed_by": user.email, "interviewer": body.interviewer},
        risk_flags=[],
        created_by=f"user:{user.id}",
    )
    db.commit()
    return proposal_out(proposal)
