"""Tests for the Assistant & Policy Q&A endpoint."""


def test_assistant_chat_derja_salary(as_role):
    api = as_role("recruiter")
    res = api.post(
        "/api/assistant/chat",
        json={"query": "kifeh nzid f salaire mte3i w chnowa na3mel m3a manager?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["detected_language"] == "derja"
    assert "augmentation" in data["text"].lower() or "salaire" in data["text"].lower()
    assert data["confidence"] >= 0.90


def test_assistant_chat_french_contract(as_role):
    api = as_role("employee")
    res = api.post(
        "/api/assistant/chat",
        json={"query": "Quelle est la durée de la période d'essai pour un cadre en CDI ?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["detected_language"] == "fr"
    assert "période d'essai" in data["text"].lower() or "cdi" in data["text"].lower()
    assert data["confidence"] >= 0.90


def test_assistant_chat_conflict_resolution(as_role):
    api = as_role("employee")
    res = api.post(
        "/api/assistant/chat",
        json={"query": "3andi conflit m3a chef d'équipe chnowa na3mel?"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["detected_language"] == "derja"
    assert "conflit" in data["text"].lower() or "médiation" in data["text"].lower()


def test_assistant_chat_unauthenticated_fails(as_role):
    api = as_role(None)
    res = api.post("/api/assistant/chat", json={"query": "hello"})
    assert res.status_code in (401, 403)
