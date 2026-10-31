# TrustHR AI — Hackathon Judge Demo Walkthrough

This document outlines the exact, step-by-step walkthrough to present TrustHR AI in **3 to 5 minutes** to hackathon judges.

---

## ⚡ 1-Minute Quick Start

```bash
# 1. Start the stack (PostgreSQL + FastAPI + Vite Caddy + Mailpit)
docker compose up -d --build

# 2. Seed and prepare the demo candidates, job offer, and proposals
docker compose run --rm api python -m scripts.demo_prep

# 3. Open dashboard
# Browser: http://localhost:8080
# Credentials: printed once by demo_prep (random), or set them first:
#   docker compose run --rm -e SEED_RECRUITER_PASSWORD=... -e SEED_ADMIN_PASSWORD=... -e SEED_EMPLOYEE_PASSWORD=... api python -m scripts.demo_prep --reset-passwords
```

---

## 🎬 3-Minute Live Presentation Script

### Minute 1: The Problem & Live Adversarial Ingestion
- **Pitch:** *"Under EU AI Act Annex III.4, recruitment AI is High Risk. Standard LLM screeners are vulnerable to prompt injections and hallucinations."*
- **Action:**
  1. Log in as `recruiter@trusthr.demo` with the password printed by `demo_prep`.
  2. Navigate to **Resume Screening** (`/screening`).
  3. Show the ranking table:
     - Notice **Amira Ben Salah** (Clean Baseline): **85.0%**, Clean Pass.
     - Notice **Youssef Trabelsi** (Clean Baseline vs Attack Twin): Both scored **65.0%**. The attack twin embedded invisible white text (`#FEFEFE`), but gained **0 extra points**!
     - Notice **Eve Infiltrator** (Direct injection `<|im_start|>system...`): Flagged as **Quarantined Risk**, prompt override completely ignored by deterministic code.
  4. Click **Inspect** on any candidate &rarr; view verbatim evidence quotes and rejected claims (*"Dropped: quote not found"*).

### Minute 2: The Golden Rule & Human Approval Gateway
- **Pitch:** *"The agent proposes, the human decides. No AI agent has permission to alter candidate state."*
- **Action:**
  1. Navigate to **Approval Queue** (`/approvals`).
  2. Open the pending proposal for Junior Data Analyst.
  3. Show the **Deterministic Action Gateway Pre-Flight Verification Checklist**:
     - `[x]` Human Authority (HR session verified)
     - `[x]` Double-submit CSRF cookie guard
     - `[x]` Tamper Barrier (payload hash matches creation audit entry)
     - `[x]` State Boundary (only eligible screened candidates)
  4. Remove or add candidate checkboxes as a human recruiter.
  5. Add review note: *"Verified technical skills with engineering lead."*
  6. Click **"Approve & Execute via Gateway"**.
  7. Show the instant green execution result: `{"shortlisted": [...]}` directly from `backend/app/gateway/executor.py`.

### Minute 3: Cryptographic Audit Trail & Adversarial Lab
- **Pitch:** *"Every action is chained backward via SHA-256 blocks with database triggers blocking in-place tampering."*
- **Action:**
  1. Navigate to **Audit Trail** (`/audit`).
  2. Click **"Verify Ledger Chain"** &rarr; Green badge: `Chain Verified: N blocks intact`.
  3. Click **"Simulate Tamper"** &rarr; Instant Stark **RED ALERT BANNER**:
     *"Cryptographic Chain Break Detected! Block #2 hash mismatch. Row payload altered out-of-band."*
  4. Click **"Re-verify Clean Chain"** &rarr; Restores green status.
  5. Click **Adversarial & Bias Lab** (`/lab`):
     - Show **Demographic Twins** (Leila Mansour vs Karim Mansour): Exactly **70.0% vs 70.0%** (0.0% bias delta).
     - Proves compliance with EU AI Act Annex III.4 non-discrimination requirements.

---

## 🛡️ Technical Verification Facts for Judges

| Evaluation Question | TrustHR AI Fact |
|---|---|
| **Can the LLM hallucinate candidate scores?** | **No.** The LLM only extracts quotes. The score is computed deterministically in Python (`compute_score` in `scoring.py`). Unverified quotes score 0%. |
| **Can invisible prompt injections fool the screener?** | **No.** `PyMuPDF` binary extraction strips microscopic (`<2pt`) and near-white text before any agent reads it (`extract.py`). |
| **Can an AI agent autonomously email a candidate?** | **No.** Agents generate proposals only. Only the Action Gateway (`executor.py`) executed by an authenticated human recruiter alters DB state. |
| **Can an attacker edit the audit logs in SQL?** | **No.** PostgreSQL triggers (`audit_log_no_update`, `audit_log_no_delete`) block updates/deletes, and `verify_chain` verifies SHA-256 links. |
| **Is the test suite real?** | **Yes.** Run `docker compose --profile test run --rm tests`: **79 passing tests in ~15s** against disposable PostgreSQL (`pgvector:pg16`). |
