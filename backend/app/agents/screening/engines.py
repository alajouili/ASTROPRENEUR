"""Screening engines: the LLM engine (Gemini/Groq) and the offline SIMULATED engine."""
from app.agents.llm import LLMClient, build_llm_client
from app.agents.prompts.screening import ASSESS_SYSTEM, EXTRACT_SYSTEM, assess_user_prompt, extract_user_prompt
from app.agents.screening.heuristic import HeuristicEngine
from app.agents.screening.schemas import IDENTITY_KEYS, AssessmentBatch, CandidateProfile, Criterion, CriterionAssessment
from app.config import Settings


class LLMEngine:
    def __init__(self, client: LLMClient):
        self.client = client
        self.label = client.label

    def extract_profile(self, cv_text: str, criteria: list[Criterion]) -> tuple[CandidateProfile, list[str]]:
        profile, raw, used = self.client.complete_json(
            EXTRACT_SYSTEM, extract_user_prompt(cv_text, [c.label for c in criteria]), CandidateProfile
        )
        self.label = used
        dropped = sorted(k for k in raw if k.lower() in IDENTITY_KEYS)  # never stored, only reported
        return profile, dropped

    def assess(self, profile: CandidateProfile, criteria: list[Criterion]) -> list[CriterionAssessment]:
        if not any(c.type == "keywords" for c in criteria):
            return []
        batch, _, used = self.client.complete_json(
            ASSESS_SYSTEM, assess_user_prompt(profile.model_dump(), [c.model_dump() for c in criteria]), AssessmentBatch
        )
        self.label = used
        return batch.assessments


def build_engine(settings: Settings):
    client = build_llm_client(settings)
    return LLMEngine(client) if client else HeuristicEngine()
