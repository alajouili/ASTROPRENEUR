"""Golden rule: the agent executes, the human decides. Nothing happens without approval."""
import pytest
from sqlalchemy import select

from app.approvals import service
from app.gateway.executor import GatewayError, execute
from app.models import Candidate, JobOffer, Proposal
from app.worker.runner import run_until_empty


@pytest.fixture
def pending(as_role, job, samples, db):
    api = as_role("recruiter")
    api.upload(job.id, [samples[n] for n in ("amira_ben_salah", "sara_khelifi", "youssef_trabelsi")])
    api.post(f"/api/jobs/{job.id}/screen")
    run_until_empty()
    proposal = db.scalar(select(Proposal).where(Proposal.status == "pending"))
    assert proposal is not None
    return api, proposal


def _statuses(db) -> set[str]:
    db.expire_all()
    return {c.status for c in db.scalars(select(Candidate))}


def test_gateway_refuses_a_pending_proposal(pending, db, users):
    _, proposal = pending
    with pytest.raises(GatewayError, match="need human approval"):
        execute(db, proposal.id, users["recruiter"])
    db.rollback()
    assert _statuses(db) == {"screened"}


def test_rejected_proposal_can_never_execute(pending, db, users):
    api, proposal = pending
    assert api.post(f"/api/proposals/{proposal.id}/reject", json={"note": "not now"}).json()["status"] == "rejected"
    assert api.post(f"/api/proposals/{proposal.id}/approve", json={}).status_code == 409
    with pytest.raises(GatewayError):
        execute(db, proposal.id, users["recruiter"])
    db.rollback()
    assert _statuses(db) == {"screened"}


def test_approval_cannot_be_replayed(pending):
    api, proposal = pending
    assert api.post(f"/api/proposals/{proposal.id}/approve", json={}).status_code == 200
    assert api.post(f"/api/proposals/{proposal.id}/approve", json={}).status_code == 409


def test_employee_cannot_see_or_approve_proposals(pending, as_role):
    _, proposal = pending
    employee = as_role("employee")
    assert employee.get("/api/proposals").status_code == 403
    assert employee.post(f"/api/proposals/{proposal.id}/approve", json={}).status_code == 403


def test_missing_csrf_token_blocks_approval(pending, db):
    api, proposal = pending
    r = api.client.post(f"/api/proposals/{proposal.id}/approve", json={})  # no X-CSRF-Token header
    assert r.status_code == 403
    assert _statuses(db) == {"screened"}


def test_hr_can_edit_the_shortlist_before_approving(pending, db):
    api, proposal = pending
    keep = proposal.payload["candidate_ids"][:1]
    r = api.post(f"/api/proposals/{proposal.id}/approve", json={"candidate_ids": keep})
    assert r.status_code == 200 and r.json()["status"] == "executed"
    db.expire_all()
    assert {c.id for c in db.scalars(select(Candidate).where(Candidate.status == "shortlisted"))} == set(keep)


def test_hr_can_still_shortlist_a_flagged_candidate_it_reviewed(as_role, job, samples, db):
    api = as_role("recruiter")
    api.upload(job.id, [samples["amira_ben_salah"], samples["attack_white_text_youssef"]])
    api.post(f"/api/jobs/{job.id}/screen")
    run_until_empty()
    proposal = db.scalar(select(Proposal).where(Proposal.status == "pending"))
    flagged = proposal.evidence["needs_review"][0]["candidate_id"]
    assert flagged not in proposal.payload["candidate_ids"]
    ids = proposal.payload["candidate_ids"] + [flagged]  # the human decides, after review
    assert api.post(f"/api/proposals/{proposal.id}/approve", json={"candidate_ids": ids}).status_code == 200
    db.expire_all()
    assert db.get(Candidate, flagged).status == "shortlisted"


def test_gateway_refuses_candidates_from_another_job(pending, db, users):
    api, proposal = pending
    other_job = JobOffer(title="Other", criteria=[], created_by=users["recruiter"].id)
    db.add(other_job)
    db.flush()
    stranger = Candidate(job_id=other_job.id, display_name="x", source_filename="x.pdf", stored_path="/nope",
                         file_sha256="0" * 64, file_kind="pdf", status="screened")
    db.add(stranger)
    db.commit()
    r = api.post(f"/api/proposals/{proposal.id}/approve", json={"candidate_ids": [stranger.id]})
    assert r.status_code == 409
    db.expire_all()
    assert db.get(Proposal, proposal.id).status == "failed"
    assert _statuses(db) == {"screened"}


def test_gateway_refuses_a_payload_changed_after_approval(pending, db, users):
    _, proposal = pending
    service.approve(db, proposal.id, users["recruiter"])
    db.commit()
    p = db.get(Proposal, proposal.id)
    p.payload = {**p.payload, "candidate_ids": list(reversed(p.payload["candidate_ids"]))[:1]}  # tamper, hash unchanged
    db.commit()
    with pytest.raises(GatewayError, match="payload changed"):
        execute(db, proposal.id, users["recruiter"])
    db.rollback()
    assert _statuses(db) == {"screened"}
