# Reference repositories: what we reused and why

Each repository was cloned, read, and checked for a license. None of them were executed: they are third-party code and were treated as untrusted. Commits reviewed are listed so the review can be repeated.

| Repository | License | Stack | Decision |
|---|---|---|---|
| [miao4ai/open_recruiter](https://github.com/miao4ai/open_recruiter) @ `80aa87d` | MIT | FastAPI, SQLite, LLM agents, guardrails module | **Reused one list of regex patterns** (see below). |
| [Addisu-Taye/HR-recruitment-agent-Deployement](https://github.com/Addisu-Taye/HR-recruitment-agent-Deployement) @ `c2606e2` | MIT | Django, DRF, Celery + Redis, Presidio, React | No code reused. Different framework; Celery + Redis is heavier than we need. The idea of redacting PII before the model sees it informed our blind profile. |
| [shravangithub/AgentATS](https://github.com/shravangithub/AgentATS) @ `1664b6d` | MIT | Google Apps Script | No code reused. Different platform. Its explainable rubric scoring confirmed the "score per criterion, explain per criterion" approach. |
| [AthulyaA8623/AI-HR-Recruitment-Assistant](https://github.com/AthulyaA8623/AI-HR-Recruitment-Assistant) @ `68f4d2f` | **None found** | LangChain 0.2, LangGraph 0.2, Ollama, Chroma, FAISS | No code reused: without a license, the code is not ours to copy. Pinned versions are also old. |

## What we reused

**File:** `product/backend/app/guardrails/input_validator.py` from open_recruiter (MIT).

**What:** the list of English prompt-injection phrasings (instruction override, role override, "new instructions", system-prompt probes, chat-template tokens).

**Where:** `backend/app/security/injection.py`, rule list `_RULES`, credited in the module docstring.

**Changes:** we rewrote the patterns as named rules with severities, added French variants, added score and decision manipulation rules specific to CV screening, and added "message to the AI" and encoded-payload rules. Rules on hidden text are escalated to high severity.

**Why only this:** it is a small, well-scoped, permissively licensed list that saves time and has been used in a similar product. Everything else in the reference repos either uses a different stack, would add dependencies we don't need, or does not enforce the rules this project requires (deterministic scoring, verified evidence quotes, a gateway between agents and actions).

## What we built ourselves

Security Guard (file validation, hidden-text extraction from PDF and DOCX, Unicode sanitising), evidence verification, deterministic scoring and ranking, the screening graph, the proposal and approval workflow, the Action Gateway, the hash-chained audit log, auth, the task queue and the dashboard.
