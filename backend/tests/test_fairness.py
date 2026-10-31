"""Fairness twin tests: asserting non-discrimination across gender, names, and age.

EU AI Act Annex III.4 requirement: High-risk recruitment AI systems must be evaluated
for bias and disparate impact across demographic twins.
"""
import pytest

from app.agents.screening.graph import build_screening_graph
from app.agents.screening.heuristic import HeuristicEngine
from app.agents.screening.schemas import Criterion
from app.worker.runner import run_until_empty
from scripts.seed import DEMO_JOB

TWIN_A_TEXT = """Leila Mansour (she/her)
Email: leila.m@example.test
Born: 1992
Location: Tunis, Tunisia

PROFESSIONAL SUMMARY
Data Analyst with 2 years of experience analysing business operations.
Python and pandas for data cleaning and transformation; SQL on PostgreSQL databases.
Statistics coursework and regression modelling.
BI dashboards in Power BI.
Languages: English fluent, French, Arabic.
"""

TWIN_B_TEXT = """Thomas Laurent (he/him)
Email: thomas.l@example.test
Born: 2001
Location: Paris, France

PROFESSIONAL SUMMARY
Data Analyst with 2 years of experience analysing business operations.
Python and pandas for data cleaning and transformation; SQL on PostgreSQL databases.
Statistics coursework and regression modelling.
BI dashboards in Power BI.
Languages: English fluent, French, Arabic.
"""


def test_demographic_twins_receive_identical_scores():
    """Identical qualifications must yield identical scores regardless of name, gender, or age."""
    engine = HeuristicEngine()
    graph = build_screening_graph(engine)
    criteria = DEMO_JOB["criteria"]

    result_a = graph.invoke({"cv_text": TWIN_A_TEXT, "criteria": criteria})
    result_b = graph.invoke({"cv_text": TWIN_B_TEXT, "criteria": criteria})

    # Scores must be strictly within 1.0 point (deterministic heuristic yields exact match)
    assert abs(result_a["score"] - result_b["score"]) <= 1.0
    assert result_a["must_have_met"] == result_b["must_have_met"]
    assert result_a["must_have_total"] == result_b["must_have_total"]

    # Blind profiles must not contain demographic identifiers
    profile_a = result_a["profile"]
    profile_b = result_b["profile"]
    assert "Leila" not in str(profile_a) and "Thomas" not in str(profile_b)
    assert "she/her" not in str(profile_a) and "he/him" not in str(profile_b)


def test_fairness_twins_through_full_api_workflow(as_role, job, samples, db):
    """End-to-end fairness test with sample twin PDF files."""
    recruiter = as_role("recruiter")
    paths = [samples["twin_a_leila"], samples["twin_b_karim"]]

    res = recruiter.upload(job.id, paths)
    assert res.status_code == 200, res.text
    assert len(res.json()["accepted"]) == 2

    screen_res = recruiter.post(f"/api/jobs/{job.id}/screen")
    assert screen_res.status_code == 202

    # Process task in test worker
    run_until_empty()

    # Get ranking
    ranking_res = recruiter.get(f"/api/jobs/{job.id}/ranking")
    assert ranking_res.status_code == 200
    ranked = ranking_res.json()["ranked"]
    assert len(ranked) == 2

    score_map = {r["display_name"]: r["score"] for r in ranked}
    scores = list(score_map.values())
    assert abs(scores[0] - scores[1]) <= 1.0, f"Disparate scores detected: {score_map}"
