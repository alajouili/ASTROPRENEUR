"""Deterministic scoring and ranking. No LLM is involved in this file."""
from dataclasses import dataclass

RESULT_VALUE = {"met": 1.0, "partial": 0.5, "missing": 0.0}


@dataclass(frozen=True)
class ScoreResult:
    score: float  # 0..100
    must_have_met: int
    must_have_total: int
    missing_must: tuple[str, ...]


def compute_score(results: list[dict]) -> ScoreResult:
    total_weight = sum(r["weight"] for r in results)
    earned = sum(r["weight"] * RESULT_VALUE[r["result"]] for r in results)
    must = [r for r in results if r["kind"] == "must"]
    return ScoreResult(
        score=round(100.0 * earned / total_weight, 1) if total_weight else 0.0,
        must_have_met=sum(1 for r in must if r["result"] == "met"),
        must_have_total=len(must),
        missing_must=tuple(r["label"] for r in must if r["result"] != "met"),
    )


def rank_key(score: float, must_have_met: int, created_at_iso: str, candidate_id: str) -> tuple:
    """Higher score first, then more must-haves met, then earlier upload, then id (stable)."""
    return (-score, -must_have_met, created_at_iso, candidate_id)


def build_justification(results: list[dict], score: ScoreResult) -> str:
    """Short, job-criteria-only explanation built from verified evidence."""

    def cite(r: dict) -> str:
        return f'{r["label"]} ("{r["evidence"][0][:90]}")' if r["evidence"] else r["label"]

    met = [cite(r) for r in results if r["result"] == "met"]
    partial = [cite(r) for r in results if r["result"] == "partial"]
    missing = [f'{r["label"]} ({"must-have" if r["kind"] == "must" else "nice-to-have"})' for r in results if r["result"] == "missing"]
    parts = [f"Score {score.score:g}/100, {score.must_have_met} of {score.must_have_total} must-haves met."]
    if met:
        parts.append("Meets: " + "; ".join(met) + ".")
    if partial:
        parts.append("Partly meets: " + "; ".join(partial) + ".")
    if missing:
        parts.append("No evidence for: " + ", ".join(missing) + ".")
    return " ".join(parts)
