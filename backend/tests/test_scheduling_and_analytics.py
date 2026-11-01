"""Integration tests for persistent Interview Scheduling, Conflict Prevention,
Candidate Notes, and Grounded Recruitment Analytics.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.models import Candidate, CandidateNote, Interview, JobOffer, User


def test_scheduling_lifecycle_and_conflict_detection(db, users, as_role):
    rec = as_role("recruiter")
    now = datetime.now(timezone.utc)

    # 1. Schedule Interview 1
    slot_time = now + timedelta(days=2, hours=10)
    payload_1 = {
        "candidate_name": "Test Candidate Alpha",
        "candidate_email": "alpha.candidate@test.local",
        "role": "Backend Engineer",
        "interviewer": "Sarah Lead Architect",
        "interview_type": "online",
        "scheduled_at": slot_time.isoformat(),
        "duration_minutes": 45,
        "notes": "Initial technical screen",
    }
    r1 = rec.post("/api/scheduling/interviews", json=payload_1)
    assert r1.status_code == 201, r1.text
    data1 = r1.json()
    assert data1["mode"] == "interview_created"
    int1_id = data1["interview"]["id"]
    assert data1["interview"]["status"] == "scheduled"

    # 2. Attempt Overlapping Interview with SAME interviewer at same time (Conflict Check)
    overlap_payload = {
        "candidate_name": "Test Candidate Beta",
        "candidate_email": "beta.candidate@test.local",
        "role": "Backend Engineer",
        "interviewer": "Sarah Lead Architect",
        "interview_type": "online",
        "scheduled_at": (slot_time + timedelta(minutes=15)).isoformat(),  # overlaps!
        "duration_minutes": 45,
    }
    r_conflict = rec.post("/api/scheduling/interviews", json=overlap_payload)
    assert r_conflict.status_code == 409, "Should detect double-booking conflict"
    assert "conflict" in r_conflict.json()["detail"]["message"].lower()

    # 3. Reschedule Interview 1 to next day
    new_time = slot_time + timedelta(days=1)
    r_resched = rec.client.put(
        f"/api/scheduling/interviews/{int1_id}",
        json={"scheduled_at": new_time.isoformat(), "duration_minutes": 60},
        headers={"X-CSRF-Token": rec.csrf},
    )
    assert r_resched.status_code == 200, r_resched.text
    assert r_resched.json()["duration_minutes"] == 60

    # 4. Mark Interview as Completed
    r_comp = rec.post(f"/api/scheduling/interviews/{int1_id}/complete?feedback=Strong+architecture+answers")
    assert r_comp.status_code == 200
    assert r_comp.json()["status"] == "completed"

    # 5. Schedule and Cancel another interview
    payload_cancel = {
        "candidate_name": "Candidate Gamma",
        "candidate_email": "gamma@test.local",
        "role": "Data Analyst",
        "interviewer": "Rania Recruiter",
        "scheduled_at": (slot_time + timedelta(days=5)).isoformat(),
        "duration_minutes": 30,
    }
    r_sched2 = rec.post("/api/scheduling/interviews", json=payload_cancel)
    int2_id = r_sched2.json()["interview"]["id"]

    r_cancel = rec.post(f"/api/scheduling/interviews/{int2_id}/cancel?reason=Candidate+withdrew+application")
    assert r_cancel.status_code == 200
    assert r_cancel.json()["status"] == "cancelled"


def test_recruitment_analytics_endpoints(db, users, as_role):
    rec = as_role("recruiter")

    # 1. Overview
    r_over = rec.get("/api/analytics/overview")
    assert r_over.status_code == 200
    over_data = r_over.json()
    assert "total_candidates" in over_data
    assert "active_jobs" in over_data
    assert "interviews_scheduled" in over_data

    # 2. Funnel
    r_funnel = rec.get("/api/analytics/funnel")
    assert r_funnel.status_code == 200
    funnel_data = r_funnel.json()
    assert len(funnel_data["stages"]) == 5
    assert funnel_data["stages"][0]["stage"] == "Applied"

    # 3. Score Distribution
    r_dist = rec.get("/api/analytics/score-distribution")
    assert r_dist.status_code == 200
    dist_data = r_dist.json()
    assert len(dist_data["distribution"]) == 4
    assert "must_have_compliance" in dist_data


def test_candidate_notes_api(db, users, as_role):
    rec = as_role("recruiter")

    # Create dummy candidate first
    job = JobOffer(title="Test Job", description="Test", criteria=[], created_by=users["recruiter"].id)
    db.add(job)
    db.flush()

    cand = Candidate(
        job_id=job.id,
        display_name="Notes Test Candidate",
        source_filename="test.pdf",
        stored_path="test.pdf",
        file_sha256="abc",
        file_kind="pdf",
    )
    db.add(cand)
    db.commit()

    # 1. Post Note
    r_post = rec.post(
        f"/api/candidates/{cand.id}/notes",
        json={"content": "Strong technical skills in asyncio and concurrency."},
    )
    assert r_post.status_code == 201, r_post.text
    note_id = r_post.json()["id"]

    # 2. Get Notes
    r_get = rec.get(f"/api/candidates/{cand.id}/notes")
    assert r_get.status_code == 200
    notes = r_get.json()
    assert len(notes) >= 1
    assert notes[0]["id"] == note_id
    assert "asyncio" in notes[0]["content"]
