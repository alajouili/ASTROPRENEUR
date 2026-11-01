"""Interview Scheduling & Calendar API.

Provides full lifecycle management for recruitment interviews:
- Persistent database storage in the `interviews` table
- Monthly, weekly, daily and agenda calendar feeds
- Conflict detection and overlap prevention
- Rescheduling and cancellation with tamper-evident audit logging
- Human-in-the-loop approval integration (EU AI Act Art. 14)
"""
from datetime import datetime, timedelta, timezone
from typing import Literal
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.api.proposals import proposal_out
from app.approvals.service import create_proposal
from app.audit.log import append as audit
from app.auth.security import require_roles
from app.db import get_db
from app.models import Interview, User, INTERVIEW_STATUSES, INTERVIEW_TYPES

router = APIRouter(prefix="/api/scheduling", tags=["scheduling"])
hr_only = require_roles("recruiter", "hr_admin")


# --- Schemas ---

class ScheduleProposalIn(BaseModel):
    candidate_id: str | None = None
    candidate_name: str | None = None
    candidate_email: str | None = None
    role: str | None = None
    slot: str | None = None
    interviewer: str = "Recruiter"
    day: str | None = None
    time: str | None = None


class InterviewCreateIn(BaseModel):
    candidate_id: str | None = None
    job_id: str | None = None
    candidate_name: str = Field(min_length=1, max_length=255)
    candidate_email: str = Field(min_length=3, max_length=255)
    role: str = Field(min_length=1, max_length=255)
    interviewer: str = Field(min_length=1, max_length=255)
    interviewer_email: str | None = None
    interview_type: Literal["online", "phone", "in_person"] = "online"
    location_or_link: str | None = None
    scheduled_at: datetime
    duration_minutes: int = Field(default=45, ge=15, le=240)
    notes: str | None = None
    route_to_approval: bool = False  # If True, creates proposal for Human Action Gateway approval


class InterviewUpdateIn(BaseModel):
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=15, le=240)
    interviewer: str | None = None
    interview_type: Literal["online", "phone", "in_person"] | None = None
    location_or_link: str | None = None
    notes: str | None = None
    status: Literal["scheduled", "confirmed", "completed", "cancelled"] | None = None


class InterviewOut(BaseModel):
    id: str
    candidate_id: str | None
    job_id: str | None
    candidate_name: str
    candidate_email: str
    role: str
    interviewer: str
    interviewer_email: str | None
    interview_type: str
    location_or_link: str | None
    scheduled_at: datetime
    end_at: datetime
    duration_minutes: int
    status: str
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


def _to_interview_out(i: Interview) -> dict:
    end = i.scheduled_at + timedelta(minutes=i.duration_minutes)
    return {
        "id": i.id,
        "candidate_id": i.candidate_id,
        "job_id": i.job_id,
        "candidate_name": i.candidate_name,
        "candidate_email": i.candidate_email,
        "role": i.role,
        "interviewer": i.interviewer,
        "interviewer_email": i.interviewer_email,
        "interview_type": i.interview_type,
        "location_or_link": i.location_or_link,
        "scheduled_at": i.scheduled_at.isoformat() if i.scheduled_at else None,
        "end_at": end.isoformat() if i.scheduled_at else None,
        "duration_minutes": i.duration_minutes,
        "status": i.status,
        "notes": i.notes,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    }


def _check_overlap(
    db: Session,
    interviewer: str,
    candidate_email: str,
    scheduled_at: datetime,
    duration_minutes: int,
    exclude_id: str | None = None,
) -> list[str]:
    """Detects time slot overlap for either the interviewer or the candidate."""
    end_at = scheduled_at + timedelta(minutes=duration_minutes)
    query = select(Interview).where(
        Interview.status.in_(["scheduled", "confirmed"]),
        or_(
            Interview.interviewer == interviewer,
            Interview.candidate_email == candidate_email,
        ),
    )
    if exclude_id:
        query = query.where(Interview.id != exclude_id)

    candidates = db.scalars(query).all()
    conflicts = []
    for item in candidates:
        item_end = item.scheduled_at + timedelta(minutes=item.duration_minutes)
        # Check if interval [scheduled_at, end_at] overlaps with [item.scheduled_at, item_end]
        if max(scheduled_at, item.scheduled_at) < min(end_at, item_end):
            reason = (
                f"Double-booked interviewer '{interviewer}'"
                if item.interviewer == interviewer
                else f"Candidate '{candidate_email}' already scheduled"
            )
            conflicts.append(
                f"{reason} on {item.scheduled_at.strftime('%Y-%m-%d %H:%M UTC')} "
                f"for '{item.role}' (Interview ID: {item.id[:8]})"
            )
    return conflicts


# --- Endpoints ---

@router.get("/interviews")
def list_interviews(
    job_id: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    interviewer: str | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> list[dict]:
    """Lists persistent interviews with optional filtering by status, date range, job, or interviewer."""
    query = select(Interview)
    if job_id:
        query = query.where(Interview.job_id == job_id)
    if status_filter and status_filter != "all":
        query = query.where(Interview.status == status_filter)
    if interviewer:
        query = query.where(Interview.interviewer.ilike(f"%{interviewer}%"))
    if from_date:
        query = query.where(Interview.scheduled_at >= from_date)
    if to_date:
        query = query.where(Interview.scheduled_at <= to_date)

    query = query.order_by(Interview.scheduled_at.asc())
    interviews = db.scalars(query).all()
    return [_to_interview_out(i) for i in interviews]


@router.post("/interviews", status_code=status.HTTP_201_CREATED)
def create_interview(
    body: InterviewCreateIn,
    force: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> dict:
    """Schedules a new recruitment interview with conflict verification and audit logging."""
    conflicts = _check_overlap(
        db,
        interviewer=body.interviewer,
        candidate_email=body.candidate_email,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
    )
    if conflicts and not force:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Interview scheduling conflict detected", "conflicts": conflicts},
        )

    # If recruiter opted for approval queue routing
    if body.route_to_approval:
        payload = {
            "candidate_id": body.candidate_id or f"cand-adhoc-{user.id[:8]}",
            "candidate_name": body.candidate_name,
            "candidate_email": body.candidate_email,
            "role": body.role,
            "interviewer": body.interviewer,
            "scheduled_at": body.scheduled_at.isoformat(),
            "duration_minutes": body.duration_minutes,
            "interview_type": body.interview_type,
            "location_or_link": body.location_or_link,
            "notes": body.notes,
        }
        prop = create_proposal(
            db,
            type="schedule_interview",
            job_id=body.job_id,
            payload=payload,
            evidence={"proposed_by": user.email, "interviewer": body.interviewer},
            risk_flags=[],
            created_by=f"user:{user.id}",
        )
        db.commit()
        return {"mode": "proposal_created", "proposal": proposal_out(prop)}

    # Direct persistent creation
    interview = Interview(
        id=str(uuid.uuid4()),
        candidate_id=body.candidate_id,
        job_id=body.job_id,
        candidate_name=body.candidate_name,
        candidate_email=body.candidate_email,
        role=body.role,
        interviewer=body.interviewer,
        interviewer_email=body.interviewer_email,
        interview_type=body.interview_type,
        location_or_link=body.location_or_link or ("https://meet.google.com/trusthr-room" if body.interview_type == "online" else "Tunis HQ Meeting Room A"),
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        status="scheduled",
        notes=body.notes,
        created_by=f"user:{user.id}",
    )
    db.add(interview)
    audit(
        db,
        actor_type="user",
        actor_id=user.id,
        action="interview.scheduled",
        entity_type="interview",
        entity_id=interview.id,
        details={
            "candidate_name": interview.candidate_name,
            "interviewer": interview.interviewer,
            "scheduled_at": interview.scheduled_at.isoformat(),
            "duration": interview.duration_minutes,
            "conflicts_overridden": bool(conflicts and force),
        },
    )
    db.commit()
    return {"mode": "interview_created", "interview": _to_interview_out(interview)}


@router.put("/interviews/{interview_id}")
def update_or_reschedule_interview(
    interview_id: str,
    body: InterviewUpdateIn,
    force: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> dict:
    """Updates interview details or reschedules date/time with conflict validation."""
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")

    new_time = body.scheduled_at or interview.scheduled_at
    new_duration = body.duration_minutes or interview.duration_minutes
    new_interviewer = body.interviewer or interview.interviewer

    if body.scheduled_at or body.duration_minutes or body.interviewer:
        conflicts = _check_overlap(
            db,
            interviewer=new_interviewer,
            candidate_email=interview.candidate_email,
            scheduled_at=new_time,
            duration_minutes=new_duration,
            exclude_id=interview.id,
        )
        if conflicts and not force:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "Rescheduling conflict detected", "conflicts": conflicts},
            )

    if body.scheduled_at:
        interview.scheduled_at = body.scheduled_at
    if body.duration_minutes:
        interview.duration_minutes = body.duration_minutes
    if body.interviewer:
        interview.interviewer = body.interviewer
    if body.interview_type:
        interview.interview_type = body.interview_type
    if body.location_or_link is not None:
        interview.location_or_link = body.location_or_link
    if body.notes is not None:
        interview.notes = body.notes
    if body.status:
        interview.status = body.status

    audit(
        db,
        actor_type="user",
        actor_id=user.id,
        action="interview.updated",
        entity_type="interview",
        entity_id=interview.id,
        details={
            "scheduled_at": interview.scheduled_at.isoformat(),
            "status": interview.status,
            "interviewer": interview.interviewer,
        },
    )
    db.commit()
    return _to_interview_out(interview)


@router.post("/interviews/{interview_id}/cancel")
def cancel_interview(
    interview_id: str,
    reason: str = Query(default="Recruiter requested cancellation"),
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> dict:
    """Cancels an active interview and logs the reason to the cryptographic audit trail."""
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")

    interview.status = "cancelled"
    interview.notes = f"{interview.notes or ''}\n[Cancelled]: {reason}".strip()

    audit(
        db,
        actor_type="user",
        actor_id=user.id,
        action="interview.cancelled",
        entity_type="interview",
        entity_id=interview.id,
        details={"reason": reason, "candidate_name": interview.candidate_name},
    )
    db.commit()
    return {"status": "cancelled", "interview": _to_interview_out(interview)}


@router.post("/interviews/{interview_id}/complete")
def complete_interview(
    interview_id: str,
    feedback: str = Query(default=""),
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> dict:
    """Marks an interview as completed with recruiter feedback."""
    interview = db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")

    interview.status = "completed"
    if feedback:
        interview.notes = f"{interview.notes or ''}\n[Feedback]: {feedback}".strip()

    audit(
        db,
        actor_type="user",
        actor_id=user.id,
        action="interview.completed",
        entity_type="interview",
        entity_id=interview.id,
        details={"feedback": feedback[:200], "candidate_name": interview.candidate_name},
    )
    db.commit()
    return {"status": "completed", "interview": _to_interview_out(interview)}


@router.get("/conflicts")
def check_scheduling_conflicts(
    interviewer: str,
    candidate_email: str,
    scheduled_at: datetime,
    duration_minutes: int = 45,
    db: Session = Depends(get_db),
    user: User = Depends(hr_only),
) -> dict:
    """Validates if a proposed time slot has conflicts before form submission."""
    conflicts = _check_overlap(
        db,
        interviewer=interviewer,
        candidate_email=candidate_email,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
    )
    return {"has_conflicts": len(conflicts) > 0, "conflicts": conflicts}


# Legacy compatibility endpoint
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
