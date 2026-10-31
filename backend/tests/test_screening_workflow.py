"""End-to-end: upload -> Guard -> screening graph -> ranking -> pending proposal -> HR approval -> audit."""
import json

from sqlalchemy import select

from app.models import Candidate, Screening
from app.worker.runner import run_until_empty

ALL = ["amira_ben_salah", "sara_khelifi", "youssef_trabelsi", "mehdi_jaziri",
       "attack_white_text_youssef", "attack_tiny_font_fr", "attack_visible_instruction", "attack_hidden_docx"]


def _screen(api, job_id, paths) -> dict:
    up = api.upload(job_id, paths)
    assert up.status_code == 200, up.text
    assert len(up.json()["accepted"]) == len(paths), up.json()
    r = api.post(f"/api/jobs/{job_id}/screen")
    assert r.status_code == 202, r.text
    assert run_until_empty() == 1
    task = api.get(f"/api/tasks/{r.json()['task_id']}").json()
    assert task["status"] == "done", task
    assert task["progress_done"] == task["progress_total"] == len(paths)
    return api.get(f"/api/jobs/{job_id}/ranking").json()


def test_screening_workflow_end_to_end(as_role, job, samples):
    recruiter = as_role("recruiter")
    ranking = _screen(recruiter, job.id, [samples[n] for n in ALL])
    ranked = ranking["ranked"]
    by_file = {r["source_filename"]: r for r in ranked}
    assert len(ranked) == 8 and ranking["not_ranked"] == []

    # The genuinely qualified candidates come first.
    assert {ranked[0]["source_filename"], ranked[1]["source_filename"]} == {"amira_ben_salah.pdf", "sara_khelifi.pdf"}
    assert ranked[0]["score"] == 100.0

    # Evidence-based: every met/partial criterion carries a quote; the engine is labelled.
    for row in ranked:
        assert "SIMULATED" in row["engine"]
        for c in row["criteria_results"]:
            assert c["result"] == "missing" or c["evidence"], (row["source_filename"], c)

    # Attacks are flagged high and gain nothing.
    clean, attack = by_file["youssef_trabelsi.pdf"], by_file["attack_white_text_youssef.pdf"]
    assert attack["risk_level"] == "high" and clean["risk_level"] == "none"
    assert attack["score"] == clean["score"]
    tiny = by_file["attack_tiny_font_fr.pdf"]
    assert tiny["risk_level"] == "high" and tiny["score"] < 20
    docx_attack = by_file["attack_hidden_docx.docx"]
    results = {c["criterion_id"]: c["result"] for c in docx_attack["criteria_results"]}
    assert results["python"] == results["sql"] == results["bi"] == "missing"  # hidden "expert" claims ignored
    assert by_file["attack_visible_instruction.pdf"]["risk_level"] == "high"

    # Justifications cite job criteria only.
    assert ranked[0]["justification"].startswith("Score 100/100, 3 of 3 must-haves met.")

    # No decision yet: everyone is only "screened", and one shortlist proposal waits for a human.
    assert {r["status"] for r in ranked} == {"screened"}
    pending = recruiter.get("/api/proposals?status=pending").json()
    assert len(pending) == 1 and pending[0]["type"] == "shortlist"
    proposal = pending[0]
    # Only clean CVs that meet every must-have are proposed; high-risk CVs go to manual review.
    eligible = [r for r in ranked if r["risk_level"] != "high" and r["must_have_met"] == r["must_have_total"]]
    assert proposal["payload"]["candidate_ids"] == [r["candidate_id"] for r in eligible[:5]]
    assert len(proposal["payload"]["candidate_ids"]) == 2  # amira and sara; youssef and mehdi miss must-haves
    missing = {x["candidate_id"] for x in proposal["evidence"]["missing_must_haves"]}
    assert missing == {r["candidate_id"] for r in ranked if r["risk_level"] != "high" and r["candidate_id"] not in set(proposal["payload"]["candidate_ids"])}
    review_ids = {x["candidate_id"] for x in proposal["evidence"]["needs_review"]}
    assert review_ids == {r["candidate_id"] for r in ranked if r["risk_level"] == "high"} and len(review_ids) == 4

    # HR approves -> the Action Gateway records the status, and only for the approved candidates.
    r = recruiter.post(f"/api/proposals/{proposal['id']}/approve", json={"note": "looks right"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "executed"
    after = {row["candidate_id"]: row["status"] for row in recruiter.get(f"/api/jobs/{job.id}/ranking").json()["ranked"]}
    shortlisted = set(proposal["payload"]["candidate_ids"])
    assert {cid for cid, st in after.items() if st == "shortlisted"} == shortlisted
    assert all(st == "screened" for cid, st in after.items() if cid not in shortlisted)

    # The whole story is in a valid, hash-chained audit log.
    admin = as_role("hr_admin")
    assert admin.get("/api/audit/verify").json()["ok"] is True
    actions = [e["action"] for e in admin.get("/api/audit").json()]
    for expected in ("candidate.uploaded", "screening.requested", "candidate.screened", "proposal.created",
                     "proposal.approved", "candidate.status_changed", "action.executed"):
        assert expected in actions, expected


def test_identity_does_not_change_the_score(as_role, job, samples, db):
    """Fairness: same professional content, different name, pronouns and birth year."""
    ranking = _screen(as_role("recruiter"), job.id, [samples["twin_a_leila"], samples["twin_b_karim"]])
    a, b = ranking["ranked"]
    assert a["score"] == b["score"] and a["criteria_results"] == b["criteria_results"]
    for s in db.scalars(select(Screening)):
        blob = json.dumps(s.blind_profile).lower()
        for identity in ("leila", "karim", "mansour", "she/her", "he/him", "1990", "2001", "@example"):
            assert identity not in blob, identity


def test_contact_email_is_kept_outside_the_scored_profile(as_role, job, samples, db):
    _screen(as_role("recruiter"), job.id, [samples["amira_ben_salah"]])
    candidate = db.scalar(select(Candidate))
    screening = db.scalar(select(Screening))
    assert candidate.email == "amira.bensalah@example.test"
    assert "example.test" not in json.dumps(screening.blind_profile)


def test_upload_rejects_bad_and_duplicate_files(as_role, job, samples):
    api = as_role("recruiter")
    files = [
        ("files", ("evil.exe", b"MZ", "application/octet-stream")),
        ("files", ("fake.pdf", b"not a pdf", "application/pdf")),
        ("files", ("amira.pdf", samples["amira_ben_salah"].read_bytes(), "application/pdf")),
        ("files", ("amira_again.pdf", samples["amira_ben_salah"].read_bytes(), "application/pdf")),
    ]
    body = api.post(f"/api/jobs/{job.id}/resumes", files=files).json()
    assert [a["filename"] for a in body["accepted"]] == ["amira.pdf"]
    assert {r["reason"] for r in body["rejected"]} == {"unsupported_type", "type_mismatch", "duplicate"}


def test_screening_with_nothing_new_is_refused(as_role, job):
    assert as_role("recruiter").post(f"/api/jobs/{job.id}/screen").status_code == 409
