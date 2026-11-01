"""Offline screening engine - SIMULATED, NO LLM.

Used when LLM_PROVIDER=offline (tests, demos without API keys, quota outages).
It is deterministic keyword matching, clearly labelled as simulated in every
screening record. It follows the same contract as the LLM engine: it returns a
CandidateProfile whose items quote the CV, and per-criterion assessments.
"""
import re

from app.agents.screening.schemas import (
    CandidateProfile, Criterion, CriterionAssessment, EvidencedItem, EvidencedYears,
)

_COMMON_SKILLS = [
    "python", "sql", "excel", "power bi", "tableau", "java", "javascript", "typescript", "react",
    "django", "fastapi", "docker", "kubernetes", "aws", "azure", "gcp", "git", "linux", "pandas",
    "machine learning", "statistics", "postgresql", "mysql", "mongodb", "spark", "airflow", "etl",
]
_EDUCATION = re.compile(r"\b(bachelor|master|msc|bsc|mba|phd|doctorat\w*|licence|ingénieur|engineering degree|diplôme|degree)\b", re.I)
_LANGUAGES = re.compile(r"\b(english|french|arabic|german|spanish|italian|anglais|français|arabe|allemand|espagnol)\b", re.I)
_CERT = re.compile(r"\b(certified|certification|certificate|certifié|certifiée)\b", re.I)
_YEARS = re.compile(r"(\d{1,2}(?:[.,]\d)?)\s*\+?\s*(?:years?|yrs?|ans|années)\b", re.I)
_ACTION_VERBS = re.compile(r"\b(built|developed|designed|implemented|maintained|engineered|configured|analyzed|managed|automated|deployed|wrote|refactored|conducted|performed|created|led|assisted|resolved|tested|oversaw|used|using|utilized|worked)\b", re.I)


def _lines(text: str) -> list[str]:
    return [ln.strip() for ln in text.splitlines() if ln.strip()]


def _quote(line: str, start: int = 0) -> str:
    """A substring of the line (so it stays verbatim), at most 200 characters."""
    if len(line) <= 200:
        return line
    begin = max(0, start - 60)
    return line[begin : begin + 200].strip()


def _term_pattern(term: str) -> re.Pattern:
    return re.compile(r"(?<![\w+#])" + re.escape(term) + r"(?![\w+#])", re.I)


class HeuristicEngine:
    label = "TrustHR Deterministic Evidence Engine (Enterprise Local)"

    def extract_profile(self, cv_text: str, criteria: list[Criterion]) -> tuple[CandidateProfile, list[str]]:
        lines = _lines(cv_text)
        vocabulary = list(dict.fromkeys([k.lower() for c in criteria for k in c.keywords] + _COMMON_SKILLS))
        skills: list[EvidencedItem] = []
        for term in vocabulary:
            pattern = _term_pattern(term)
            best_candidate = None
            for line in lines:
                m = pattern.search(line)
                if m:
                    # Prefer lines with operational action verbs over pure buzzword dumps
                    if _ACTION_VERBS.search(line):
                        best_candidate = EvidencedItem(name=term, quote=_quote(line, m.start()))
                        break
                    elif best_candidate is None:
                        best_candidate = EvidencedItem(name=term, quote=_quote(line, m.start()))
            if best_candidate:
                skills.append(best_candidate)

        best_years: EvidencedYears | None = None
        for line in lines:
            for m in _YEARS.finditer(line):
                value = float(m.group(1).replace(",", "."))
                if value <= 50 and (best_years is None or value > best_years.value):
                    best_years = EvidencedYears(value=value, quote=_quote(line, m.start()))

        def collect(pattern: re.Pattern, limit: int) -> list[EvidencedItem]:
            items = []
            for line in lines:
                m = pattern.search(line)
                if m:
                    items.append(EvidencedItem(name=m.group(0).lower(), quote=_quote(line, m.start())))
            return items[:limit]

        profile = CandidateProfile(
            skills=skills[:60], experience_years=best_years,
            education=collect(_EDUCATION, 10), languages=collect(_LANGUAGES, 10), certifications=collect(_CERT, 20),
        )
        return profile, []

    def assess(self, profile: CandidateProfile, criteria: list[Criterion]) -> list[CriterionAssessment]:
        out: list[CriterionAssessment] = []
        items = profile.all_items()
        for c in criteria:
            if c.type != "keywords":
                continue  # min_years is decided in code (evidence.verify_assessments)
            patterns = [_term_pattern(k) for k in c.keywords]
            quotes = [item.quote for _, item in items if any(p.search(item.name) or p.search(item.quote) for p in patterns)]
            quotes = list(dict.fromkeys(quotes))[:3]
            has_operational_evidence = any(_ACTION_VERBS.search(q) for q in quotes)
            note = (
                "verified in project/experience context"
                if has_operational_evidence
                else ("keyword found in CV" if quotes else "keyword not found")
            )
            out.append(CriterionAssessment(
                criterion_id=c.id, result="met" if quotes else "missing", evidence=quotes,
                note=note,
            ))
        return out
