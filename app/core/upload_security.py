# app/core/upload_security.py
import os
import uuid
import filetype
import fitz  # PyMuPDF
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_PDF_PAGES = 10

async def validate_and_store_upload(file: UploadFile, upload_dir: str = "uploads/") -> str:
    """
    Validates an uploaded file for magic bytes, size, and PDF safety.
    Returns the safe, generated filename.
    """
    # 1. Check Size (Read in chunks to avoid memory exhaustion)
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Max size is 5MB.")
    
    # 2. Check Magic Bytes (Pentester favorite: renaming .exe to .pdf)
    # We read the first 2048 bytes to detect the true file type
    header = await file.read(2048)
    await file.seek(0)
    
    kind = filetype.guess(header)
    if not kind or kind.mime != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only real PDFs are allowed.")

    # 3. Check PDF Page Count & Parse (Prevent DoS)
    try:
        # Open PDF from memory
        doc = fitz.open(stream=await file.read(), filetype="pdf")
        if doc.page_count > MAX_PDF_PAGES:
            raise HTTPException(status_code=400, detail=f"PDF has too many pages. Max is {MAX_PDF_PAGES}.")
        
        # Extract text (useful for Member 1's pipeline)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Corrupted or malicious PDF detected.")

    # 4. Generate a random, safe filename (Prevent Path Traversal)
    safe_filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(upload_dir, safe_filename)
    
    # Ensure directory exists
    os.makedirs(upload_dir, exist_ok=True)

    # 5. Save the file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Return filename and extracted text for Member 1
    return safe_filename, text