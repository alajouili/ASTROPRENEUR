"""Test setup: a real PostgreSQL test database, rebuilt for every test.

TEST_DATABASE_URL must point to a dedicated, disposable database: the schema is dropped
before every test. Example: postgresql+psycopg://trusthr:PASSWORD@localhost:5432/trusthr_test
"""
import os
import secrets
import tempfile
from pathlib import Path

os.environ["APP_ENV"] = "test"
if not os.environ.get("TEST_DATABASE_URL"):
    raise RuntimeError("Set TEST_DATABASE_URL to a disposable PostgreSQL database (its schema is wiped by the tests).")
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ["JWT_SECRET"] = secrets.token_hex(32)
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="trusthr-uploads-")
os.environ["LLM_PROVIDER"] = "offline"
os.environ["PROMPT_GUARD_MODE"] = "off"
os.environ["EMBEDDED_WORKER"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.api import auth as auth_api  # noqa: E402
from app.auth.security import CSRF_HEADER, hash_password  # noqa: E402
from app.db import get_engine, get_sessionmaker, init_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import JobOffer, User  # noqa: E402
from scripts.make_sample_cvs import generate  # noqa: E402
from scripts.seed import DEMO_JOB  # noqa: E402

PASSWORDS = {role: secrets.token_urlsafe(16) for role in ("recruiter", "hr_admin", "employee")}


@pytest.fixture(autouse=True)
def fresh_db():
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    init_db()
    auth_api._attempts.clear()
    yield
    engine.dispose()


@pytest.fixture
def db():
    session = get_sessionmaker()()
    yield session
    session.close()


@pytest.fixture
def users(db) -> dict[str, User]:
    out = {}
    for role, pw in PASSWORDS.items():
        u = User(email=f"{role}@test.local", full_name=role.title(), role=role, password_hash=hash_password(pw))
        db.add(u)
        out[role] = u
    db.commit()
    return out


@pytest.fixture
def job(db, users) -> JobOffer:
    j = JobOffer(created_by=users["recruiter"].id, **DEMO_JOB)
    db.add(j)
    db.commit()
    return j


@pytest.fixture(scope="session")
def samples() -> dict[str, Path]:
    out = Path(tempfile.mkdtemp(prefix="trusthr-samples-"))
    return {p.stem: p for p in generate(out)}


class Api:
    """A logged-in browser session: cookies + CSRF header handled like the frontend does."""

    def __init__(self, role: str | None):
        self.client = TestClient(create_app())
        self.csrf = ""
        if role:
            r = self.client.post("/api/auth/login", json={"email": f"{role}@test.local", "password": PASSWORDS[role]})
            assert r.status_code == 200, r.text
            self.csrf = r.json()["csrf_token"]

    def get(self, url, **kw):
        return self.client.get(url, **kw)

    def post(self, url, **kw):
        headers = {CSRF_HEADER: self.csrf, **kw.pop("headers", {})}
        return self.client.post(url, headers=headers, **kw)

    def upload(self, job_id: str, paths: list[Path]):
        files = [("files", (p.name, p.read_bytes(), "application/octet-stream")) for p in paths]
        return self.post(f"/api/jobs/{job_id}/resumes", files=files)


@pytest.fixture
def as_role(users):
    def _make(role: str | None) -> Api:
        return Api(role)

    return _make
