"""Screening workflow as a LangGraph graph: fixed order, typed state, no loops.

extract_profile -> verify_evidence -> assess_criteria -> verify_assessments -> score
"""
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.screening.evidence import verify_assessments, verify_profile
from app.agents.screening.schemas import CandidateProfile, Criterion
from app.agents.screening.scoring import build_justification, compute_score


class ScreeningState(TypedDict, total=False):
    cv_text: str  # visible, sanitized text from the Security Guard
    criteria: list[dict]
    profile: dict
    identity_keys_dropped: list[str]
    rejected_evidence: list[dict]
    assessments: list[dict]
    results: list[dict]
    score: float
    must_have_met: int
    must_have_total: int
    justification: str
    engine: str


def build_screening_graph(engine):
    def _criteria(state: ScreeningState) -> list[Criterion]:
        return [Criterion.model_validate(c) for c in state["criteria"]]

    def extract_profile(state: ScreeningState) -> dict:
        profile, dropped = engine.extract_profile(state["cv_text"], _criteria(state))
        return {"profile": profile.model_dump(), "identity_keys_dropped": dropped, "engine": engine.label}

    def verify_evidence(state: ScreeningState) -> dict:
        verified, rejected = verify_profile(CandidateProfile.model_validate(state["profile"]), state["cv_text"])
        return {"profile": verified.model_dump(), "rejected_evidence": rejected}

    def assess_criteria(state: ScreeningState) -> dict:
        assessments = engine.assess(CandidateProfile.model_validate(state["profile"]), _criteria(state))
        return {"assessments": [a.model_dump() for a in assessments], "engine": engine.label}

    def verify(state: ScreeningState) -> dict:
        from app.agents.screening.schemas import CriterionAssessment

        results = verify_assessments(
            [CriterionAssessment.model_validate(a) for a in state["assessments"]],
            _criteria(state),
            CandidateProfile.model_validate(state["profile"]),
            state["cv_text"],
        )
        return {"results": results}

    def score(state: ScreeningState) -> dict:
        result = compute_score(state["results"])
        return {
            "score": result.score,
            "must_have_met": result.must_have_met,
            "must_have_total": result.must_have_total,
            "justification": build_justification(state["results"], result),
        }

    graph = StateGraph(ScreeningState)
    for name, fn in [
        ("extract_profile", extract_profile), ("verify_evidence", verify_evidence),
        ("assess_criteria", assess_criteria), ("verify_assessments", verify), ("score", score),
    ]:
        graph.add_node(name, fn)
    graph.add_edge(START, "extract_profile")
    graph.add_edge("extract_profile", "verify_evidence")
    graph.add_edge("verify_evidence", "assess_criteria")
    graph.add_edge("assess_criteria", "verify_assessments")
    graph.add_edge("verify_assessments", "score")
    graph.add_edge("score", END)
    return graph.compile()
