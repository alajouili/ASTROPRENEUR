# app/core/output_guard.py
import re
from typing import List, Tuple

# Only allow links to your own domain or trusted partners
ALLOWED_DOMAINS = ["localhost", "your-hr-app.com", "linkedin.com"]

# Phrases the LLM must NEVER say (Legal / HR safety)
BANNED_PHRASES = [
    "you are hired",
    "congratulations, you got the job",
    "we offer you",
    "salary is",
    "system prompt",
    "you are an ai",
    "as an ai language model"
]

URL_PATTERN = re.compile(r'https?://[^\s<>"]+')

def check_output(text: str, other_candidate_names: List[str]) -> Tuple[bool, List[str]]:
    """
    Validates LLM output before it is shown to a user or saved as a draft.
    Returns (is_safe, list_of_violations).
    """
    violations = []
    lower_text = text.lower()

    # 1. Check for Cross-Candidate Data Leaks (LLM02)
    for name in other_candidate_names:
        if name.lower() in lower_text:
            violations.append(f"Data Leak: Mentions another candidate ({name})")

    # 2. Check for Banned Promises/Phrases (LLM05/LLM09)
    for phrase in BANNED_PHRASES:
        if phrase in lower_text:
            violations.append(f"Policy Violation: Contains banned phrase '{phrase}'")

    # 3. Check Links against Allowlist (LLM05)
    urls = URL_PATTERN.findall(text)
    for url in urls:
        # Extract domain from URL (e.g., http://evil.com/path -> evil.com)
        domain = re.sub(r'https?://', '', url).split('/')[0].split(':')[0]
        if not any(domain.endswith(allowed) for allowed in ALLOWED_DOMAINS):
            violations.append(f"Security: Unapproved link detected ({domain})")

    # 4. Check for Header Injection (CRLF) in case this becomes an email subject
    if "\r" in text or "\n" in text:
        if "subject:" in lower_text:
             violations.append("Security: CRLF/Header injection detected")

    return len(violations) == 0, violations