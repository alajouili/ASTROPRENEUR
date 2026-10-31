"""The dashboard's full journey through the API, one role at a time, as the browser does it:
login -> roles -> CV upload -> screening -> ranking -> approval -> audit -> logout.

Also pins the response fields that frontend/src/services/api.ts reads, so a backend
change that would break the dashboard fails here first. The same flow runs against a
live stack, through the real api.ts, in e2e/dashboard-api.e2e.mjs.
"""
from fastapi.testclient import TestClient

from app.main import create_app
from app.worker.runner import run_until_empty

# Fields api.ts maps (toJob, toCandidate, toEvaluation, toApproval, toAuditRecords, waitForTask).
JOB_FIELDS = {"id", "title", "description", "criteria", "created_at"}
RANKED_FIELDS = {"candidate_id", "display_name", "source_filename", "status", "score", "risk_level",
                 "risk_flags", "criteria_results", "justification", "rejected_evidence", "engine"}
NOT_RANKED_FIELDS = {"candidate_id", "display_name", "source_filename", "status", "risk_level", "risk_flags"}
CRITERION_FIELDS = {"criterion_id", "label", "kind", "weight", "result", "evidence", "note"}
FLAG_FIELDS = {"code", "severity", "detail", "excerpt"}
PROPOSAL_FIELDS = {"id", "type", "job_id", "payload", "evidence", "risk_flags", "status", "created_at",
                   "reviewed_by", "reviewed_at", "review_note"}
AUDIT_FIELDS = {"id", "at", "actor_type", "actor_id", "action", "entity_type", "entity_id", "details", "hash"}
TASK_FIELDS = {"id", "status", "progress_done", "progress_total", "error"}


def _has(row: dict, fields: set[str], what: str) -> None:
    missing = fields - row.keys()
    assert not missing, f"{what} is missing {sorted(missing)}: api.ts needs them"


def test_dashboard_flow_end_to_end(as_role, users, job, samples):
    # --- login and roles ---
    anonymous = TestClient(create_app())
    assert anonymous.get("/api/jobs").status_code == 401
    assert anonymous.get("/api/auth/me").status_code == 401

    employee = as_role("employee")
    assert employee.get("/api/auth/me").json()["user"]["role"] == "employee"
    for url in ("/api/jobs", f"/api/jobs/{job.id}/ranking", "/api/proposals", "/api/audit", "/api/audit/verify"):
        assert employee.get(url).status_code == 403, url

    recruiter = as_role("recruiter")
    me = recruiter.get("/api/auth/me").json()["user"]
    assert me["role"] == "recruiter" and me["id"] == users["recruiter"].id
    jobs = recruiter.get("/api/jobs").json()
    _has(jobs[0], JOB_FIELDS, "job")

    # --- upload: one file per request, like the upload dialog ---
    rejected = recruiter.post(f"/api/jobs/{job.id}/resumes",
                              files=[("files", ("notes.txt", b"not a cv", "text/plain"))]).json()
    assert rejected["accepted"] == [] and rejected["rejected"][0]["message"]
    names = ["amira_ben_salah", "twin_a_leila", "twin_b_karim", "attack_hidden_docx"]
    for name in names:
        up = recruiter.upload(job.id, [samples[name]])
        assert up.status_code == 200 and len(up.json()["accepted"]) == 1, up.text

    # --- screening: queued, run by the worker, polled ---
    no_csrf = recruiter.client.post(f"/api/jobs/{job.id}/screen")
    assert no_csrf.status_code == 403
    started = recruiter.post(f"/api/jobs/{job.id}/screen")
    assert started.status_code == 202
    assert run_until_empty() == 1
    task = recruiter.get(f"/api/tasks/{started.json()['task_id']}").json()
    _has(task, TASK_FIELDS, "task")
    assert task["status"] == "done" and task["progress_done"] == len(names)

    # --- ranking ---
    ranking = recruiter.get(f"/api/jobs/{job.id}/ranking").json()
    assert ranking["not_ranked"] == []
    ranked = ranking["ranked"]
    for row in ranked:
        _has(row, RANKED_FIELDS, "ranked row")
        for c in row["criteria_results"]:
            _has(c, CRITERION_FIELDS, "criterion result")
        for f in row["risk_flags"]:
            _has(f, FLAG_FIELDS, "risk flag")
    by_file = {r["source_filename"]: r for r in ranked}
    assert ranked[0]["source_filename"] == "amira_ben_salah.pdf"
    assert by_file["twin_a_leila.pdf"]["score"] == by_file["twin_b_karim.pdf"]["score"]
    assert by_file["attack_hidden_docx.docx"]["risk_level"] == "high"
    assert {r["status"] for r in ranked} == {"screened"}  # nothing decided before approval

    # --- approval: one pending shortlist, approved by the recruiter, run by the gateway ---
    pending = recruiter.get("/api/proposals?status=pending").json()
    assert len(pending) == 1
    proposal = pending[0]
    _has(proposal, PROPOSAL_FIELDS, "proposal")
    assert proposal["type"] == "shortlist" and proposal["job_id"] == job.id
    proposed = set(proposal["payload"]["candidate_ids"])
    assert by_file["amira_ben_salah.pdf"]["candidate_id"] in proposed
    assert by_file["attack_hidden_docx.docx"]["candidate_id"] not in proposed
    assert {"ranking", "needs_review", "missing_must_haves"} <= proposal["evidence"].keys()

    assert employee.post(f"/api/proposals/{proposal['id']}/approve", json={}).status_code == 403
    approved = recruiter.post(f"/api/proposals/{proposal['id']}/approve", json={"note": "dashboard e2e"})
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "executed"
    assert approved.json()["reviewed_by"] == users["recruiter"].id
    assert recruiter.post(f"/api/proposals/{proposal['id']}/approve", json={}).status_code == 409  # no replay

    after = {r["candidate_id"]: r["status"] for r in recruiter.get(f"/api/jobs/{job.id}/ranking").json()["ranked"]}
    assert {cid for cid, s in after.items() if s == "shortlisted"} == proposed

    # --- audit: HR admin only, chain intact, the approval names the recruiter ---
    assert recruiter.get("/api/audit").status_code == 403
    admin = as_role("hr_admin")
    entries = admin.get("/api/audit?limit=500").json()
    for e in entries:
        _has(e, AUDIT_FIELDS, "audit entry")
    assert admin.get("/api/audit/verify").json()["ok"] is True
    actions = {(e["action"], e["actor_id"]) for e in entries if e["entity_id"] == proposal["id"]}
    assert ("proposal.approved", users["recruiter"].id) in actions
    assert ("proposal.created", "agent:screening") in actions

    # --- logout ---
    out = recruiter.post("/api/auth/logout")
    assert out.status_code == 200
    assert recruiter.get("/api/auth/me").status_code == 401
