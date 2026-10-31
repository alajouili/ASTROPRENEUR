"""Policy knowledge base: company policy documents split into sections, ranked with BM25.

Documents are Markdown files with a small header:

    ---
    title: Leave Policy
    audience: all        # all | hr
    ---
    ## Section heading
    Text...

Each "## " section is one passage. Retrieval is lexical (BM25, EN/FR stop words, accents
folded, light plural stemming): no model, no extra dependency, and the role filter is
applied before ranking, so a passage the user may not see is never scored or returned.
"""
import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

AUDIENCES_BY_ROLE = {"employee": {"all"}, "recruiter": {"all", "hr"}, "hr_admin": {"all", "hr"}}

_STOPWORDS = set("""
a about above after again all am an and any are as at be because been before being below between both but by
can could did do does doing down during each few for from further had has have having he her here hers him his
how i if in into is it its itself just me more most my no nor not now of off on once only or other our out over
own same she should so some such than that the their them then there these they this those through to too under
until up very was we were what when where which while who whom why will with would you your yours
please tell know want need get much many long
le la les un une des du de d l et ou en au aux ce cet cette ces que qui quoi est sont pour par sur dans avec
sans je tu il elle nous vous ils elles mon ma mes ton ta tes son sa ses notre votre leur leurs ne pas plus
combien comment quel quelle quels quelles est-ce y a ai as
""".split())
_TOKEN = re.compile(r"[a-z0-9]+")


def _fold(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", text.lower()) if not unicodedata.combining(c))


def _stem(token: str) -> str:
    """Light English stemming: carried/carries -> carry, booking -> book, days -> day."""
    if len(token) > 4 and token.endswith(("ies", "ied")):
        return token[:-3] + "y"
    if len(token) > 5 and token.endswith("ing"):
        return token[:-3]
    if len(token) > 4 and token.endswith("ed") and not token.endswith("eed"):
        return token[:-2]
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def tokenize(text: str) -> list[str]:
    return [_stem(t) for t in _TOKEN.findall(_fold(text)) if t not in _STOPWORDS and len(t) > 1]


# HR vocabulary and French question words mapped to the words the documents use.
# Expansion terms get a lower weight than the user's own words.
_SYNONYMS = {
    "vacation": ["annual", "leave"], "holiday": ["annual", "leave"], "pto": ["annual", "leave"],
    "paternity": ["partner", "parental", "leave"], "maternity": ["parental", "leave"],
    "notice": ["notify", "advance"], "wfh": ["remote"], "telework": ["remote"], "homeoffice": ["remote", "equipment"],
    "salary": ["compensation", "band"], "pay": ["salary", "compensation"], "raise": ["review", "increase"],
    "ill": ["sick"], "illness": ["sick"], "doctor": ["medical", "sick"], "course": ["training"],
    "certification": ["training"], "conference": ["training"], "gdpr": ["data", "personal"],
    "privacy": ["data", "personal"], "insurance": ["health"], "therapy": ["mental", "psychologist"],
    "reimburse": ["expense"], "reimbursement": ["expense"],
    "candidate": ["applicant"], "cv": ["applicant", "personal", "data"], "resume": ["applicant", "data"],
    "ai": ["automated", "software"], "decide": ["decision"], "hir": ["decision", "candidate"],
    # French
    "teletravail": ["remote"], "conge": ["leave"], "jour": ["day"], "semaine": ["week"], "an": ["year"],
    "annee": ["year"], "salaire": ["salary", "compensation"], "formation": ["training"], "maladie": ["sick"],
    "malade": ["sick"], "mutuelle": ["health", "insurance"], "sante": ["health"], "donnee": ["data"],
    "personnelle": ["personal"], "frai": ["expense"], "remboursement": ["expense", "reimburs"],
    "materiel": ["equipment"], "paternite": ["partner", "parental", "leave"], "maternite": ["parental", "leave"],
    "droit": ["right"], "medecin": ["medical"], "psychologue": ["psychologist"],
}


def query_terms(text: str, weight: float = 1.0) -> dict[str, float]:
    terms: dict[str, float] = {}
    for token in tokenize(text):
        terms[token] = max(terms.get(token, 0.0), weight)
        for extra in _SYNONYMS.get(token, []):
            terms.setdefault(_stem(extra), weight * 0.7)
    return terms


@dataclass(frozen=True)
class Passage:
    id: str
    document: str
    section: str
    audience: str
    text: str
    tokens: tuple[str, ...] = field(repr=False, default=())


def _parse(path: Path) -> list[Passage]:
    raw = path.read_text(encoding="utf-8")
    meta: dict[str, str] = {}
    body = raw
    header = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.S)
    if header:
        for line in header.group(1).splitlines():
            key, _, value = line.partition(":")
            meta[key.strip().lower()] = value.split("#")[0].strip()
        body = raw[header.end():]
    title = meta.get("title") or path.stem.replace("-", " ").title()
    audience = meta.get("audience", "hr")  # unlabelled documents are treated as HR-only
    passages = []
    for i, block in enumerate(re.split(r"^##\s+", body, flags=re.M)[1:], start=1):
        heading, _, text = block.partition("\n")
        text = " ".join(text.split())
        if not text:
            continue
        # The title and heading are indexed with the text: they carry the key words.
        tokens = tuple(tokenize(f"{title} {heading} {heading} {text}"))
        passages.append(Passage(f"{path.stem}#{i}", title, heading.strip(), audience, text, tokens))
    return passages


def load_policies(directory: Path) -> list[Passage]:
    passages: list[Passage] = []
    for path in sorted(directory.glob("*.md")):
        passages.extend(_parse(path))
    return passages


class PolicyIndex:
    """BM25 over passages. search() filters by audience before ranking."""

    def __init__(self, passages: list[Passage], k1: float = 1.5, b: float = 0.75):
        self.passages = passages
        self.k1, self.b = k1, b
        self.avg_len = sum(len(p.tokens) for p in passages) / max(1, len(passages))
        df: Counter[str] = Counter()
        for p in passages:
            df.update(set(p.tokens))
        n = len(passages)
        self.idf = {t: math.log(1 + (n - d + 0.5) / (d + 0.5)) for t, d in df.items()}
        self.tf = [Counter(p.tokens) for p in passages]

    def documents(self, audiences: set[str]) -> list[str]:
        return sorted({p.document for p in self.passages if p.audience in audiences})

    def search(self, weighted_terms: dict[str, float], audiences: set[str], limit: int = 5) -> list[tuple[float, Passage]]:
        results = []
        for passage, tf in zip(self.passages, self.tf):
            if passage.audience not in audiences:
                continue
            norm = self.k1 * (1 - self.b + self.b * len(passage.tokens) / self.avg_len)
            score = sum(
                weight * self.idf.get(term, 0.0) * tf[term] * (self.k1 + 1) / (tf[term] + norm)
                for term, weight in weighted_terms.items() if tf[term]
            )
            if score > 0:
                results.append((score, passage))
        results.sort(key=lambda r: -r[0])
        return results[:limit]
