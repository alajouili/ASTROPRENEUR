import hashlib
import io
from pypdf import PdfReader
from backend.app.config import settings
from backend.app.security.extract import extract as forensic_extract, HiddenSegment

class FileValidationError(Exception):
    pass

class FileValidationResult:
    def __init__(self, file_name: str, file_hash: str, text_content: str, size_bytes: int, hidden_segments: list[HiddenSegment] | None = None):
        self.file_name = file_name
        self.file_hash = file_hash
        self.text_content = text_content
        self.size_bytes = size_bytes
        self.hidden_segments = hidden_segments or []

def validate_and_extract_file(file_name: str, file_bytes: bytes, mime_type: str | None = None) -> FileValidationResult:
    """
    Validates file size, checks magic bytes against executable/malicious formats,
    computes SHA-256 integrity hash, and securely extracts plain text while
    detecting hidden-text smuggling (white-on-white, tiny font, off-page, DOCX hidden).
    """
    size = len(file_bytes)
    if size == 0:
        raise FileValidationError("Uploaded file is empty.")
    if size > settings.max_upload_bytes:
        raise FileValidationError(f"File size ({size} bytes) exceeds maximum limit of {settings.max_upload_bytes} bytes.")

    # Disallow known executable magic bytes
    if file_bytes.startswith(b"MZ"):  # Windows PE / EXE / DLL
        raise FileValidationError("Security violation: Executable files (PE/EXE) are strictly prohibited.")
    if file_bytes.startswith(b"\x7fELF"):  # Linux ELF
        raise FileValidationError("Security violation: ELF binaries are strictly prohibited.")

    file_hash = hashlib.sha256(file_bytes).hexdigest()

    extracted_text = ""
    hidden_segments: list[HiddenSegment] = []
    lower_name = file_name.lower()

    if lower_name.endswith(".pdf") or file_bytes.startswith(b"%PDF"):
        try:
            # Forensic extraction with white-text and tiny font detection
            forensic_res = forensic_extract(file_bytes, "pdf")
            extracted_text = forensic_res.visible_text
            hidden_segments = forensic_res.hidden
        except Exception:
            # Fallback to standard pypdf
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                pages_text = [p.extract_text() or "" for p in reader.pages]
                extracted_text = "\n".join(pages_text)
            except Exception as e:
                raise FileValidationError(f"Invalid or corrupted PDF file: {str(e)}")
    elif lower_name.endswith(".docx") or file_bytes.startswith(b"PK\x03\x04"):
        try:
            forensic_res = forensic_extract(file_bytes, "docx")
            extracted_text = forensic_res.visible_text
            hidden_segments = forensic_res.hidden
        except Exception as e:
            raise FileValidationError(f"Invalid or corrupted DOCX file: {str(e)}")
    else:
        # Assume text/markdown/plain text
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                extracted_text = file_bytes.decode("latin-1")
            except Exception as e:
                raise FileValidationError(f"Could not decode text file: {str(e)}")

    if not extracted_text.strip() and not hidden_segments:
        raise FileValidationError("No readable text could be extracted from the file.")

    return FileValidationResult(
        file_name=file_name,
        file_hash=file_hash,
        text_content=extracted_text,
        size_bytes=size,
        hidden_segments=hidden_segments
    )
