"""Evidence verification: every claim must quote the CV, and the quote must really be there.

Quotes are checked against the *visible, sanitized* CV text, so a quote taken from
hidden text can never count as evidence. Quotes that themselves contain an
injection pattern are rejected too.
"""
import re
import unicodedata

from app.agents.screening.schemas import CandidateProfile, Criterion, CriterionAssessment
from app.security.injection import scan_rules

_PUNCT_MAP = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "})
_NEGATION_RE = re.compile(r"\b(no|never|without|sans|jamais|aucun|aucune)\b", re.IGNORECASE)


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).translate(_PUNCT_MAP).casefold()
    return re.sub(r"\s+", " ", text).strip()


def quote_in_text(quote: str, normalized_cv: str) -> bool:
    q = normalize(quote).strip(" .,;:-•*")
    return len(q) >= 3 and q in normalized_cv


def contains_negation(quote: str) -> bool:
    return bool(_NEGATION_RE.search(quote))


def matches_criterion_keywords(quote: str, criterion: Criterion) -> bool:
    """The quote must contain at least one of the criterion's keywords or label words."""
    q_norm = normalize(quote)
    targets = [normalize(kw) for kw in (criterion.keywords or []) if len(kw) >= 2]
    if not targets:
        targets = [w for w in re.findall(r"\w+", normalize(criterion.label)) if len(w) >= 3]
    return any(t in q_norm for t in targets)


def _usable_quote(quote: str, normalized_cv: str) -> tuple[bool, str]:
    if not quote_in_text(quote, normalized_cv):
        return False, "quote_not_found"
    if scan_rules(quote):
        return False, "quote_contains_instruction"
    return True, ""


def verify_profile(profile: CandidateProfile, cv_text: str) -> tuple[CandidateProfile, list[dict]]:
    """Drop every profile item whose quote is not verbatim in the CV."""
    cv = normalize(cv_text)
    rejected: list[dict] = []
    kept: dict[str, list] = {"skills": [], "education": [], "languages": [], "certifications": []}
    for field_name, item in profile.all_items():
        ok, reason = _usable_quote(item.quote, cv)
        if ok:
            kept[field_name].append(item)
        else:
            rejected.append({"field": field_name, "name": item.name, "quote": item.quote[:160], "reason": reason})
    years = profile.experience_years
    if years is not None:
        ok, reason = _usable_quote(years.quote, cv)
        if not ok:
            rejected.append({"field": "experience_years", "name": str(years.value), "quote": years.quote[:160], "reason": reason})
            years = None
    return CandidateProfile(experience_years=years, **kept), rejected


def verify_assessments(
    assessments: list[CriterionAssessment], criteria: list[Criterion], profile: CandidateProfile, cv_text: str
) -> list[dict]:
    """One result per job criterion, in criteria order. Unknown criteria are ignored,
    missing ones count as 'missing', and 'met'/'partial' without a verified quote is downgraded."""
    cv = normalize(cv_text)
    by_id = {a.criterion_id: a for a in assessments}
    results: list[dict] = []
    for criterion in criteria:
        if criterion.type == "min_years":
            results.append(_years_result(criterion, profile))
            continue
        a = by_id.get(criterion.id)
        result, note = (a.result, a.note) if a else ("missing", "not assessed")

        valid_evidence: list[str] = []
        for q in (a.evidence if a else []):
            usable, _ = _usable_quote(q, cv)
            if not usable:
                continue
            if contains_negation(q):
                continue
            if not matches_criterion_keywords(q, criterion):
                continue
            valid_evidence.append(q)

        evidence = valid_evidence[:3]
        downgraded = False
        if result in ("met", "partial") and not evidence:
            result, note, downgraded = "missing", "claimed without a verifiable relevant quote from the CV", True
        results.append({
            "criterion_id": criterion.id, "label": criterion.label, "kind": criterion.kind, "weight": criterion.weight,
            "result": result, "evidence": [q[:200] for q in evidence], "note": note[:240], "downgraded": downgraded,
        })
    return results


def _years_result(criterion: Criterion, profile: CandidateProfile) -> dict:
    """Experience thresholds are decided in code from the verified number, never by the LLM."""
    years = profile.experience_years
    need = float(criterion.min_years or 0)
    if years is None:
        result, evidence, note = "missing", [], "no verifiable years of experience"
    else:
        result = "met" if years.value >= need else ("partial" if years.value >= need / 2 else "missing")
        evidence, note = [years.quote[:200]], f"{years.value:g} years vs {need:g} required"
    return {
        "criterion_id": criterion.id, "label": criterion.label, "kind": criterion.kind, "weight": criterion.weight,
        "result": result, "evidence": evidence, "note": note, "downgraded": False,
    }
