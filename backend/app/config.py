import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "TrustHR AI")
    app_env: str = os.getenv("APP_ENV", "development")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./trusthr.db")
    
    # Security constraints
    max_upload_bytes: int = int(os.getenv("SECURITY_MAX_UPLOAD_BYTES", 10 * 1024 * 1024))
    allowed_mime_types: list[str] = [
        "text/plain",
        "application/pdf",
        "application/octet-stream"
    ]
    
    # LLM Settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")  # "mock", "gemini", "openai"
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")

    # Action Gateway / Mailpit
    smtp_host: str = os.getenv("SMTP_HOST", "localhost")
    smtp_port: int = int(os.getenv("SMTP_PORT", "1025"))
    smtp_from: str = os.getenv("SMTP_FROM", "recruiting@trusthr.internal")

settings = Settings()
