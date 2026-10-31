# app/api/scan.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.input_guard import guard_engine
from app.core.dependencies import require_role

router = APIRouter(prefix="/scan", tags=["security"])

@router.post("/pdf")
async def scan_pdf(
    file: UploadFile = File(...),
    user: dict = Depends(require_role(["recruiter", "hr_admin"]))
):
    """
    Scans a PDF for hidden text, zero-width characters, and prompt injection.
    """
    file_bytes = await file.read()
    
    # 1. Extract PDF, strip hidden text, get flags
    try:
        clean_text, hidden_flags = guard_engine.extract_pdf_secure(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF.")

    # 2. Sanitize text (Zero-width chars + Regex)
    sanitized_text, regex_flags = guard_engine.sanitize_text(clean_text)

    # 3. LLM Prompt Guard (Scan in 512-token chunks)
    # For the demo, we just scan the first 512 tokens
    ml_score = guard_engine.scan_chunk(sanitized_text)

    # 4. Final Verdict
    is_malicious = ml_score > 0.85 or len(hidden_flags) > 0 or len(regex_flags) > 0

    return {
        "is_malicious": is_malicious,
        "ml_injection_score": round(ml_score, 4),
        "hidden_text_flags": hidden_flags,
        "regex_flags": regex_flags,
        "clean_text_preview": sanitized_text[:300]
    }