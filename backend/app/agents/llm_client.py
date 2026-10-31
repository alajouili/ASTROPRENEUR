import json
import re
from typing import TypeVar, Type
from pydantic import BaseModel
import httpx
from backend.app.config import settings

T = TypeVar("T", bound=BaseModel)

class MockLLMHandler:
    """
    Deterministic offline LLM simulation engine.
    Ensures 100% test reliability, zero external API flakiness,
    and fast offline hackathon evaluation while strictly adhering
    to Pydantic response models and job-related criteria.
    """
    @staticmethod
    def extract_candidate_info(text: str) -> dict:
        # Regex for email
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        email = email_match.group(0) if email_match else "candidate@example.org"

        # Regex for phone
        phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        phone = phone_match.group(0) if phone_match else "+1-555-0199"

        # Candidate name heuristics (first non-empty line or explicit label)
        name = "Unknown Candidate"
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:5]:
            if line.lower().startswith("name:"):
                name = line.split(":", 1)[1].strip()
                break
            elif not any(char in line for char in ["@", "http", "www", "+", ":", "•", "|"]) and len(line.split()) in (2, 3):
                name = line
                break
        
        return {
            "name": name,
            "email": email,
            "phone": phone,
            "summary": f"Applicant profile evaluated against role requirements."
        }

    @staticmethod
    def evaluate_criteria(candidate_text: str, criteria: list[dict]) -> list[dict]:
        results = []
        lower_text = candidate_text.lower()
        sentences = [s.strip() for s in re.split(r"[.\n;]", candidate_text) if s.strip()]

        for crit in criteria:
            name = crit.get("name", "General Qualification")
            weight = crit.get("weight", 1.0)
            desc = crit.get("description", "")
            keywords = [w.strip().lower() for w in re.split(r"[\s,/]+", name + " " + desc) if len(w) > 3]

            best_quote = ""
            matched_keywords = 0

            for s in sentences:
                s_lower = s.lower()
                matches = sum(1 for kw in keywords if kw in s_lower)
                if matches > matched_keywords:
                    matched_keywords = matches
                    best_quote = s

            # Deterministic scoring based on actual matched qualifications
            if matched_keywords >= 2 and len(best_quote) > 10:
                score = min(95.0, 70.0 + (matched_keywords * 7.0))
                reasoning = f"Demonstrates strong alignment with {name}. Verifiable experience documented in CV."
            elif matched_keywords == 1 and len(best_quote) > 10:
                score = 65.0
                reasoning = f"Partially satisfies {name} requirements with basic exposure."
            else:
                score = 25.0
                best_quote = ""
                reasoning = f"Limited or unverified evidence found in CV for {name}."

            results.append({
                "criterion_name": name,
                "criterion_weight": weight,
                "score": score,
                "evidence_quote": best_quote,
                "reasoning": reasoning
            })

        return results

    @classmethod
    def generate_response(cls, system_prompt: str, user_prompt: str, response_model: Type[T]) -> T:
        # Check if the user prompt is asking for screening evaluation
        if "criteria" in user_prompt.lower() or "candidate" in user_prompt.lower():
            # Extract criteria if embedded
            criteria_match = re.search(r"Evaluation Criteria:\s*(\[.*?\])", user_prompt, re.DOTALL)
            criteria = []
            if criteria_match:
                try:
                    criteria = json.loads(criteria_match.group(1))
                except Exception:
                    pass

            if not criteria:
                criteria = [
                    {"name": "Python & Backend Systems", "weight": 1.5, "description": "FastAPI, PostgreSQL, AsyncIO"},
                    {"name": "Security & Architecture", "weight": 1.2, "description": "Secure API design, injection defense"},
                    {"name": "System Reliability & Testing", "weight": 1.0, "description": "Unit testing, CI/CD"}
                ]

            # Extract the actual candidate CV section (inside <untrusted_candidate_document>)
            cv_match = re.search(r"<untrusted_candidate_document>(.*?)</untrusted_candidate_document>", user_prompt, re.DOTALL)
            if cv_match:
                cv_raw = cv_match.group(1)
                # Strip out caution comment
                cv_raw = re.sub(r"<!--.*?-->", "", cv_raw, flags=re.DOTALL)
                candidate_doc_text = cv_raw.replace("&lt;", "<").replace("&gt;", ">").strip()
            else:
                candidate_doc_text = user_prompt

            candidate_info = cls.extract_candidate_info(candidate_doc_text)
            criteria_results = cls.evaluate_criteria(candidate_doc_text, criteria)

            mock_data = {
                "candidate": candidate_info,
                "evaluations": criteria_results,
                "summary": f"Completed screening for {candidate_info['name']}. Evaluated {len(criteria_results)} job-related criteria."
            }

            try:
                return response_model.model_validate(mock_data)
            except Exception:
                pass

        # Generic fallback
        return response_model.model_construct()


class LLMClient:
    """
    Unified LLM gateway supporting mock offline engine, Google Gemini, and OpenAI.
    """
    def __init__(self):
        self.provider = settings.llm_provider

    async def complete_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T]
    ) -> T:
        # Default or fallback to mock handler
        if self.provider == "mock" or (self.provider == "gemini" and not settings.gemini_api_key) or (self.provider == "openai" and not settings.openai_api_key):
            return MockLLMHandler.generate_response(system_prompt, user_prompt, response_model)

        if self.provider == "gemini" and settings.gemini_api_key:
            return await self._call_gemini(system_prompt, user_prompt, response_model)

        if self.provider == "openai" and settings.openai_api_key:
            return await self._call_openai(system_prompt, user_prompt, response_model)

        return MockLLMHandler.generate_response(system_prompt, user_prompt, response_model)

    async def _call_gemini(self, system_prompt: str, user_prompt: str, response_model: Type[T]) -> T:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            return response_model.model_validate(parsed)

    async def _call_openai(self, system_prompt: str, user_prompt: str, response_model: Type[T]) -> T:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return response_model.model_validate(parsed)

llm_client = LLMClient()
