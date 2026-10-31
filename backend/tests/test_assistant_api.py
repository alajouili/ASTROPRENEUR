"""Member 3's assistant scenarios (Derja, French, English), run against the policy assistant
(POST /api/assistant/ask) and the real policy documents in data/policies.

The topics come from Member 3's assistant (salary increases, contracts and probation, workplace
conflicts, resignation); their content now lives in policy documents, so every answer has a source.
"""
from pathlib import Path

import pytest

from app.config import get_settings

POLICY_DIR = next((p for p in (Path("data/policies"), Path("../data/policies")) if p.is_dir()), None)
pytestmark = pytest.mark.skipif(POLICY_DIR is None, reason="data/policies is not available")


@pytest.fixture(autouse=True)
def real_policies(monkeypatch):
    from app.api import assistant as assistant_api
    monkeypatch.setattr(get_settings(), "policy_dir", POLICY_DIR)
    assistant_api._recent.clear()


def ask(api, question, history=None):
    res = api.post("/api/assistant/ask", json={"question": question, "history": history or []})
    assert res.status_code == 200, res.text
    return res.json()


def test_assistant_derja_salary_increase(as_role):
    data = ask(as_role("recruiter"), "kifeh nzid f salaire mte3i w chnowa na3mel m3a manager?")
    assert data["found"] is True
    assert data["sources"][0]["document"] == "Pay and Payslip Policy"
    assert "performance review" in data["answer"].lower()


def test_assistant_french_probation_period_cdi(as_role):
    data = ask(as_role("employee"), "Quelle est la durée de la période d'essai pour un cadre en CDI ?")
    assert data["found"] is True
    assert data["sources"][0]["section"] == "Probation period"
    assert "3 months" in data["answer"] and "6 months" in data["answer"]


def test_assistant_derja_workplace_conflict(as_role):
    data = ask(as_role("employee"), "3andi conflit m3a chef d'équipe chnowa na3mel?")
    assert data["found"] is True
    assert data["sources"][0]["document"] == "Workplace Conflict and Wellbeing Policy"


def test_assistant_resignation_notice(as_role):
    data = ask(as_role("employee"), "What is the notice period if I resign?")
    assert data["found"] is True and "1 to 3 months" in data["answer"]


def test_assistant_unauthenticated_fails(as_role):
    api = as_role(None)
    assert api.post("/api/assistant/ask", json={"question": "hello"}).status_code == 401


def test_unknown_question_gets_not_found_not_a_generic_answer(as_role):
    data = ask(as_role("employee"), "What is the capital of France?")
    assert data["found"] is False and data["sources"] == []


def test_one_shared_common_word_is_not_an_answer(as_role):
    # "data" in "data analyst" must not pull up the data-protection policy for an employee,
    # who cannot see the HR-only salary bands.
    data = ask(as_role("employee"), "What is the salary band for a junior data analyst?")
    assert data["found"] is False and "28,000" not in str(data)


def test_every_policy_document_loads_with_sections(as_role):
    status = as_role("hr_admin").get("/api/assistant/status").json()
    assert len(status["documents"]) == len(list(POLICY_DIR.glob("*.md")))
    employee = as_role("employee").get("/api/assistant/status").json()
    assert "Compensation Bands (HR only)" not in employee["documents"]
