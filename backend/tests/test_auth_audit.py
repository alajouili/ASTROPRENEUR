"""Authentication, roles, and the append-only, hash-chained audit log."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.api import auth as auth_api
from app.audit.log import append, verify_chain
from app.main import create_app
from tests.conftest import PASSWORDS


def _login(client, role, password=None):
    return client.post("/api/auth/login", json={"email": f"{role}@test.local", "password": password or PASSWORDS[role]})


def test_session_cookie_is_httponly_and_samesite_strict(users):
    r = _login(TestClient(create_app()), "recruiter")
    cookies = r.headers.get_list("set-cookie")
    session = next(c for c in cookies if c.startswith("trusthr_session="))
    assert "HttpOnly" in session and "SameSite=strict" in session
    assert r.headers["X-Content-Type-Options"] == "nosniff" and r.headers["X-Frame-Options"] == "DENY"


def test_wrong_password_and_unknown_user_get_the_same_answer(users):
    client = TestClient(create_app())
    a = _login(client, "recruiter", "wrong-password")
    b = client.post("/api/auth/login", json={"email": "nobody@test.local", "password": "x"})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_login_rate_limit(users):
    client = TestClient(create_app())
    codes = [_login(client, "recruiter", "wrong").status_code for _ in range(6)]
    assert codes[:5] == [401] * 5 and codes[5] == 429


def test_account_locks_after_repeated_failures(users, monkeypatch):
    monkeypatch.setattr(auth_api, "LOGIN_LIMIT_PER_MINUTE", 1000)
    client = TestClient(create_app())
    for _ in range(auth_api.LOCK_AFTER_FAILURES):
        _login(client, "recruiter", "wrong")
    assert _login(client, "recruiter").status_code == 423  # even the right password is refused while locked


def test_unauthenticated_and_wrong_role_are_refused(as_role, job):
    assert TestClient(create_app()).get("/api/jobs").status_code == 401
    employee = as_role("employee")
    assert employee.get("/api/jobs").status_code == 403
    assert employee.get("/api/audit").status_code == 403
    assert as_role("recruiter").get("/api/audit").status_code == 403  # audit is HR-admin only


def test_tampered_session_token_is_refused(users):
    client = TestClient(create_app())
    _login(client, "employee")
    session = next(c for c in client.cookies.jar if c.name == "trusthr_session")
    tampered = session.value[:-3] + ("AAA" if not session.value.endswith("AAA") else "BBB")
    # Replace the cookie in place (same domain and path): setting it without a domain would
    # add a second cookie, and the server could still read the valid one.
    client.cookies.delete("trusthr_session")
    client.cookies.set("trusthr_session", tampered, domain=session.domain, path=session.path)
    r = client.get("/api/auth/me")
    assert r.request.headers["cookie"].count("trusthr_session=") == 1
    assert r.status_code == 401


def test_audit_log_is_append_only_in_the_database(db):
    append(db, actor_type="system", actor_id="test", action="x", entity_type="t", entity_id="1")
    db.commit()
    for sql in ("UPDATE audit_log SET action = 'forged'", "DELETE FROM audit_log", "TRUNCATE audit_log"):
        with pytest.raises(DBAPIError, match="append-only"):
            db.execute(text(sql))
        db.rollback()


def test_hash_chain_detects_tampering_even_if_triggers_are_bypassed(db):
    for i in range(3):
        append(db, actor_type="user", actor_id="u1", action=f"step{i}", entity_type="t", entity_id=str(i))
    db.commit()
    assert verify_chain(db) == {"ok": True, "checked": 3, "first_bad_id": None}
    # Simulate a database owner bypassing the triggers to rewrite history.
    db.execute(text("ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_update"))
    db.execute(text("UPDATE audit_log SET details = '{\"forged\": true}' WHERE action = 'step1'"))
    db.execute(text("ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_update"))
    db.commit()
    result = verify_chain(db)
    assert result["ok"] is False and result["checked"] == 1
