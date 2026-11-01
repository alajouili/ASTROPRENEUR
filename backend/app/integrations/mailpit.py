"""Mailpit adapter: read the fictional mailbox through Mailpit's REST API.

Sending stays in the Action Gateway (SMTP), so nothing here can send. Every message
the gateway sends also lands in Mailpit, which gives the outbound history for follow-ups.
"""
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx


class MailboxError(Exception):
    pass


@dataclass
class MailboxMessage:
    id: str
    from_addr: str
    from_name: str
    to_addrs: list[str]
    subject: str
    text: str
    sent_at: datetime


def _parse_date(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


class MailpitClient:
    def __init__(self, api_url: str, timeout: float = 10.0, transport: httpx.BaseTransport | None = None):
        self._base = api_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport

    def _get(self, path: str, **params) -> dict:
        try:
            with httpx.Client(timeout=self._timeout, transport=self._transport) as client:
                resp = client.get(f"{self._base}{path}", params=params or None)
                resp.raise_for_status()
                return resp.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise MailboxError(f"Mailbox unavailable: {type(exc).__name__}: {str(exc)[:200]}") from exc

    def list_ids(self, limit: int = 500) -> list[str]:
        data = self._get("/api/v1/messages", limit=limit)
        return [m["ID"] for m in data.get("messages", [])]

    def get(self, message_id: str) -> MailboxMessage:
        m = self._get(f"/api/v1/message/{message_id}")
        sender = m.get("From") or {}
        return MailboxMessage(
            id=m["ID"],
            from_addr=(sender.get("Address") or "").strip().lower(),
            from_name=(sender.get("Name") or "").strip(),
            to_addrs=[(t.get("Address") or "").strip().lower() for t in (m.get("To") or [])],
            subject=m.get("Subject") or "",
            text=m.get("Text") or "",
            sent_at=_parse_date(m.get("Date") or m.get("Created")),
        )
