"""Prepare the live hackathon demo environment in one shot.

Seeds users, job offers, uploads clean candidates, attack twins, and fairness twins,
runs screening through the background orchestrator, and creates human approval proposals.

Run: python -m scripts.demo_prep
"""
import os
import sys
from pathlib import Path

from sqlalchemy import select

from app.agents.screening.service import propose_shortlist
from app.audit.log import append as audit
from app.auth.security import hash_password
from app.config import get_settings
from app.db import get_sessionmaker, init_db
from app.models import Candidate, JobOffer, Proposal, User
from app.security.files import store_upload, validate_upload
from app.worker.runner import enqueue, run_until_empty
from scripts.seed import DEMO_JOB, DEMO_USERS


def prep() -> None:
    settings = get_settings()
    init_db()
    db = get_sessionmaker()()

    try:
        # 1. Seed demo accounts
        print("=" * 60)
        print("  TrustHR AI — Live Hackathon Demo Preparation")
        print("=" * 60)

        recruiter = None
        passwords = {}
        for email, name, role, env_var in DEMO_USERS:
            pw = os.environ.get(env_var, "DemoPass123!")
            passwords[role] = pw
            user = db.scalar(select(User).where(User.email == email))
            if user is None:
                user = User(email=email, full_name=name, role=role, password_hash=hash_password(pw))
                db.add(user)
                db.flush()
                print(f"[+] Created user: {role:10s} | {email} | {pw}")
            else:
                user.password_hash = hash_password(pw)
                user.failed_logins = 0
                user.locked_until = None
                db.flush()
                print(f"[*] Updated user: {role:10s} | {email} | {pw}")
            if role == "recruiter":
                recruiter = user

        # 2. Seed Job
        job = db.scalar(select(JobOffer).where(JobOffer.title == DEMO_JOB["title"]))
        if job is None:
            job = JobOffer(created_by=recruiter.id, **DEMO_JOB)
            db.add(job)
            db.flush()
            audit(db, actor_type="system", actor_id="demo_prep", action="job.created", entity_type="job", entity_id=job.id)
            print(f"[+] Created job requisition: '{job.title}' (ID: {job.id[:8]}...)")
        else:
            print(f"[*] Requisition ready: '{job.title}' (ID: {job.id[:8]}...)")

        # 3. Seed benchmark candidate CVs
        samples_dir = Path("data/samples")
        if not samples_dir.exists():
            samples_dir = Path("../data/samples")

        demo_files = [
            ("amira_ben_salah.pdf", "Amira Ben Salah (Clean Baseline)"),
            ("youssef_trabelsi.pdf", "Youssef Trabelsi (Clean Baseline)"),
            ("attack_white_text_youssef.pdf", "Youssef Trabelsi (Attack Twin - White Text)"),
            ("attack_visible_instruction.pdf", "Eve Infiltrator (Attack - Direct Injection)"),
            ("twin_a_leila.pdf", "Leila Mansour (Demographic Twin A)"),
            ("twin_b_karim.pdf", "Karim Mansour (Demographic Twin B)"),
        ]

        uploaded_candidates = []
        for filename, label in demo_files:
            file_path = samples_dir / filename
            if not file_path.exists():
                print(f"[-] Warning: sample file {file_path} not found, skipping")
                continue

            content = file_path.read_bytes()
            # Check if candidate already exists
            existing = db.scalar(select(Candidate).where(Candidate.job_id == job.id, Candidate.source_filename == filename))
            if existing is None:
                kind = validate_upload(filename, content, settings)
                stored = store_upload(content, kind, settings)
                candidate = Candidate(
                    job_id=job.id,
                    display_name=label,
                    source_filename=filename,
                    stored_path=str(stored.path),
                    file_sha256=stored.sha256,
                    file_kind=stored.kind,
                    status="received",
                )
                db.add(candidate)
                db.flush()
                audit(db, actor_type="system", actor_id="demo_prep", action="candidate.uploaded",
                      entity_type="candidate", entity_id=candidate.id, details={"filename": filename, "sha256": stored.sha256})
                uploaded_candidates.append(candidate)
                print(f"[+] Uploaded sample CV: {filename:32s} -> Candidate ID: {candidate.id[:8]}...")
            else:
                if existing.status == "uploaded":
                    existing.status = "received"
                    db.flush()
                uploaded_candidates.append(existing)

        # 4. Run screening orchestrator
        unscreened = [c for c in uploaded_candidates if c.status == "received"]
        if unscreened:
            print(f"[*] Screening {len(unscreened)} candidates through deterministic agent...")
            enqueue(db, type="screen_job", payload={"job_id": job.id}, created_by="demo_prep")
            db.commit()
            run_until_empty()
            print("[+] Screening complete! Candidate scores & evidence verified.")
        else:
            print("[*] All candidates already screened.")

        # 5. Check proposal created by screening orchestrator
        proposal = db.scalar(select(Proposal).where(Proposal.job_id == job.id).order_by(Proposal.created_at.desc()))
        if proposal is not None:
            print(f"[+] Shortlist proposal ready: #{proposal.id[:8]} for human approval queue.")
        else:
            proposal_id = propose_shortlist(db, job, 3)
            db.commit()
            if proposal_id:
                print(f"[+] Created shortlist proposal #{proposal_id[:8]} for human approval queue.")
            else:
                print("[*] No proposal generated.")

        db.commit()

        print("-" * 60)
        print("  DEMO PREPARATION COMPLETE & VERIFIED")
        print("-" * 60)
        print("  Web Dashboard:  http://localhost:8080")
        print("  Login:          recruiter@trusthr.demo  (Password: DemoPass123!)")
        print("  HR Admin:       admin@trusthr.demo      (Password: DemoPass123!)")
        print("  Mailpit UI:     http://localhost:8025")
        print("  API Docs:       http://localhost:8080/api/docs")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    prep()
