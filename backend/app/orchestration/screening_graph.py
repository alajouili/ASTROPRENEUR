from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.orchestration.state import ScreeningWorkflowState
from backend.app.security.file_validator import validate_and_extract_file, FileValidationError
from backend.app.security.guard import scan_for_prompt_injections
from backend.app.security.evidence_verifier import verify_quote_against_source, calculate_deterministic_ranking_score
from backend.app.agents.screening_agent import run_screening_agent
from backend.app.gateway.approval import create_pending_proposal
from backend.app.gateway.action_gateway import create_audit_entry
from backend.app.db.models import Candidate, CriterionEvaluation

class ScreeningOrchestrator:
    """
    Predictable, typed LangGraph-style workflow orchestrator for resume screening.
    Ensures strict step-by-step state progression with deterministic security checks.
    """

    @classmethod
    async def process_resume_submission(
        cls,
        db: AsyncSession,
        job_id: str,
        job_title: str,
        job_criteria: list[dict],
        file_name: str,
        file_bytes: bytes
    ) -> dict:
        state: ScreeningWorkflowState = {
            "job_id": job_id,
            "job_title": job_title,
            "job_criteria": job_criteria,
            "file_name": file_name,
            "file_bytes": file_bytes,
            "errors": [],
            "status": "INITIATED"
        }

        # Step 1: File Validation & Extraction
        try:
            file_result = validate_and_extract_file(file_name, file_bytes)
            state["file_hash"] = file_result.file_hash
            state["raw_text"] = file_result.text_content
            state["status"] = "FILE_VALIDATED"
        except FileValidationError as e:
            state["errors"].append(str(e))
            state["status"] = "FILE_VALIDATION_FAILED"
            return state

        # Step 2: Security Guard Scan (Prompt Injection & Malicious Content)
        sec_res = scan_for_prompt_injections(state["raw_text"])
        state["sanitized_text"] = sec_res.sanitized_text
        state["is_suspicious"] = sec_res.is_suspicious
        state["security_status"] = "SUSPICIOUS_FLAGGED" if sec_res.is_suspicious else "CLEAN"
        state["security_findings"] = [
            {
                "rule": f.rule,
                "severity": f.severity,
                "description": f.description,
                "snippet": f.matched_snippet
            }
            for f in sec_res.findings
        ]

        # Step 3: Candidate Profile Extraction & Job-Criteria Evaluation (Agent)
        agent_output = await run_screening_agent(
            raw_cv_text=state["sanitized_text"],
            job_criteria=job_criteria,
            job_title=job_title
        )
        state["candidate_profile"] = agent_output.candidate.model_dump()
        state["raw_evaluations"] = [ev.model_dump() for ev in agent_output.evaluations]
        state["evaluation_summary"] = agent_output.summary

        # Step 4: Deterministic Evidence Verification (Python substring matching)
        verified_evals = []
        for ev in state["raw_evaluations"]:
            quote = ev.get("evidence_quote", "")
            is_verified, confidence, matched_snippet = verify_quote_against_source(
                source_text=state["raw_text"],
                quote=quote
            )
            verified_evals.append({
                **ev,
                "evidence_verified": is_verified,
                "verification_confidence": confidence,
                "matched_snippet": matched_snippet
            })

        # Step 5: Deterministic Score Calculation
        final_score, ranked_evaluations = calculate_deterministic_ranking_score(verified_evals)
        state["verified_evaluations"] = ranked_evaluations
        state["final_score"] = final_score

        # Step 6: Database Persistence
        candidate = Candidate(
            job_id=job_id,
            name=state["candidate_profile"].get("name", "Unknown Applicant"),
            email=state["candidate_profile"].get("email", "unknown@example.com"),
            phone=state["candidate_profile"].get("phone"),
            raw_cv_text=state["raw_text"],
            file_name=file_name,
            file_hash=state["file_hash"],
            security_status=state["security_status"],
            security_findings=state["security_findings"],
            overall_score=final_score,
            evaluation_summary=state["evaluation_summary"],
            status="SCREENED"
        )
        db.add(candidate)
        await db.flush()

        # Save individual criteria evaluations
        for ev in ranked_evaluations:
            crit_record = CriterionEvaluation(
                candidate_id=candidate.id,
                criterion_name=ev["criterion_name"],
                criterion_weight=ev.get("criterion_weight", 1.0),
                score=ev["score"],
                evidence_quote=ev.get("evidence_quote", ""),
                evidence_verified=ev.get("evidence_verified", False),
                reasoning=ev.get("reasoning", "")
            )
            db.add(crit_record)

        # Step 7: Draft Human-Review Action Proposal (NO autonomous dispatch!)
        action_type = "SEND_EMAIL_INVITE" if final_score >= 60.0 else "SEND_EMAIL_REJECT"
        if final_score >= 60.0:
            email_body = (
                f"Dear {candidate.name},\n\n"
                f"Thank you for applying for the position of {job_title} at our organization. "
                f"We were impressed with your background in {job_title}. We would like to invite you for a 45-minute technical conversation.\n\n"
                f"Please let us know your availability over the upcoming week.\n\n"
                f"Best regards,\nTrustHR Recruitment Team"
            )
        else:
            email_body = (
                f"Dear {candidate.name},\n\n"
                f"Thank you for your interest in the {job_title} position. While your qualifications are strong, "
                f"we have decided to proceed with other applicants whose experience more closely matches our current needs.\n\n"
                f"We wish you the very best in your search.\n\n"
                f"Best regards,\nTrustHR Recruitment Team"
            )

        proposal = await create_pending_proposal(
            db=db,
            candidate_id=candidate.id,
            action_type=action_type,
            payload={
                "to_email": candidate.email,
                "candidate_name": candidate.name,
                "subject": f"Update on your application for {job_title}",
                "body": email_body,
                "proposed_slots": ["2026-11-04 14:00 UTC", "2026-11-05 10:00 UTC", "2026-11-06 16:00 UTC"] if final_score >= 60 else []
            }
        )
        state["proposed_action"] = {
            "id": proposal.id,
            "action_type": proposal.action_type,
            "status": proposal.status,
            "payload": proposal.payload
        }

        # Step 8: Log Immutable Audit Event
        await create_audit_entry(
            db=db,
            actor="SCREENING_ORCHESTRATOR",
            action="RESUME_SCREENED_AND_RANKED",
            target_id=candidate.id,
            details={
                "candidate_name": candidate.name,
                "overall_score": final_score,
                "security_status": state["security_status"],
                "security_findings_count": len(state["security_findings"]),
                "proposal_id": proposal.id,
                "criteria_count": len(ranked_evaluations)
            }
        )

        state["candidate_id"] = candidate.id
        state["status"] = "COMPLETED"
        return state
