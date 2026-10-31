"""Security Guard: the single path every untrusted document takes before an agent sees it.

file bytes -> extract (visible vs hidden) -> sanitize -> injection scan -> GuardedText
"""
from dataclasses import dataclass, field

from app.config import Settings
from app.security.extract import HiddenSegment, extract
from app.security.flags import RiskFlag, max_severity
from app.security.injection import PromptGuardClassifier, scan_rules
from app.security.sanitize import sanitize


@dataclass
class GuardedText:
    text: str  # what agents are allowed to read
    flags: list[RiskFlag] = field(default_factory=list)
    hidden: list[HiddenSegment] = field(default_factory=list)

    @property
    def risk_level(self) -> str:
        return max_severity(self.flags)


def guard_document(content: bytes, kind: str, settings: Settings, classifier: PromptGuardClassifier | None = None) -> GuardedText:
    extraction = extract(content, kind)
    text, flags = sanitize(extraction.visible_text, settings.max_text_chars)

    if not text.strip():
        flags.append(RiskFlag("no_text_layer", "medium", "No readable text (scanned image?): needs manual review"))

    if extraction.hidden:
        reasons = sorted({seg.reason for seg in extraction.hidden})
        hidden_text, _ = sanitize(" ".join(seg.text for seg in extraction.hidden), settings.max_text_chars)
        flags.append(RiskFlag(
            "hidden_text", "medium",
            f"{len(extraction.hidden)} hidden text segment(s) removed before analysis ({', '.join(reasons)})",
            hidden_text[:160],
        ))
        # An instruction hidden from human eyes is the clearest sign of an attack.
        for flag in scan_rules(hidden_text, where="hidden text"):
            flags.append(RiskFlag(flag.code, "high", flag.detail, flag.excerpt))
        if classifier:
            flags.extend(classifier.scan(hidden_text, where="hidden text"))

    flags.extend(scan_rules(text))
    if classifier:
        flags.extend(classifier.scan(text))
    return GuardedText(text=text, flags=flags, hidden=extraction.hidden)
