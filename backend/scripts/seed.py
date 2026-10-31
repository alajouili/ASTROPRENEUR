"""Create demo users and a demo job offer. All people and data are fictional.

Passwords come from the environment (SEED_RECRUITER_PASSWORD, SEED_ADMIN_PASSWORD,
SEED_EMPLOYEE_PASSWORD). If one is missing, a random password is generated and
printed once. No password is ever hard-coded.

Run from backend/:  python -m scripts.seed
"""
import os
import secrets

from sqlalchemy import select

from app.audit.log import append as audit
from app.auth.security import hash_password
from app.db import get_sessionmaker, init_db
from app.models import JobOffer, User

DEMO_USERS = [
    ("recruiter@trusthr.demo", "Rania Recruiter", "recruiter", "SEED_RECRUITER_PASSWORD"),
    ("admin@trusthr.demo", "Hedi HR Admin", "hr_admin", "SEED_ADMIN_PASSWORD"),
    ("employee@trusthr.demo", "Eya Employee", "employee", "SEED_EMPLOYEE_PASSWORD"),
]

DEMO_JOB = {
    "title": "Junior Data Analyst",
    "description": "Analyse business data, build dashboards and write SQL queries for the finance team (fictional job).",
    "criteria": [
        {"id": "python", "label": "Python", "kind": "must", "weight": 3, "type": "keywords", "keywords": ["python", "pandas"]},
        {"id": "sql", "label": "SQL", "kind": "must", "weight": 3, "type": "keywords", "keywords": ["sql", "postgresql", "mysql"]},
        {"id": "experience", "label": "2+ years of experience", "kind": "must", "weight": 2, "type": "min_years", "min_years": 2},
        {"id": "bi", "label": "BI dashboards", "kind": "nice", "weight": 2, "type": "keywords", "keywords": ["power bi", "tableau"]},
        {"id": "stats", "label": "Statistics", "kind": "nice", "weight": 2, "type": "keywords", "keywords": ["statistics", "statistiques", "regression"]},
        {"id": "english", "label": "English", "kind": "nice", "weight": 1, "type": "keywords", "keywords": ["english", "anglais"]},
    ],
}


def seed() -> None:
    init_db()
    db = get_sessionmaker()()
    try:
        recruiter = None
        for email, name, role, env_var in DEMO_USERS:
            user = db.scalar(select(User).where(User.email == email))
            if user is None:
                password = os.environ.get(env_var) or secrets.token_urlsafe(12)
                user = User(email=email, full_name=name, role=role, password_hash=hash_password(password))
                db.add(user)
                db.flush()
                shown = "(from env)" if os.environ.get(env_var) else password
                print(f"created {role:10s} {email}  password: {shown}")
            if role == "recruiter":
                recruiter = user
        if db.scalar(select(JobOffer).where(JobOffer.title == DEMO_JOB["title"])) is None:
            job = JobOffer(created_by=recruiter.id, **DEMO_JOB)
            db.add(job)
            db.flush()
            audit(db, actor_type="system", actor_id="seed", action="job.created", entity_type="job", entity_id=job.id)
            print(f"created job: {job.title} ({job.id})")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
