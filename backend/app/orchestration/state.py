from typing import TypedDict, Any
from pydantic import BaseModel, Field

class CriterionSpec(BaseModel):
    name: str
    weight: float = 1.0
    description: str
    required: bool = False

class CriterionResult(BaseModel):
    criterion_name: str
    criterion_weight: float = 1.0
    score: float = Field(ge=0.0, le=100.0)
    evidence_quote: str = ""
    evidence_verified: bool = False
    verification_confidence: float = 0.0
    reasoning: str = ""

class CandidateProfile(BaseModel):
    name: str
    email: str
    phone: str | None = None
    summary: str = ""

class ScreeningWorkflowState(TypedDict, total=False):
    # Inputs
    job_id: str
    job_title: str
    job_criteria: list[dict]
    file_name: str
    file_bytes: bytes
    
    # Validation & Security
    file_hash: str
    raw_text: str
    sanitized_text: str
    is_suspicious: bool
    security_status: str  # CLEAN, SUSPICIOUS_FLAGGED, QUARANTINED
    security_findings: list[dict]
    
    # Agent Extraction
    candidate_profile: dict
    raw_evaluations: list[dict]
    
    # Verification & Deterministic Scoring
    verified_evaluations: list[dict]
    final_score: float
    evaluation_summary: str
    
    # Proposals & Approvals
    proposed_action: dict | None
    
    # Workflow control
    status: str
    errors: list[str]
