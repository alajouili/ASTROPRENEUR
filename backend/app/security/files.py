"""Upload validation. Fails closed: anything unexpected is rejected with a reason."""
import hashlib
import io
import os
import re
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import Path

import pymupdf

from app.config import Settings

_MAGIC = {"pdf": b"%PDF-", "docx": b"PK\x03\x04"}
_PDF_ACTIVE_CONTENT = (
    b"/JavaScript", b"/JS ", b"/JS(", b"/Launch", b"/EmbeddedFile", b"/EmbeddedFiles",
    b"/OpenAction", b"/AcroForm", b"/RichMedia",
)
_DOCX_MAX_ENTRIES = 1000
_DOCX_MAX_UNCOMPRESSED = 50 * 1024 * 1024


class FileRejected(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class StoredFile:
    path: Path
    sha256: str
    kind: str
    size: int


def safe_display_name(filename: str) -> str:
    """Basename only, no control characters, bounded length (used for display, never for paths)."""
    base = os.path.basename((filename or "").replace("\\", "/"))
    base = re.sub(r"[\x00-\x1f\x7f]", "", base).strip()
    return base[:200] or "unnamed"


def validate_upload(filename: str, content: bytes, settings: Settings) -> str:
    """Return the file kind ('pdf' or 'docx') or raise FileRejected."""
    ext = Path(safe_display_name(filename)).suffix.lower().lstrip(".")
    if ext not in _MAGIC:
        raise FileRejected("unsupported_type", "Only PDF and DOCX files are accepted.")
    if not content:
        raise FileRejected("empty_file", "The file is empty.")
    if len(content) > settings.max_upload_bytes:
        raise FileRejected("too_large", f"The file is larger than {settings.max_upload_mb} MB.")
    if not content.startswith(_MAGIC[ext]):
        raise FileRejected("type_mismatch", "The file content does not match its extension.")
    if ext == "pdf":
        _check_pdf(content, settings)
    else:
        _check_docx(content)
    return ext


def _check_pdf(content: bytes, settings: Settings) -> None:
    if any(marker in content for marker in _PDF_ACTIVE_CONTENT):
        raise FileRejected("active_content", "PDFs with scripts, launch actions or embedded files are not accepted.")
    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception:
        raise FileRejected("unreadable", "The PDF could not be opened.")
    with doc:
        if doc.needs_pass or doc.is_encrypted:
            raise FileRejected("encrypted", "Password-protected PDFs are not accepted.")
        if doc.page_count == 0:
            raise FileRejected("unreadable", "The PDF has no pages.")
        if doc.page_count > settings.max_pdf_pages:
            raise FileRejected("too_many_pages", f"The PDF has more than {settings.max_pdf_pages} pages.")


def _check_docx(content: bytes) -> None:
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            infos = zf.infolist()
            names = {i.filename for i in infos}
    except zipfile.BadZipFile:
        raise FileRejected("unreadable", "The DOCX file is corrupted.")
    if len(infos) > _DOCX_MAX_ENTRIES or sum(i.file_size for i in infos) > _DOCX_MAX_UNCOMPRESSED:
        raise FileRejected("archive_bomb", "The DOCX file expands to an unsafe size.")
    if "word/document.xml" not in names:
        raise FileRejected("unreadable", "Not a Word document.")
    if any(n.lower().endswith("vbaproject.bin") for n in names):
        raise FileRejected("macros", "Documents with macros are not accepted.")
    if any(n.startswith("word/embeddings/") for n in names):
        raise FileRejected("embedded_objects", "Documents with embedded objects are not accepted.")


def store_upload(content: bytes, kind: str, settings: Settings) -> StoredFile:
    """Write under a random name in the private upload directory (never the original filename)."""
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    path = settings.upload_dir / f"{uuid.uuid4().hex}.{kind}"
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as fh:
        fh.write(content)
    return StoredFile(path=path, sha256=hashlib.sha256(content).hexdigest(), kind=kind, size=len(content))
