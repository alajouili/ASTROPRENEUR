# TrustHR AI

A secure multi-agent HR assistant. **The agent executes, the human decides about people.**

Agents read, extract, compare and draft. They can only create *proposals*. A deterministic Action Gateway (no LLM) executes a proposal only after a human with an HR role approves it, and every step lands in an append-only, hash-chained audit log.

## Status

| Milestone | State |
|---|---|
| M1: Foundation + Resume Screening (P0) | **Done.** Upload → Security Guard → extraction → criteria → evidence check → deterministic score → ranking → shortlist proposal → HR approval → gateway → audit. 67 tests. Runs in Docker. |
| Dashboard (8 screens) | **Built, mock mode only.** Home, ranking, approvals, audit, inbox, scheduling, policy assistant, login. Not yet wired to the live API (see below). |
| M2: Inbox triage, summaries, reply drafts, Mailpit send via gateway (P0) | Next |
| M3: Follow-ups, interview scheduling (P1) | Planned |
| M4: Policy assistant with RAG (P2) | Planned |

The screening engine runs **offline by default**: a deterministic keyword heuristic, labelled `offline-heuristic (SIMULATED, no LLM)` everywhere it appears. Set `LLM_PROVIDER=gemini` or `groq` with a free API key to use a real model. The LLM path is covered by mocked tests but has **not yet been run against the live APIs**.

**Dashboard and API are not connected yet.** The dashboard's live mode calls routes from an earlier prototype backend (`/api/jobs/{id}/candidates`, `/api/approvals/{id}/review`, ...) that no longer exist, and its login screen is a client-side role switch. Use its mock mode for now. The live API routes are listed at `/api/docs` and in [Live API](#live-api).

## Run it with Docker (recommended)

Only Docker is needed on the machine.

```bash
cp .env.example .env                    # set POSTGRES_PASSWORD; change ports if 8080/8025/5433 are taken
cp backend/.env.example backend/.env    # set JWT_SECRET (LLM keys optional)
docker compose up -d --build
docker compose run --rm api python -m scripts.seed   # prints the demo passwords once
```

- App: `http://localhost:8080` (`WEB_PORT`). Mailpit UI: `http://localhost:8025` (`MAILPIT_UI_PORT`).
- Both are bound to `127.0.0.1` only. PostgreSQL, the API, the worker and Mailpit SMTP (`mailpit:1025`) stay on the internal Docker network.
- Caddy serves the dashboard with security headers (CSP, `nosniff`, `X-Frame-Options`, `Referrer-Policy`) and proxies `/api`; API responses keep their own stricter headers.
- The worker starts only after the API is healthy, because the API creates the schema on a fresh database.
- Logs: `docker compose logs -f api worker`. Stop: `docker compose down`. Delete all data (database and uploaded CVs): `docker compose down -v`.

**Tests in Docker**, against a throwaway in-memory database:

```bash
docker compose --profile test run --rm tests
```

## Run it without Docker

Requirements: Python 3.11+, Node 20+, PostgreSQL 15+.

```bash
# 1. Database
createuser trusthr -P            # pick a password
createdb trusthr -O trusthr
createdb trusthr_test -O trusthr # for the test suite

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env             # set DATABASE_URL and JWT_SECRET
python -m scripts.seed           # demo users + "Junior Data Analyst" job; prints random passwords
                                 # (or set SEED_RECRUITER_PASSWORD / SEED_ADMIN_PASSWORD / SEED_EMPLOYEE_PASSWORD)
python -m uvicorn app.main:app --port 8000

# 3. Frontend (second terminal)
cd frontend
npm install
npm run dev                      # http://localhost:5173, proxies /api to :8000
```

Without `EMBEDDED_WORKER=true`, run the worker separately: `python -m app.worker.runner`.

Tests: `cd backend && TEST_DATABASE_URL=postgresql+psycopg://trusthr:PASSWORD@localhost:5432/trusthr_test python -m pytest -q`. The test database is wiped before every test: never point it at real data. To use Docker for the database only: `docker compose --profile test up -d db-test` and `TEST_DATABASE_URL=postgresql+psycopg://trusthr:trusthr_test@localhost:5433/trusthr_test`.

The tests cover the Security Guard (file validation, hidden text, EN/FR injection rules), evidence verification, scoring, the full screening workflow, fairness twins, the approval and gateway rules, auth (cookies, CSRF, rate limit, lockout, roles), the append-only audit triggers and hash chain, and the LLM client (with mocked providers).

## Live API

All under `/api`; state-changing calls need the session cookie and the `X-CSRF-Token` header (value of the `trusthr_csrf` cookie). Interactive docs at `/api/docs`.

| Endpoint | Role |
|---|---|
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | All |
| `GET /jobs`, `POST /jobs`, `GET /jobs/{id}` | Recruiter, HR admin |
| `POST /jobs/{id}/resumes` (multipart, field `files`) | Recruiter, HR admin |
| `POST /jobs/{id}/screen`, `GET /tasks/{id}` | Recruiter, HR admin |
| `GET /jobs/{id}/ranking` | Recruiter, HR admin |
| `GET /proposals?status=`, `POST /proposals/{id}/approve`, `POST /proposals/{id}/reject` | Recruiter, HR admin |
| `GET /audit`, `GET /audit/verify` | HR admin |
| `GET /health` | Public |

## Demo data

All data is fictional; never put real candidate data in this repo.

- `data/samples/`: 29 CVs (normal candidates, fairness twins, and attack CVs: white text, tiny fonts, hidden DOCX runs, visible instructions, delimiter hijacking, French overrides, zero-width characters) and `mailpit_sample_emails.json` for the inbox milestone. Generated by `backend/scripts/generate_fictional_dataset.py`.
- `data/benchmark_dataset.json`: job offers and candidate profiles used by the dataset generator.
- `backend/scripts/make_sample_cvs.py` generates the smaller sample set the test suite uses.

Log in as `recruiter@trusthr.demo`, upload CVs from `data/samples/` to the "Junior Data Analyst" job, screen, then approve the shortlist proposal. Log in as `admin@trusthr.demo` to read the audit trail and verify its chain.

## Layout

```
backend/
  app/
    security/     Security Guard: file checks, extraction with hidden-text detection, sanitising, injection rules
    agents/       screening graph (LangGraph), LLM client, prompts, offline engine, orchestrator
    approvals/    proposals: create, approve, edit, reject
    gateway/      Action Gateway: the only code that changes candidate status (and later sends mail)
    audit/        append-only hash-chained audit log
    auth/         argon2 passwords, JWT cookie sessions, CSRF, roles
    api/          FastAPI routes
    worker/       PostgreSQL-backed task queue
    integrations/ Mailpit and calendar adapters (M2, M3)
  scripts/        seed.py, make_sample_cvs.py, generate_fictional_dataset.py
  tests/          67 tests on a real PostgreSQL database
frontend/         React dashboard (8 screens), Dockerfile, Caddyfile
data/             fictional CVs, emails and benchmark dataset
docs/             SECURITY.md (rules → controls → tests), REUSE.md, TEAM_CONTRACTS.md, PITCH_DEMO_SCRIPT.md
docker-compose.yml
```

See `docs/SECURITY.md` and `docs/REUSE.md`. Third-party attributions are in `THIRD_PARTY.md`.
