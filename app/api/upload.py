# app/api/upload.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.upload_security import validate_and_store_upload
from app.core.dependencies import require_role, verify_csrf

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/cv")
async def upload_cv(
    file: UploadFile = File(...),
    user: dict = Depends(require_role(["recruiter", "hr_admin"])),
    # csrf: None = Depends(verify_csrf) # Uncomment when frontend is ready
):
    """
    Securely uploads a CV. Only recruiters and HR admins can do this.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Extension must be .pdf")
        
    safe_filename, extracted_text = await validate_and_store_upload(file)
    
    return {
        "message": "File uploaded securely",
        "stored_as": safe_filename,
        "text_preview": extracted_text[:200] + "..." # For Member 1 to process
    }