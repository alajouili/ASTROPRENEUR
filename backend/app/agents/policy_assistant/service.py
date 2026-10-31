"""Policy Assistant: answers employee questions from company policy documents only.

retrieve (role-filtered BM25) -> answer:
- LLM mode (Gemini/Groq configured): the model writes the answer from the retrieved
  passages only, and must cite them; uncited or unknown sources are refused.
- Offline mode (no LLM, or the LLM fails): the answer quotes the most relevant sentences of
  the best passage, labelled as such. Nothing is invented in either mode.
If nothing relevant is found, it says so and points to HR. It reads policy documents only:
never candidates, emails or other records.
"""
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field

from app.agents.llm import LLMClient, LLMError
from app.agents.policy_assistant.knowledge import (
    AUDIENCES_BY_ROLE, Passage, PolicyIndex, load_policies, query_terms, tokenize,
)
from app.agents.prompts.policy_assistant import SYSTEM, user_prompt
from app.security.injection import scan_rules

OFFLINE_MODE = "offline-retrieval (SIMULATED, no LLM)"
MIN_SCORE = 3.0        # best passage below this: "not found"
FOLLOW_UP_TERMS = 6    # a question with this few content words reuses the previous question
HR_CONTACT = "hr@trusthr.demo"
NOT_FOUND = (f"I could not find this in the company policies available to you. "
             f"Please contact HR at {HR_CONTACT}.")
REFUSED = ("I can only answer questions about the company's HR policies, such as leave, remote work, "
           "benefits, training or data protection.")
NO_PEOPLE = ("I don't have access to candidate or employee records and can't share information about specific "
             "people. Recruiters review candidates in the Screening and Approvals pages.")
# Questions that rank or look up specific people: out of scope, whatever the policies say.
# Policy questions that merely mention employees ("how much sick leave do employees get?") pass.
_PERSONAL = r"(salary|salaries|pay|earnings|address|phone|age|performance|score|rating|health|sick\s+leave)"
_ABOUT_PEOPLE = re.compile(
    # ranking candidates: "best candidate", "who should we hire", "top applicants"
    r"\b(best|top|worst|strongest|weakest|rank\w*|score\w*|shortlist\w*|reject\w*)\b[^?.!]{0,40}"
    r"\b(candidates?|applicants?|cvs?|resumes?)\b|"
    r"\b(who|which)\b[^?.!]{0,30}\b(candidates?|applicants?|should\s+(we|i)\s+hire)\b|"
    # looking up someone: "which employees are on sick leave", "who is absent"
    r"\b(who|which)\b[^?.!]{0,20}\b(employees?|colleagues?|people|staff|persons?)\b[^?.!]{0,15}"
    r"\b(are|is|was|were)\s+(on|off|sick|absent|fired|leaving|pregnant)\b|"
    # personal data of a specific person: "salary of my colleague", "my manager's salary", "Sara's address"
    rf"\b{_PERSONAL}\b[^?.!]{{0,20}}\b(of|for)\s+(my|our|this|that)\s+"
    r"(colleagues?|co-?workers?|manager|boss|team\s*mates?|candidates?|applicants?|employees?)\b|"
    rf"\b(colleague|co-?worker|manager|boss)'?s\s+{_PERSONAL}\b|"
    rf"\b[A-Z][a-z]+'s\s+{_PERSONAL}\b|"
    r"\b(meilleur|quel)\w*\s+(candidat|employ)", re.I)


class LLMAnswer(BaseModel):
    answer: str = Field(min_length=1, max_length=1500)
    found: bool
    source_ids: list[str] = Field(default_factory=list, max_length=5)


@dataclass
class Turn:
    role: str  # user | assistant
    content: str


@dataclass
class AssistantReply:
    answer: str
    found: bool
    mode: str
    sources: list[dict] = field(default_factory=list)
    notice: str | None = None
    flagged: bool = False
    error: str | None = None  # technical detail for the audit log, never shown to the user


def resolve_policy_dir(configured: Path) -> Path:
    for candidate in (configured, Path("..") / configured):
        if candidate.is_dir():
            return candidate
    return configured


@lru_cache(maxsize=4)
def _index_for(directory: str, signature: tuple) -> PolicyIndex:
    return PolicyIndex(load_policies(Path(directory)))


def get_index(directory: Path) -> PolicyIndex:
    # Rebuilt when a document is added, removed or edited.
    signature = tuple(sorted((p.name, p.stat().st_mtime_ns) for p in directory.glob("*.md"))) if directory.is_dir() else ()
    return _index_for(str(directory), signature)


def _query_terms(question: str, history: list[Turn]) -> dict[str, float]:
    terms = query_terms(question)
    previous = next((t.content for t in reversed(history) if t.role == "user"), None)
    if previous and len(tokenize(question)) <= FOLLOW_UP_TERMS:
        # Short follow-up ("and how much notice?"): keep the topic of the previous question.
        for term, weight in query_terms(previous, 0.6).items():
            terms.setdefault(term, weight)
    return terms


def _source(passage: Passage) -> dict:
    excerpt = passage.text if len(passage.text) <= 240 else passage.text[:237].rsplit(" ", 1)[0] + "..."
    return {"id": passage.id, "document": passage.document, "section": passage.section, "excerpt": excerpt}


def _extract(passage: Passage, terms: dict[str, float], max_sentences: int = 3) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", passage.text)
    scored = [(sum(terms.get(t, 0.0) for t in set(tokenize(s))), i, s) for i, s in enumerate(sentences)]
    best = sorted((x for x in scored if x[0] > 0), key=lambda x: (-x[0], x[1]))[:max_sentences]
    chosen = sorted(best, key=lambda x: x[1]) or scored[:2]
    return " ".join(s for _, _, s in chosen)


def answer_question(question: str, history: list[Turn], role: str, index: PolicyIndex,
                    llm: LLMClient | None) -> AssistantReply:
    mode = llm.label if llm else OFFLINE_MODE
    if any(f.severity == "high" for f in scan_rules(question)):
        return AssistantReply(REFUSED, found=False, mode=mode, flagged=True)
    if _ABOUT_PEOPLE.search(question):
        return AssistantReply(NO_PEOPLE, found=False, mode=mode)

    audiences = AUDIENCES_BY_ROLE.get(role, {"all"})
    terms = _query_terms(question, history)
    hits = index.search(terms, audiences)
    if not hits or hits[0][0] < MIN_SCORE:
        return AssistantReply(NOT_FOUND, found=False, mode=mode)
    top = hits[0][1]
    related = [p for s, p in hits[1:] if s >= 0.6 * hits[0][0]][:2]

    if llm is not None:
        passages = [p for _, p in hits]
        try:
            result, _, used = llm.complete_json(SYSTEM, user_prompt(question, history, passages), LLMAnswer)
        except LLMError as exc:
            reply = AssistantReply(_extract(top, terms), True, f"{OFFLINE_MODE} (fallback)",
                                   [_source(p) for p in [top, *related]])
            reply.notice = ("The AI model could not be reached, so this answer quotes the most relevant "
                            "policy text directly.")
            reply.error = str(exc)[:300]
            return reply
        by_id = {p.id: p for p in passages}
        cited = [by_id[i] for i in result.source_ids if i in by_id]
        if not result.found or not cited:
            # An answer without a valid citation is not trusted.
            return AssistantReply(NOT_FOUND, found=False, mode=used)
        return AssistantReply(result.answer.strip(), True, used, [_source(p) for p in cited])

    return AssistantReply(
        _extract(top, terms), True, OFFLINE_MODE, [_source(p) for p in [top, *related]],
        notice="Offline mode: no AI model is configured, so this answer quotes the most relevant policy text directly.",
    )
