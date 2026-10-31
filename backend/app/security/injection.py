"""Prompt-injection detection for untrusted text (CVs, emails).

Layer 1: pattern rules in English and French. The English base list is adapted
from miao4ai/open_recruiter (MIT, product/backend/app/guardrails/input_validator.py);
the French rules and the HR-specific rules (score / decision manipulation) are ours.

Layer 2 (optional): Llama Prompt Guard 2 86M, a multilingual classifier, run
locally with transformers or through Groq. If it is enabled but fails, a flag is
raised: the Guard never silently skips a check.

Detection only flags. The real protection is architectural: agents have no
action tools, scores are computed in code, and a human approves every action.
"""
import re

import httpx

from app.config import Settings
from app.security.flags import RiskFlag

_I = re.IGNORECASE
_IM = re.IGNORECASE | re.MULTILINE

_RULES: list[tuple[str, str, re.Pattern]] = [
    ("instruction_override", "high", re.compile(
        r"\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|any|your|the|system)\b"
        r"[^.\n]{0,20}\b(instructions?|prompts?|rules|guidelines|directives)\b", _I)),
    ("instruction_override", "high", re.compile(
        r"\b(ignore[rz]?|oublie[rz]?|néglige[rz]?|contourne[rz]?)\b[^.\n]{0,40}\b(instructions?|consignes?|règles|directives)\b", _I)),
    ("role_override", "high", re.compile(
        r"\byou\s+are\s+now\b|\bfrom\s+now\s+on,?\s+you\b|"
        r"\bact\s+as\s+(if\s+you\s+(are|were)|an?\s+(ai|assistant|language\s+model|llm|recruiter|hiring\s+manager))\b", _I)),
    ("role_override", "high", re.compile(r"\b(tu\s+es|vous\s+êtes)\s+(maintenant|désormais)\b|\bà\s+partir\s+de\s+maintenant,?\s+(tu|vous)\b", _I)),
    ("new_instructions", "high", re.compile(r"\bnew\s+instructions?\s*:|\bnouvelles?\s+(instructions?|consignes?)\s*:", _I)),
    ("system_prompt_probe", "high", re.compile(
        r"\bsystem\s*prompt\b|\bprompt\s+syst[eè]me\b|"
        r"\b(reveal|print|show|repeat|output)\b[^.\n]{0,20}\b(your|the)\s+(system\s+)?(prompt|instructions)\b", _I)),
    ("chat_template_tokens", "high", re.compile(
        r"<\|im_start\|>|<\|im_end\|>|\[/?INST\]|<<SYS>>|^\s*#{2,}\s*(system|instructions?)\b|^\s*(system|assistant)\s*:", _IM)),
    ("score_manipulation", "high", re.compile(
        r"\b(rank|rate|score|grade|mark|classify)\b[^.\n]{0,30}\b(me|this\s+(candidate|cv|resume|applicant|profile))\b"
        r"[^.\n]{0,30}\b(first|highest|top|best|maximum|perfect|100|10/10)\b", _I)),
    ("score_manipulation", "high", re.compile(
        r"\b(classe[rz]?|note[rz]?|évalue[rz]?)\b[^.\n]{0,30}\b(moi|ce\s+(candidat|cv|profil))\b"
        r"[^.\n]{0,30}\b(premier|première|maximale?|meilleur|parfait|100|10/10)\b", _I)),
    ("decision_manipulation", "medium", re.compile(
        r"\b(must|should|has\s+to)\s+(be\s+)?(hired|shortlisted|accepted|selected)\b|"
        r"\b(doit|devez|faut)\b[^.\n]{0,15}\b(embauch|retenu|sélectionn|recrut)", _I)),
    ("message_to_ai", "medium", re.compile(
        r"\b(note|message|instructions?)\s+(to|for)\s+(the\s+)?(ai|llm|model|assistant|chatgpt|gpt|claude|gemini|screening\s+(tool|system))\b|"
        r"\b(à|pour)\s+l['’]?\s*(ia|intelligence\s+artificielle)\b", _I)),
    ("encoded_payload", "medium", re.compile(r"[A-Za-z0-9+/]{120,}={0,2}")),
]


def scan_rules(text: str, where: str = "") -> list[RiskFlag]:
    """One flag per rule code that matches (first match kept as the excerpt)."""
    flags: dict[str, RiskFlag] = {}
    for code, severity, pattern in _RULES:
        if code in flags:
            continue
        match = pattern.search(text)
        if match:
            prefix = f"{where}: " if where else ""
            flags[code] = RiskFlag(code, severity, f"{prefix}suspicious instruction pattern ({code})", match.group(0)[:160])
    return list(flags.values())


def _chunks(text: str, size: int = 1500, overlap: int = 200) -> list[str]:
    if len(text) <= size:
        return [text] if text.strip() else []
    return [text[i : i + size] for i in range(0, len(text), size - overlap)]


class PromptGuardClassifier:
    """Llama Prompt Guard 2 86M (multilingual). Returns flags, never raises."""

    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODEL = "meta-llama/llama-prompt-guard-2-86m"
    HF_MODEL = "meta-llama/Llama-Prompt-Guard-2-86M"

    def __init__(self, settings: Settings, transport: httpx.BaseTransport | None = None):
        self.mode = settings.prompt_guard_mode
        self.threshold = settings.prompt_guard_threshold
        self._settings = settings
        self._transport = transport
        self._pipeline = None

    def scan(self, text: str, where: str = "") -> list[RiskFlag]:
        if self.mode == "off":
            return []
        try:
            score = max((self._score(chunk) for chunk in _chunks(text)), default=0.0)
        except Exception as exc:  # fail visible, not silent
            return [RiskFlag("classifier_error", "medium", f"Prompt Guard check failed ({type(exc).__name__}); review manually")]
        if score >= self.threshold:
            label = f"{where}: " if where else ""
            return [RiskFlag("ml_injection_detected", "high", f"{label}Prompt Guard 2 score {score:.2f}")]
        return []

    def _score(self, chunk: str) -> float:
        if self.mode == "groq":
            with httpx.Client(timeout=15, transport=self._transport) as client:
                resp = client.post(
                    self.GROQ_URL,
                    headers={"Authorization": f"Bearer {self._settings.groq_api_key}"},
                    json={"model": self.GROQ_MODEL, "messages": [{"role": "user", "content": chunk}]},
                )
                resp.raise_for_status()
                return float(resp.json()["choices"][0]["message"]["content"].strip())
        if self._pipeline is None:  # local mode: optional heavy dependency, loaded on first use
            from transformers import pipeline  # type: ignore[import-not-found]

            self._pipeline = pipeline("text-classification", model=self.HF_MODEL, truncation=True, max_length=512)
        result = self._pipeline(chunk)[0]
        malicious = str(result["label"]).upper() in {"LABEL_1", "MALICIOUS", "INJECTION", "JAILBREAK"}
        return float(result["score"]) if malicious else 1.0 - float(result["score"])
