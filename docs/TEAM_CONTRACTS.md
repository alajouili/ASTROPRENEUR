# Team Work Plan & Interface Contracts — TrustHR AI

**Event:** Secure AI HR System Hackathon (17 Hours)  
**Strategy:** Hybrid Development & Strict Division of Responsibility (Zero Merge Conflicts)

---

## 👥 Ownership & Build Hours

| Member | Ownership Area | Primary Scope | Hours | Share |
| :--- | :--- | :--- | :---: | :---: |
| **Member 1** | **Core AI & Backend Engine** | LangGraph Orchestrator, LLM Client (Gemini/Groq fallback), Scoring Engine, Batching, Mailpit & Calendar Adapters, Policy RAG | 15.0h | 39% |
| **Member 2** | **Security & Trust** | Security Guard, Forensic hidden-text & bilingual injection scanner, Auth/Roles (Argon2id, CSRF), Action Gateway, Append-only Audit, Red-team attacks | 12.5h | 33% |
| **Member 3 (You)** | **Product Experience & Pitch** | React Dashboard (8 screens), Fictional Dataset (120 CVs, 200 emails), README, Pitch Deck, Demo Script, Backup Video | 10.5h | 28% |

---

## 📁 File & Folder Ownership Boundaries

To guarantee **zero merge conflicts**, every file and directory has exactly ONE owner:

```
trusthr-ai/
├── backend/
│   ├── app/
│   │   ├── agents/          <-- Member 1 (Screening graph, LLM client, Prompts)
│   │   ├── api/
│   │   │   ├── routes_screening.py  <-- Member 1
│   │   │   ├── routes_inbox.py      <-- Member 1 (M2)
│   │   │   ├── routes_scheduling.py <-- Member 1 (M3)
│   │   │   ├── routes_approval.py   <-- Member 2
│   │   │   └── routes_audit.py      <-- Member 2
│   │   ├── security/        <-- Member 2 (extract.py, injection.py, guard.py)
│   │   ├── gateway/         <-- Member 2 (Action Gateway, execution checks)
│   │   ├── auth/            <-- Member 2 (JWT, Argon2, CSRF, rate-limits)
│   │   └── rag/             <-- Member 1 (Policy embeddings & RAG)
├── frontend/                <-- Member 3 (React, Tailwind, 8 screens, Mock Switch)
├── data/
│   ├── samples/             <-- Member 3 (Fictional CVs & Email seeds)
│   └── attacks/             <-- Member 2 (Red-team attack vectors)
├── docs/
│   ├── SECURITY.md          <-- Member 2
│   ├── REUSE.md             <-- Member 1 & 2
│   └── TEAM_CONTRACTS.md    <-- All members
└── docker-compose.yml       <-- Member 2
```

---

## 🔌 API & Integration Contracts

| Due | Contract | Provider | Consumer | Artifact |
| :--- | :--- | :---: | :---: | :--- |
| **H1** | Compose stack & Stubs | Member 2 | All | `docker-compose.yml`, `guard.scan()` stub |
| **H1** | OpenAPI spec & Mock JSON | Member 1 | Member 3 | `openapi.json` |
| **H2** | Sample CVs & Attacks | Member 3 / 2 | Member 1 | `data/samples/` |
| **H3** | Auth flow & CSRF tokens | Member 2 | Member 3 | `/api/auth/login` contract |
| **H4** | Real Forensic Guard | Member 2 | Member 1 | `backend/app/security/extract.py` |
| **H6** | Live Business API | Member 1 | Member 3 | `/api/jobs/{id}/candidates` live |
| **H8** | Live Approval Endpoints | Member 2 | Member 3 | `/api/approvals/{id}/dispatch` |
| **H10** | Full Pipeline Ready | Member 1 | Member 2 | Ready for 20-attack red-team suite |
| **H12** | Frontend Hand-off | Member 3 | Member 2 | Security review (plain text rendering check) |
| **H15** | Pitch Assembly | Member 3 | All | Pitch deck, 5-minute script, backup video |

---

## 🎯 Member 3 (Product Experience) — 8 Screens Checklist

- [x] **Screen 1: Home & Overview** (`/`) — Top KPI counters, pipeline summary, live security alert counters.
- [x] **Screen 2: Candidate Ranking** (`/screening`) — Ranked table, deterministic match score, risk badges, evidence quote inspector modal.
- [x] **Screen 3: Human Approval Queue** (`/approvals`) — Candidate proposals, live draft editor, review notes, one-click Action Gateway dispatch.
- [x] **Screen 4: Security & Audit Trail** (`/audit`) — SHA-256 chained blocks stream with cryptographic verification badge.
- [x] **Screen 5: Inbox Triage & Daily Digest** (`/inbox`) — Grouped by type and urgency, "Needs human" toggle.
- [x] **Screen 6: Interview Scheduling Calendar** (`/scheduling`) — Recruiter week view, proposed candidate slots.
- [x] **Screen 7: Employee Policy Assistant** (`/assistant`) — RAG chat with source citations.
- [x] **Screen 8: Login & Role Switcher** (`/login`) — Recruiter, HR Admin, Employee credentials.
