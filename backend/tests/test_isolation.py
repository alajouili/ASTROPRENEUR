"""One candidate's CV is never shown to the model while another candidate is being screened."""
import json

import httpx

from app.agents import orchestrator
from app.agents.llm import LLMClient, OpenAICompatibleProvider
from app.agents.prompts.screening import EXTRACT_SYSTEM
from app.agents.screening.engines import LLMEngine
from app.security.extract import extract
from app.worker.runner import run_until_empty

NAMES = ["amira_ben_salah", "sara_khelifi", "youssef_trabelsi"]
EMPTY_PROFILE = json.dumps({"skills": [], "experience_years": None, "education": [], "languages": [], "certifications": []})


def test_each_llm_call_sees_exactly_one_cv(as_role, job, samples, monkeypatch):
    calls: list[tuple[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        system, user = body["messages"][0]["content"], body["messages"][1]["content"]
        calls.append((system, user))
        reply = EMPTY_PROFILE if system == EXTRACT_SYSTEM else json.dumps({"assessments": []})
        return httpx.Response(200, json={"choices": [{"message": {"content": reply}}]})

    provider = OpenAICompatibleProvider("groq", "test-key", "test-model", 5, transport=httpx.MockTransport(handler))
    monkeypatch.setattr(orchestrator, "build_engine", lambda settings: LLMEngine(LLMClient([provider])))

    recruiter = as_role("recruiter")
    assert recruiter.upload(job.id, [samples[n] for n in NAMES]).status_code == 200
    assert recruiter.post(f"/api/jobs/{job.id}/screen").status_code == 202
    assert run_until_empty() == 1

    # A marker line that is unique to each CV (its first visible line).
    markers = {}
    for n in NAMES:
        text = extract(samples[n].read_bytes(), "pdf").visible_text
        markers[n] = next(line.strip() for line in text.splitlines() if line.strip())
    assert len(set(markers.values())) == len(NAMES)

    extract_prompts = [u for s, u in calls if s == EXTRACT_SYSTEM]
    assess_prompts = [u for s, u in calls if s != EXTRACT_SYSTEM]
    assert len(extract_prompts) == len(NAMES) and len(assess_prompts) == len(NAMES)
    for prompt in extract_prompts:
        assert sum(marker in prompt for marker in markers.values()) == 1
    for n, marker in markers.items():
        assert sum(marker in p for p in extract_prompts) == 1, n
    # Criteria are assessed from the blind profile only, never from raw CV text.
    for prompt in assess_prompts:
        assert not any(marker in prompt for marker in markers.values())
