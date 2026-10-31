import pytest
from backend.app.security.evidence_verifier import (
    verify_quote_against_source,
    calculate_deterministic_ranking_score
)

def test_verify_quote_exact_match():
    source = "Architected and delivered high-performance FastAPI microservices handling 25,000 requests per second."
    quote = "FastAPI microservices handling 25,000 requests per second"
    verified, conf, matched = verify_quote_against_source(source, quote)
    assert verified is True
    assert conf >= 0.9

def test_verify_quote_rejects_hallucination():
    source = "Alice Mercer has experience with Python, FastAPI, and basic SQLite."
    fake_quote = "Managed a cluster of 500 Kubernetes nodes and trained large LLMs at scale"
    verified, conf, matched = verify_quote_against_source(source, fake_quote)
    assert verified is False
    assert "not found" in matched.lower()

def test_calculate_deterministic_ranking_score_penalizes_unverified():
    evaluations = [
        {
            "criterion_name": "Python Systems",
            "criterion_weight": 2.0,
            "score": 90.0,
            "evidence_quote": "Extensive experience in FastAPI microservices",
            "evidence_verified": True,
            "reasoning": "Verified"
        },
        {
            "criterion_name": "Kubernetes Architecture",
            "criterion_weight": 1.0,
            "score": 100.0,  # Claimed 100
            "evidence_quote": "Fabricated quote never present in CV",
            "evidence_verified": False,  # Verification failed!
            "reasoning": "Unverified claim"
        }
    ]

    final_score, updated = calculate_deterministic_ranking_score(evaluations)
    
    # Python Systems: 90 * 2.0 = 180
    # Kubernetes: penalized to 0.0 * 1.0 = 0
    # Total weighted sum = 180 / 3.0 = 60.0
    assert final_score == 60.0
    assert updated[1]["score"] == 0.0
    assert "PENALIZED" in updated[1]["reasoning"]

def test_mathematical_weighted_average_correctness():
    evaluations = [
        {"criterion_weight": 3.0, "score": 80.0, "evidence_verified": True},
        {"criterion_weight": 1.0, "score": 40.0, "evidence_verified": True}
    ]
    # (3*80 + 1*40) / 4 = (240 + 40) / 4 = 280 / 4 = 70.0
    final_score, _ = calculate_deterministic_ranking_score(evaluations)
    assert final_score == 70.0
