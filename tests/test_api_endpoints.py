import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session import engine, Base

@pytest_asyncio.fixture(autouse=True)
async def init_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "TrustHR AI"

@pytest.mark.asyncio
async def test_create_and_list_jobs_endpoint():
    job_payload = {
        "title": "Lead Security Engineer",
        "department": "InfoSec",
        "description": "Lead cloud security and threat mitigation",
        "criteria": [
            {"name": "Threat Modeling", "weight": 2.0, "description": "STRIDE and MITRE ATT&CK", "required": True}
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/jobs", json=job_payload)
        assert res.status_code == 200
        created = res.json()
        assert created["title"] == "Lead Security Engineer"
        job_id = created["id"]

        list_res = await ac.get("/api/jobs")
        assert list_res.status_code == 200
        jobs = list_res.json()
        assert any(j["id"] == job_id for j in jobs)

@pytest.mark.asyncio
async def test_full_screening_via_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create job
        job_payload = {
            "title": "Backend Architect",
            "department": "Engineering",
            "description": "Python, FastAPI",
            "criteria": [
                {"name": "Python FastAPI", "weight": 1.0, "description": "FastAPI systems", "required": True}
            ]
        }
        res = await ac.post("/api/jobs", json=job_payload)
        job_id = res.json()["id"]

        # Upload resume
        cv_content = b"Alice Mercer\nEmail: alice@work.internal\nExperienced Python developer building FastAPI microservices."
        files = {"file": ("alice_resume.txt", cv_content, "text/plain")}
        upload_res = await ac.post(f"/api/jobs/{job_id}/upload-resume", files=files)
        assert upload_res.status_code == 200
        data = upload_res.json()
        assert data["status"] == "SUCCESS"
        assert data["candidate_profile"]["name"] == "Alice Mercer"
        assert data["security_status"] == "CLEAN"
        assert data["proposed_action"]["status"] == "PENDING"
        action_id = data["proposed_action"]["id"]

        # Review approval
        review_res = await ac.post(f"/api/approvals/{action_id}/review", json={
            "decision": "APPROVED",
            "reviewer": "recruiter_dave",
            "review_notes": "All criteria met"
        })
        assert review_res.status_code == 200
        assert review_res.json()["new_status"] == "APPROVED"

        # Dispatch action
        dispatch_res = await ac.post(f"/api/approvals/{action_id}/dispatch")
        assert dispatch_res.status_code == 200
        assert dispatch_res.json()["status"] == "DISPATCHED"

        # Check Audit Trail
        audit_res = await ac.get("/api/audit")
        assert audit_res.status_code == 200
        audit_data = audit_res.json()
        assert audit_data["integrity_verified"] is True
        assert len(audit_data["logs"]) >= 2
