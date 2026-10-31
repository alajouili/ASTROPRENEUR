"""Tests for the Security Scan API endpoint (POST /api/scan/pdf).

Member 2 security deliverable: on-demand forensic inspection of candidate CVs.
"""
def test_scan_pdf_detects_hidden_white_text_attack(as_role, samples):
    recruiter = as_role("recruiter")
    attack_path = samples["attack_white_text_youssef"]
    
    files = {"file": (attack_path.name, attack_path.read_bytes(), "application/pdf")}
    res = recruiter.post("/api/scan/pdf", files=files)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["is_malicious"] is True
    assert len(data["hidden_text_flags"]) > 0
    reasons = {h["reason"] for h in data["hidden_text_flags"]}
    assert "white_text" in reasons


def test_scan_pdf_passes_clean_resume(as_role, samples):
    recruiter = as_role("recruiter")
    clean_path = samples["amira_ben_salah"]

    files = {"file": (clean_path.name, clean_path.read_bytes(), "application/pdf")}
    res = recruiter.post("/api/scan/pdf", files=files)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["is_malicious"] is False
    assert data["risk_level"] in ("none", "clean")
    assert data["hidden_text_flags"] == []


def test_inbox_triage_and_propose_reply(as_role):
    recruiter = as_role("recruiter")
    inbox_res = recruiter.get("/api/inbox")
    assert inbox_res.status_code == 200
    messages = inbox_res.json()
    assert len(messages) >= 2
    # Verify prompt injection scanning flagged the attack email
    attack_msg = next((m for m in messages if m["is_suspicious"]), None)
    assert attack_msg is not None

    # Propose a reply to a clean email
    clean_msg = next(m for m in messages if not m["is_suspicious"])
    reply_res = recruiter.post(
        f"/api/inbox/{clean_msg['id']}/propose-reply",
        json={
            "to_email": clean_msg["sender_email"],
            "subject": f"Re: {clean_msg['subject']}",
            "body": "Thank you for reaching out. We would be pleased to schedule an interview next week.",
        },
    )
    assert reply_res.status_code == 201
    proposal = reply_res.json()
    assert proposal["type"] == "send_email"
    assert proposal["status"] == "pending"


def test_scheduling_propose_slot(as_role):
    recruiter = as_role("recruiter")
    res = recruiter.post(
        "/api/scheduling/propose",
        json={
            "candidate_name": "Amira Ben Salah",
            "candidate_email": "amira.bensalah@topmail.tn",
            "role": "Senior Backend Engineer",
            "interviewer": "Sarah (Lead Architect)",
            "day": "Wednesday",
            "time": "14:00 - 15:00 UTC",
        },
    )
    assert res.status_code == 201
    proposal = res.json()
    assert proposal["type"] == "schedule_interview"
    assert proposal["status"] == "pending"
    assert proposal["payload"]["candidate_name"] == "Amira Ben Salah"

