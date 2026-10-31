"""LLM access: one client for every agent.

- Gemini and Groq through their OpenAI-compatible chat endpoints (free tiers).
- JSON output, validated by a Pydantic model; one retry with the validation error.
- Optional fallback provider when the primary fails (HTTP error, quota, timeout).
- Simple pacing so free-tier requests-per-minute limits are respected.
"""
import json
import re
import threading
import time
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.config import Settings

T = TypeVar("T", bound=BaseModel)

_ENDPOINTS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai",
    "groq": "https://api.groq.com/openai/v1",
}
_MIN_INTERVAL_S = {"gemini": 6.5, "groq": 2.0}  # ~9 req/min on Gemini Flash-Lite free tier, 30 on Groq


class LLMError(Exception):
    pass


class OpenAICompatibleProvider:
    def __init__(self, name: str, api_key: str, model: str, timeout: float, transport: httpx.BaseTransport | None = None):
        self.name = name
        self.model = model
        self._url = f"{_ENDPOINTS[name]}/chat/completions"
        self._headers = {"Authorization": f"Bearer {api_key}"}
        self._timeout = timeout
        self._transport = transport
        self._lock = threading.Lock()
        self._last_call = 0.0
        self._min_interval = _MIN_INTERVAL_S[name] if transport is None else 0.0

    @property
    def label(self) -> str:
        return f"{self.name}:{self.model}"

    def _pace(self) -> None:
        with self._lock:
            wait = self._min_interval - (time.monotonic() - self._last_call)
            if wait > 0:
                time.sleep(wait)
            self._last_call = time.monotonic()

    def chat_json(self, system: str, user: str) -> str:
        self._pace()
        body = {
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        }
        with httpx.Client(timeout=self._timeout, transport=self._transport) as client:
            resp = client.post(self._url, headers=self._headers, json=body)
            if resp.status_code == 429:  # rate limited: wait once, then retry
                time.sleep(min(float(resp.headers.get("retry-after", "10") or 10), 30))
                resp = client.post(self._url, headers=self._headers, json=body)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]


def _parse_json(text: str) -> dict:
    text = text.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.S)
    if fenced:
        text = fenced.group(1)
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("expected a JSON object")
    return data


class LLMClient:
    def __init__(self, providers: list[OpenAICompatibleProvider]):
        if not providers:
            raise ValueError("at least one provider is required")
        self.providers = providers

    @property
    def label(self) -> str:
        return " -> ".join(p.label for p in self.providers)

    def complete_json(self, system: str, user: str, model: type[T]) -> tuple[T, dict, str]:
        """Return (validated object, raw dict, provider label). Raises LLMError if every provider fails."""
        errors: list[str] = []
        for provider in self.providers:
            prompt = user
            for attempt in range(2):
                try:
                    raw = _parse_json(provider.chat_json(system, prompt))
                    return model.model_validate(raw), raw, provider.label
                except (ValueError, ValidationError) as exc:  # bad output: retry once with the error
                    errors.append(f"{provider.label} attempt {attempt + 1}: invalid output ({str(exc)[:200]})")
                    prompt = (
                        f"{user}\n\nYour previous answer was invalid: {str(exc)[:300]}\n"
                        "Answer again with ONLY a JSON object that matches the schema."
                    )
                except (httpx.HTTPError, KeyError) as exc:  # transport or quota problem: try the next provider
                    errors.append(f"{provider.label}: {type(exc).__name__}: {str(exc)[:200]}")
                    break
        raise LLMError("; ".join(errors))


def build_llm_client(settings: Settings) -> LLMClient | None:
    """None when LLM_PROVIDER=offline."""
    names = [settings.llm_provider] + ([settings.llm_fallback_provider] if settings.llm_fallback_provider != "none" else [])
    providers = []
    for name in names:
        if name == "gemini":
            providers.append(OpenAICompatibleProvider("gemini", settings.gemini_api_key or "", settings.gemini_model or "", settings.llm_timeout_s))
        elif name == "groq":
            providers.append(OpenAICompatibleProvider("groq", settings.groq_api_key or "", settings.groq_model, settings.llm_timeout_s))
    return LLMClient(providers) if providers else None
