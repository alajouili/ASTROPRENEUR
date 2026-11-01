"""Application settings, read from environment variables (or a .env file).

Secrets (JWT_SECRET, API keys, database password) are never hard-coded:
the app refuses to start if JWT_SECRET is missing or too short.
"""
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["dev", "test", "prod"] = "dev"
    database_url: str
    jwt_secret: str = Field(min_length=32)
    jwt_ttl_minutes: int = 30
    cookie_secure: bool = False  # set true behind HTTPS
    cors_origins: list[str] = ["http://localhost:5173"]

    # Uploads (Security Guard limits)
    upload_dir: Path = Path("./var/uploads")
    max_upload_mb: int = 5
    max_pdf_pages: int = 10
    max_files_per_batch: int = 200
    max_text_chars: int = 20_000

    # LLM. "offline" = deterministic heuristic engine, clearly labelled SIMULATED.
    llm_provider: Literal["offline", "gemini", "groq"] = "offline"
    llm_fallback_provider: Literal["none", "gemini", "groq"] = "none"
    gemini_api_key: str | None = None
    gemini_model: str | None = None  # copy the exact model id from Google AI Studio
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"
    llm_timeout_s: float = 30.0

    # Optional ML prompt-injection classifier (Llama Prompt Guard 2 86M)
    prompt_guard_mode: Literal["off", "groq", "local"] = "off"
    prompt_guard_threshold: float = 0.5
    # Local mode (needs transformers + torch, see requirements-ml.txt). The Meta model is
    # gated on Hugging Face; if it cannot be loaded, the open ProtectAI model is used instead.
    prompt_guard_local_model: str = "meta-llama/Llama-Prompt-Guard-2-86M"
    prompt_guard_fallback_model: str = "protectai/deberta-v3-base-prompt-injection-v2"

    # Fictional mailbox (Mailpit). The Action Gateway sends approved emails here only.
    mailpit_smtp_host: str = "localhost"
    mailpit_smtp_port: int = 1025
    mailpit_api_url: str = "http://localhost:8025"
    mail_from: str = "recruitment@trusthr.ai"  # the recruitment mailbox; also how outbound mail is recognised
    followup_days: int = 3  # remind candidates who have not answered our last email for this many days

    # Interview scheduling: working hours (UTC) and slot rules for the free-slot finder
    work_day_start_hour: int = 9
    work_day_end_hour: int = 17
    interview_minutes: int = 45
    interview_buffer_minutes: int = 15

    shortlist_size: int = 5

    # Policy Assistant: company policy documents (Markdown), read-only.
    policy_dir: Path = Path("data/policies")
    assistant_questions_per_minute: int = 20
    embedded_worker: bool = False  # dev convenience: run the worker inside the API process

    @model_validator(mode="after")
    def _check_providers(self) -> "Settings":
        for provider in {self.llm_provider, self.llm_fallback_provider} - {"offline", "none"}:
            if provider == "gemini" and not (self.gemini_api_key and self.gemini_model):
                raise ValueError("LLM provider 'gemini' needs GEMINI_API_KEY and GEMINI_MODEL")
            if provider == "groq" and not self.groq_api_key:
                raise ValueError("LLM provider 'groq' needs GROQ_API_KEY")
        if self.prompt_guard_mode == "groq" and not self.groq_api_key:
            raise ValueError("PROMPT_GUARD_MODE=groq needs GROQ_API_KEY")
        return self

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
