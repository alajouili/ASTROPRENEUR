"""Prompt-injection detection for untrusted text (CVs, emails).

Layer 1: pattern rules in English, French, and Arabic with homoglyph normalization.
The English base list is adapted from miao4ai/open_recruiter (MIT, product/backend/app/guardrails/input_validator.py);
the French rules, Arabic rules, and HR-specific rules (score / decision manipulation) are ours.

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

_HOMOGLYPH_MAP = str.maketrans({
    "а": "a", "А": "A",
    "с": "c", "С": "C",
    "е": "e", "Е": "E",
    "о": "o", "О": "O",
    "р": "p", "Р": "P",
    "х": "x", "Х": "X",
    "у": "y", "У": "Y",
    "і": "i", "І": "I",
    "ѕ": "s", "Ѕ": "S",
    "ј": "j", "Ј": "J",
    "α": "a", "ο": "o", "ν": "v", "ρ": "p", "τ": "t",
})


def normalize_homoglyphs(text: str) -> str:
    """Normalize common Cyrillic and Greek lookalikes used to evade ASCII regexes."""
    return text.translate(_HOMOGLYPH_MAP)


_RULES: list[tuple[str, str, re.Pattern]] = [
    # English & French overrides
    ("instruction_override", "high", re.compile(
        r"\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|any|your|the|system)\b"
        r"[^.\n]{0,20}\b(instructions?|prompts?|rules|guidelines|directives)\b", _I)),
    ("instruction_override", "high", re.compile(
        r"\b(ignore[rz]?|oublie[rz]?|néglige[rz]?|contourne[rz]?)\b[^.\n]{0,40}\b(instructions?|consignes?|règles|directives)\b", _I)),
    # From Member 2's input guard (jerbi-security-final): "disregard (all) prior/previous ..."
    # whatever the object ("guidance", "context", ...).
    ("instruction_override", "high", re.compile(r"\bdisregard\s+(all\s+)?(prior|previous)\b", _I)),
    ("instruction_override", "high", re.compile(
        r"\b(special|developer|maintenance|debug)\s+(override|mode|directive|mandate)\b|"
        r"\b(do\s+not|never)\s+evaluate\s+this\s+(candidate|resume|cv)\b", _I)),

    # Arabic instruction overrides
    ("instruction_override", "high", re.compile(
        r"(تجاهل|انس[ىي]?|الغ[ي]?|تخطى|تجاوز)\s+[^.\n]{0,35}(تعليمات|أوامر|قواعد|السابقة|كل\s+شيء|الإرشادات)", _I)),

    # Role overrides (EN / FR / AR)
    ("role_override", "high", re.compile(
        r"\byou\s+are\s+now\b|\bfrom\s+now\s+on,?\s+you\b|"
        r"\bact\s+as\s+(if\s+you\s+(are|were)|an?\s+(ai|assistant|language\s+model|llm|recruiter|hiring\s+manager))\b", _I)),
    ("role_override", "high", re.compile(
        r"\b(tu\s+es|vous\s+êtes)\s+(maintenant|désormais)\b|\bà\s+partir\s+de\s+maintenant,?\s+(tu|vous)\b", _I)),
    ("role_override", "high", re.compile(
        r"(أنت\s+الآن|من\s+الآن\s+فصاعدا|تصرف\s+كأنك|تقمص\s+دور)\s+[^.\n]{0,30}(نموذج|ذكاء|مسؤول|خبير)", _I)),

    ("new_instructions", "high", re.compile(
        r"\bnew\s+instructions?\s*:|\bnouvelles?\s+(instructions?|consignes?)\s*:|"
        r"تعليمات\s+جديدة\s*:", _I)),

    ("system_prompt_probe", "high", re.compile(
        r"\bsystem\s*prompt\b|\bprompt\s+syst[eè]me\b|"
        r"\b(reveal|print|show|repeat|output)\b[^.\n]{0,20}\b(your|the)\s+(system\s+)?(prompt|instructions)\b", _I)),

    ("chat_template_tokens", "high", re.compile(
        r"<\|im_start\|>|<\|im_end\|>|\[/?INST\]|<<SYS>>|^\s*#{2,}\s*(system|instructions?)\b|^\s*(system|assistant)\s*:", _IM)),

    # Score manipulation (EN / FR / AR)
    ("score_manipulation", "high", re.compile(
        r"\b(rank|rate|score|grade|mark|classify)\b[^.\n]{0,30}\b(me|this\s+(candidate|cv|resume|applicant|profile))\b"
        r"[^.\n]{0,30}\b(first|highest|top|best|maximum|perfect|100|10/10)\b", _I)),
    ("score_manipulation", "high", re.compile(
        r"\b(classe[rz]?|note[rz]?|évalue[rz]?)\b[^.\n]{0,30}\b(moi|ce\s+(candidat|cv|profil))\b"
        r"[^.\n]{0,30}\b(premier|première|maximale?|meilleur|parfait|100|10/10)\b", _I)),
    ("score_manipulation", "high", re.compile(
        r"(أعط|امنح|قيم|رتب|ضع\s+علامة)\s+[^.\n]{0,30}(أعلى|كاملة|100|الأول|ممتاز|10/10)", _I)),

    # Decision manipulation (EN / FR / AR)
    ("decision_manipulation", "medium", re.compile(
        r"\b(must|should|has\s+to)\s+(be\s+)?(hired|shortlisted|accepted|selected)\b|"
        r"\b(doit|devez|faut)\b[^.\n]{0,15}\b(embauch|retenu|sélectionn|recrut)", _I)),
    ("decision_manipulation", "medium", re.compile(
        r"(يجب\s+أن\s+يتم\s+(توظيف|قبول|ترشيح)|وظف\s+هذا\s+المترشح|اقبل\s+هذا\s+الملف)", _I)),

    # Message to AI (EN / FR / AR)
    ("message_to_ai", "medium", re.compile(
        r"\b(note|message|instructions?)\s+(to|for)\s+(the\s+)?(ai|llm|model|assistant|chatgpt|gpt|claude|gemini|screening\s+(tool|system))\b|"
        r"\b(à|pour)\s+l['’]?\s*(ia|intelligence\s+artificielle)\b", _I)),
    ("message_to_ai", "medium", re.compile(
        r"(ملاحظة\s+للذكاء\s+الاصطناعي|رسالة\s+للنموذج|تعليمات\s+للذكاء|ملاحظة\s+إلى\s+النموذج)", _I)),

    ("encoded_payload", "medium", re.compile(r"[A-Za-z0-9+/]{120,}={0,2}")),
]


def scan_rules(text: str, where: str = "") -> list[RiskFlag]:
    """One flag per rule code that matches (first match kept as the excerpt)."""
    flags: dict[str, RiskFlag] = {}
    normalized = normalize_homoglyphs(text)

    for code, severity, pattern in _RULES:
        if code in flags:
            continue
        match = pattern.search(text) or pattern.search(normalized)
        if match:
            prefix = f"{where}: " if where else ""
            flags[code] = RiskFlag(code, severity, f"{prefix}suspicious instruction pattern ({code})", match.group(0)[:160])
    return list(flags.values())


def _chunks(text: str, size: int = 1500, overlap: int = 200) -> list[str]:
    if len(text) <= size:
        return [text]
    step = max(1, size - overlap)
    return [text[i:i + size] for i in range(0, len(text), step)]


_MALICIOUS_LABELS = {"INJECTION", "JAILBREAK", "MALICIOUS", "LABEL_1"}


class PromptGuardClassifier:
    """Optional Llama Prompt Guard 2 86M runner."""

    def __init__(self, settings: Settings):
        self.mode = settings.prompt_guard_mode
        self.threshold = settings.prompt_guard_threshold
        self.api_key = settings.groq_api_key
        self._local_pipe = None
        self.model_id: str | None = None
        if self.mode == "local":
            self._local_pipe, self.model_id = self._load_local(settings)

    @staticmethod
    def _load_local(settings: Settings, pipeline_factory=None):
        """Load Llama Prompt Guard 2; fall back to the open ProtectAI DeBERTa model when the
        gated Meta model is unavailable (Member 2's get_guard). Returns (pipe or error, model id)."""
        if pipeline_factory is None:
            try:
                from transformers import pipeline as pipeline_factory  # lazy import, optional dependency
            except Exception as exc:
                return exc, None
        errors = []
        for model_id in (settings.prompt_guard_local_model, settings.prompt_guard_fallback_model):
            try:
                return pipeline_factory("text-classification", model=model_id, truncation=True, max_length=512), model_id
            except Exception as exc:
                errors.append(f"{model_id}: {exc}")
        return RuntimeError("; ".join(errors)), None

    def scan(self, text: str, where: str = "") -> list[RiskFlag]:
        if self.mode == "off" or not text.strip():
            return []
        prefix = f"{where}: " if where else ""
        if self.mode == "local":
            if isinstance(self._local_pipe, Exception):
                return [RiskFlag("classifier_error", "medium",
                                 f"{prefix}Prompt Guard local model could not be loaded: {self._local_pipe}")]
            try:
                scores = []
                for chunk in _chunks(text):
                    res = self._local_pipe(chunk)[0]
                    # Prompt Guard 2: LABEL_1 / MALICIOUS. ProtectAI: INJECTION. Prompt Guard 1: INJECTION, JAILBREAK.
                    if res["label"].upper() in _MALICIOUS_LABELS:
                        scores.append(res["score"])
                max_score = max(scores) if scores else 0.0
                if max_score >= self.threshold:
                    return [RiskFlag("classifier_injection", "high",
                                     f"{prefix}{self.model_id} flagged prompt injection (score {max_score:.2f})")]
                return []
            except Exception as exc:
                return [RiskFlag("classifier_error", "medium", f"{prefix}Prompt Guard inference failed: {exc}")]

        if self.mode == "groq":
            if not self.api_key:
                return [RiskFlag("classifier_error", "medium", f"{prefix}Prompt Guard enabled (groq) but GROQ_API_KEY is unset")]
            try:
                # Groq hosts Prompt Guard 86M as a moderation endpoint
                resp = httpx.post(
                    "https://api.groq.com/openai/v1/moderations",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"input": text[:4000], "model": "llama-guard-3-8b"},
                    timeout=5.0,
                )
                if resp.status_code != 200:
                    return [RiskFlag("classifier_error", "medium", f"{prefix}Groq Guard returned HTTP {resp.status_code}")]
                data = resp.json()
                if data.get("results", [{}])[0].get("flagged"):
                    return [RiskFlag("classifier_injection", "high", f"{prefix}Prompt Guard flagged input as adversarial")]
                return []
            except Exception as exc:
                return [RiskFlag("classifier_error", "medium", f"{prefix}Groq Guard request failed: {exc}")]

        return []
