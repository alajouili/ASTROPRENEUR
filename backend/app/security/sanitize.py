"""Text normalisation applied to every untrusted text before an agent reads it."""
import re
import unicodedata

from app.security.flags import RiskFlag

# zero-width characters, bidi overrides, soft hyphen, BOM
_INVISIBLE = re.compile("[­​-‏‪-‮⁠-⁤⁦-⁩﻿]")
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize(text: str, max_chars: int) -> tuple[str, list[RiskFlag]]:
    flags: list[RiskFlag] = []
    invisible = len(_INVISIBLE.findall(text))
    text = unicodedata.normalize("NFKC", text)
    text = _INVISIBLE.sub("", text)
    # U+FFFD replaces glyphs the PDF font cannot map. It carries no text, and interleaved
    # with letters ("S�y�s�t�e�m") it would hide words from the rules.
    # Common in ordinary PDFs (icons, bullets), so it is removed without a flag.
    text = text.replace("�", "")
    text = _CONTROL.sub(" ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if invisible:
        flags.append(RiskFlag("invisible_characters", "low", f"{invisible} invisible Unicode character(s) removed"))
    if len(text) > max_chars:
        text = text[:max_chars]
        flags.append(RiskFlag("truncated", "low", f"Text longer than {max_chars} characters was truncated"))
    return text, flags
