"""Typed contracts for the screening workflow. Every LLM output is validated against these."""
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Keys that must never reach the scoring step (blind screening). If an LLM returns
# any of them they are dropped and the drop is recorded as a flag.
IDENTITY_KEYS = {
    "name", "full_name", "first_name", "last_name", "email", "phone", "address", "location",
    "age", "date_of_birth", "birth_date", "gender", "sex", "nationality", "photo", "marital_status",
    "religion", "ethnicity", "linkedin", "contact",
}


class Criterion(BaseModel):
    """One job requirement, defined by HR. Only these criteria can influence a score."""

    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[a-z0-9_]{1,40}$")
    label: str = Field(min_length=1, max_length=80)
    kind: Literal["must", "nice"]
    weight: int = Field(ge=1, le=5)
    type: Literal["keywords", "min_years"] = "keywords"
    keywords: list[str] = Field(default_factory=list, max_length=15)
    min_years: float | None = Field(default=None, ge=0, le=40)

    @model_validator(mode="after")
    def _check(self) -> "Criterion":
        if self.type == "keywords" and not self.keywords:
            raise ValueError("keyword criteria need at least one keyword")
        if self.type == "min_years" and self.min_years is None:
            raise ValueError("min_years criteria need min_years")
        self.keywords = [k.strip() for k in self.keywords if k.strip()][:15]
        return self


class EvidencedItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=1, max_length=120)
    quote: str = Field(min_length=3, max_length=300)


class EvidencedYears(BaseModel):
    model_config = ConfigDict(extra="ignore")
    value: float = Field(ge=0, le=60)
    quote: str = Field(min_length=3, max_length=300)


class CandidateProfile(BaseModel):
    """Blind profile: job-related facts only, each tied to a verbatim quote from the CV.
    There is deliberately no field for identity, contact or demographic data."""

    model_config = ConfigDict(extra="ignore")
    skills: list[EvidencedItem] = Field(default_factory=list, max_length=60)
    experience_years: EvidencedYears | None = None
    education: list[EvidencedItem] = Field(default_factory=list, max_length=10)
    languages: list[EvidencedItem] = Field(default_factory=list, max_length=10)
    certifications: list[EvidencedItem] = Field(default_factory=list, max_length=20)

    def all_items(self) -> list[tuple[str, EvidencedItem]]:
        out: list[tuple[str, EvidencedItem]] = []
        for field_name in ("skills", "education", "languages", "certifications"):
            out.extend((field_name, item) for item in getattr(self, field_name))
        return out


class CriterionAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    criterion_id: str
    result: Literal["met", "partial", "missing"]
    evidence: list[str] = Field(default_factory=list, max_length=3)
    note: str = Field(default="", max_length=240)


class AssessmentBatch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    assessments: list[CriterionAssessment]


class ShortlistPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    job_id: str
    candidate_ids: list[str] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def _unique(self) -> "ShortlistPayload":
        if len(set(self.candidate_ids)) != len(self.candidate_ids):
            raise ValueError("duplicate candidate ids")
        if not all(re.fullmatch(r"[0-9a-f-]{36}", c) for c in self.candidate_ids):
            raise ValueError("invalid candidate id")
        return self
