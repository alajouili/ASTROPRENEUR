"""Job offers, CV upload, screening and ranking."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.screening.schemas import Criterion
from app.agents.screening.service import ranked_screenings
from app.audit.log import append as audit
from app.auth.security import HR_ROLES, require_roles
from app.config import get_settings
from app.db import get_db
from app.models import BackgroundTask, Candidate, JobOffer, Screening, User
from app.security.files import FileRejected, safe_display_name, store_upload, validate_upload
from app.worker.runner import enqueue

router = APIRouter(prefix="/api", tags=["jobs"])
hr_only = require_roles(*HR_ROLES)


class JobIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=5000)
    criteria: list[Criterion] = Field(min_length=1, max_length=15)

    @field_validator("criteria")
    @classmethod
    def _unique_ids(cls, v: list[Criterion]) -> list[Criterion]:
        if len({c.id for c in v}) != len(v):
            raise ValueError("criterion ids must be unique")
        return v


def job_out(job: JobOffer) -> dict:
    return {"id": job.id, "title": job.title, "description": job.description, "criteria": job.criteria,
            "created_at": job.created_at.isoformat()}


def _get_job(db: Session, job_id: str) -> JobOffer:
    job = db.get(JobOffer, job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


@router.get("/jobs")
def list_jobs(db: Session = Depends(get_db), user: User = Depends(hr_only)) -> list[dict]:
    return [job_out(j) for j in db.scalars(select(JobOffer).order_by(JobOffer.created_at.desc()))]


@router.post("/jobs", status_code=201)
def create_job(body: JobIn, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    job = JobOffer(title=body.title, description=body.description,
                   criteria=[c.model_dump() for c in body.criteria], created_by=user.id)
    db.add(job)
    db.flush()
    audit(db, actor_type="user", actor_id=user.id, action="job.created", entity_type="job", entity_id=job.id,
          details={"title": job.title, "criteria": [c["id"] for c in job.criteria]})
    db.commit()
    return job_out(job)


@router.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    return job_out(_get_job(db, job_id))


@router.post("/jobs/{job_id}/resumes")
async def upload_resumes(job_id: str, files: list[UploadFile] = File(...), db: Session = Depends(get_db),
                         user: User = Depends(hr_only)) -> dict:
    settings = get_settings()
    job = _get_job(db, job_id)
    if len(files) > settings.max_files_per_batch:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"At most {settings.max_files_per_batch} files per batch")
    known = set(db.scalars(select(Candidate.file_sha256).where(Candidate.job_id == job.id)))
    accepted, rejected = [], []
    for upload in files:
        name = safe_display_name(upload.filename or "")
        content = await upload.read(settings.max_upload_bytes + 1)  # never read more than the limit
        try:
            kind = validate_upload(name, content, settings)
            stored = store_upload(content, kind, settings)
        except FileRejected as exc:
            rejected.append({"filename": name, "reason": exc.code, "message": exc.message})
            continue
        if stored.sha256 in known:
            stored.path.unlink(missing_ok=True)
            rejected.append({"filename": name, "reason": "duplicate", "message": "This file was already uploaded for this job."})
            continue
        known.add(stored.sha256)
        stem = " ".join(name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").split()).title()
        candidate = Candidate(job_id=job.id, display_name=stem[:255] or "Candidate", source_filename=name,
                              stored_path=str(stored.path), file_sha256=stored.sha256, file_kind=kind)
        db.add(candidate)
        db.flush()
        audit(db, actor_type="user", actor_id=user.id, action="candidate.uploaded", entity_type="candidate",
              entity_id=candidate.id, details={"filename": name, "sha256": stored.sha256})
        accepted.append({"candidate_id": candidate.id, "filename": name})
    db.commit()
    return {"accepted": accepted, "rejected": rejected}


@router.post("/jobs/{job_id}/screen", status_code=202)
def start_screening(job_id: str, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    job = _get_job(db, job_id)
    pending = db.scalar(select(Candidate.id).where(Candidate.job_id == job.id, Candidate.status == "received").limit(1))
    if pending is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "No new CVs to screen for this job")
    task = enqueue(db, type="screen_job", payload={"job_id": job.id}, created_by=user.id)
    audit(db, actor_type="user", actor_id=user.id, action="screening.requested", entity_type="job", entity_id=job.id,
          details={"task_id": task.id})
    db.commit()
    return {"task_id": task.id, "status": task.status}


@router.get("/tasks/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    task = db.get(BackgroundTask, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return {"id": task.id, "type": task.type, "status": task.status, "progress_done": task.progress_done,
            "progress_total": task.progress_total, "error": task.error, "result": task.payload.get("result")}


@router.get("/candidates/{candidate_id}")
def get_candidate_detail(candidate_id: str, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    cand = db.get(Candidate, candidate_id)
    if not cand:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    screening = db.scalar(select(Screening).where(Screening.candidate_id == cand.id))

    raw_text = ""
    try:
        from pathlib import Path
        path = Path(cand.stored_path)
        if path.exists():
            from app.security.extract import extract
            extraction = extract(path.read_bytes(), cand.file_kind)
            raw_text = extraction.visible_text
    except Exception:
        raw_text = ""

    return {
        "id": cand.id,
        "job_id": cand.job_id,
        "display_name": cand.display_name,
        "email": cand.email,
        "source_filename": cand.source_filename,
        "status": cand.status,
        "risk_level": cand.risk_level,
        "risk_flags": cand.risk_flags,
        "file_kind": cand.file_kind,
        "resume_text": raw_text,
        "screening": {
            "score": screening.score,
            "must_have_met": screening.must_have_met,
            "must_have_total": screening.must_have_total,
            "justification": screening.justification,
            "criteria_results": screening.criteria_results,
            "rejected_evidence": screening.rejected_evidence,
            "blind_profile": screening.blind_profile,
            "engine": screening.engine,
        } if screening else None,
    }


@router.get("/jobs/{job_id}/ranking")
def ranking(job_id: str, db: Session = Depends(get_db), user: User = Depends(hr_only)) -> dict:
    job = _get_job(db, job_id)
    ranked = ranked_screenings(db, job.id)
    rows = [{
        "rank": i + 1, "candidate_id": c.id, "display_name": c.display_name, "source_filename": c.source_filename,
        "status": c.status, "score": s.score, "must_have_met": s.must_have_met, "must_have_total": s.must_have_total,
        "justification": s.justification, "criteria_results": s.criteria_results, "risk_level": c.risk_level,
        "risk_flags": c.risk_flags, "rejected_evidence": s.rejected_evidence, "engine": s.engine,
    } for i, (c, s) in enumerate(ranked)]
    screened_ids = {r["candidate_id"] for r in rows}
    others = [{"candidate_id": c.id, "display_name": c.display_name, "source_filename": c.source_filename,
               "status": c.status, "risk_level": c.risk_level, "risk_flags": c.risk_flags}
              for c in db.scalars(select(Candidate).where(Candidate.job_id == job.id)) if c.id not in screened_ids]
    return {"job": job_out(job), "ranked": rows, "not_ranked": others}
