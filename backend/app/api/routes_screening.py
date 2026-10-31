from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.db.models import JobOffer, Candidate, CriterionEvaluation
from backend.app.orchestration.screening_graph import ScreeningOrchestrator

router = APIRouter(prefix="/api", tags=["Screening & Ranking"])

class JobCreateRequest(BaseModel):
    title: str
    department: str = "Engineering"
    description: str
    criteria: list[dict]  # [{name, weight, description, required}]

@router.post("/jobs")
async def create_job(payload: JobCreateRequest, db: AsyncSession = Depends(get_db)):
    job = JobOffer(
        title=payload.title,
        department=payload.department,
        description=payload.description,
        criteria=payload.criteria
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "criteria": job.criteria,
        "created_at": job.created_at
    }

@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    stmt = select(JobOffer).order_by(desc(JobOffer.created_at))
    res = await db.execute(stmt)
    jobs = res.scalars().all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "criteria_count": len(j.criteria),
            "created_at": j.created_at
        }
        for j in jobs
    ]

@router.get("/jobs/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(JobOffer).where(JobOffer.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job offer not found")
    return job

@router.post("/jobs/{job_id}/upload-resume")
async def upload_and_screen_resume(
    job_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(JobOffer).where(JobOffer.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job offer not found")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = await ScreeningOrchestrator.process_resume_submission(
        db=db,
        job_id=job.id,
        job_title=job.title,
        job_criteria=job.criteria,
        file_name=file.filename or "uploaded_resume.txt",
        file_bytes=file_bytes
    )

    if result.get("status") == "FILE_VALIDATION_FAILED":
        raise HTTPException(status_code=400, detail=result.get("errors", ["File validation error"]))

    await db.commit()

    return {
        "status": "SUCCESS",
        "candidate_id": result.get("candidate_id"),
        "candidate_profile": result.get("candidate_profile"),
        "overall_score": result.get("final_score"),
        "security_status": result.get("security_status"),
        "security_findings": result.get("security_findings"),
        "verified_evaluations": result.get("verified_evaluations"),
        "proposed_action": result.get("proposed_action")
    }

@router.get("/jobs/{job_id}/candidates")
async def get_ranked_candidates(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Candidate)
        .where(Candidate.job_id == job_id)
        .options(selectinload(Candidate.evaluations), selectinload(Candidate.pending_actions))
        .order_by(desc(Candidate.overall_score))
    )
    res = await db.execute(stmt)
    candidates = res.scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "file_name": c.file_name,
            "overall_score": c.overall_score,
            "security_status": c.security_status,
            "security_findings": c.security_findings,
            "status": c.status,
            "evaluations_count": len(c.evaluations),
            "pending_actions": [
                {"id": pa.id, "type": pa.action_type, "status": pa.status}
                for pa in c.pending_actions
            ],
            "created_at": c.created_at
        }
        for c in candidates
    ]

@router.get("/candidates/{candidate_id}")
async def get_candidate_details(candidate_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Candidate)
        .where(Candidate.id == candidate_id)
        .options(selectinload(Candidate.evaluations), selectinload(Candidate.pending_actions))
    )
    res = await db.execute(stmt)
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {
        "id": c.id,
        "job_id": c.job_id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "file_name": c.file_name,
        "file_hash": c.file_hash,
        "security_status": c.security_status,
        "security_findings": c.security_findings,
        "overall_score": c.overall_score,
        "evaluation_summary": c.evaluation_summary,
        "status": c.status,
        "created_at": c.created_at,
        "evaluations": [
            {
                "id": ev.id,
                "criterion_name": ev.criterion_name,
                "criterion_weight": ev.criterion_weight,
                "score": ev.score,
                "evidence_quote": ev.evidence_quote,
                "evidence_verified": ev.evidence_verified,
                "reasoning": ev.reasoning
            }
            for ev in c.evaluations
        ],
        "pending_actions": [
            {
                "id": pa.id,
                "action_type": pa.action_type,
                "status": pa.status,
                "payload": pa.payload,
                "reviewed_by": pa.reviewed_by,
                "review_notes": pa.review_notes,
                "created_at": pa.created_at,
                "reviewed_at": pa.reviewed_at,
                "executed_at": pa.executed_at
            }
            for pa in c.pending_actions
        ]
    }
