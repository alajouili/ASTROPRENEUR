"""Output Guard (OWASP LLM02, LLM05, LLM09).

Validates agent-generated outputs before they reach humans or the Action Gateway:
1. Cross-candidate data leaks: ensures candidate B's name or email never appears in candidate A's draft.
2. Banned commitments / promises: agents can never say "you are hired", "salary is", "we offer you".
3. Link domain allowlist: only approved domains are permitted.
4. Header injection: prevents CRLF / newline injection in subject lines.
"""
import re
from typing import List, Tuple

ALLOWED_DOMAINS = ["localhost", "127.0.0.1", "trusthr.ai", "linkedin.com", "google.com"]

BANNED_PHRASES = [
    "you are hired",
    "vous êtes embauché",
    "congratulations, you got the job",
    "félicitations, vous avez le poste",
    "we offer you",
    "salary is",
    "le salaire est",
    "system prompt",
    "you are an ai",
    "as an ai language model",
    "en tant que modèle d'ia",
]

URL_PATTERN = re.compile(r'https?://[^\s<>"]+')


def check_output(text: str, other_candidate_names: List[str] = None) -> Tuple[bool, List[str]]:
    """Validates text for safety violations. Returns (is_safe, list_of_violations)."""
    violations = []
    lower_text = (text or "").lower()

    # 1. Cross-Candidate Data Leak Detection (LLM02)
    if other_candidate_names:
        for name in other_candidate_names:
            if name and len(name) > 3 and name.lower() in lower_text:
                violations.append(f"Data Leak: Mentions another candidate ({name})")

    # 2. Banned Commitments / Legal Promises (LLM05 / LLM09)
    for phrase in BANNED_PHRASES:
        if phrase in lower_text:
            violations.append(f"Policy Violation: Contains unauthorized promise or banned phrase '{phrase}'")

    # 3. Link Allowlist Enforcement (LLM05)
    urls = URL_PATTERN.findall(text or "")
    for url in urls:
        domain = re.sub(r"https?://", "", url).split("/")[0].split(":")[0].lower()
        if not any(domain == allowed or domain.endswith("." + allowed) for allowed in ALLOWED_DOMAINS):
            violations.append(f"Security: Unapproved link domain detected ({domain})")

    # 4. CRLF Header Injection
    if "subject:" in lower_text and ("\r" in text or "\n" in text):
        violations.append("Security: CRLF / Header injection detected in email subject line")

    return len(violations) == 0, violations
