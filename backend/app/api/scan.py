"""Document Forensic & Injection Scanner API (Member 2 Security Integration).

Allows live, on-demand security inspection of uploaded candidate CVs:
1. Binary extraction separating visible text from hidden text (white-text, microscopic fonts).
2. Zero-width character & homoglyph normalization.
3. Multilingual (EN/FR/AR) regex pattern matching.
4. Prompt Guard ML classifier scoring.
"""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth.security import require_roles
from app.config import get_settings
from app.models import User
from app.security.extract import extract
from app.security.files import safe_display_name
from app.security.guard import guard_document
from app.security.injection import PromptGuardClassifier, scan_rules

router = APIRouter(prefix="/api/scan", tags=["security"])
hr_only = require_roles("recruiter", "hr_admin")


@router.post("/pdf")
async def scan_pdf(
    file: UploadFile = File(...),
    user: User = Depends(hr_only),
) -> dict:
    """Scans an uploaded PDF for hidden text, zero-width characters, and prompt injection."""
    name = safe_display_name(file.filename or "uploaded.pdf")
    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file uploaded")

    settings = get_settings()
    kind = "docx" if name.lower().endswith(".docx") else "pdf"

    # 1. Binary forensic extraction & Security Guard
    try:
        classifier = PromptGuardClassifier(settings) if settings.prompt_guard_mode != "off" else None
        guarded = guard_document(content, kind, settings, classifier=classifier)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Could not inspect document: {exc}")

    # 2. Extract hidden text details
    hidden_details = [
        {
            "reason": seg.reason,
            "text": seg.text[:200],
        }
        for seg in guarded.hidden
    ]

    # 3. Assess maliciousness
    is_malicious = guarded.risk_level in ("medium", "high") or len(hidden_details) > 0

    return {
        "filename": name,
        "is_malicious": is_malicious,
        "risk_level": guarded.risk_level,
        "hidden_text_flags": hidden_details,
        "regex_flags": [f.to_dict() for f in guarded.flags],
        "clean_text_preview": guarded.text[:400],
        "total_chars_analyzed": len(guarded.text),
    }
