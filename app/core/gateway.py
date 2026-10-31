# app/core/gateway.py
from app.core.output_guard import check_output
from fastapi import HTTPException
import smtplib
from email.message import EmailMessage

def execute_action(action_type: str, payload: dict):
    """
    The Action Gateway. Re-validates the payload and executes the action.
    This is called ONLY after a human approves the proposal.
    """
    # 1. Re-validation (Defense in Depth)
    if action_type == "send_email":
        body = payload.get("body", "")
        to_email = payload.get("to", "")
        
        # Check for output violations again, just in case
        is_safe, violations = check_output(body, other_candidate_names=[])
        if not is_safe:
            raise HTTPException(status_code=400, detail=f"Gateway blocked execution: {violations}")

        # Check that the recipient is valid
        if "@" not in to_email:
            raise HTTPException(status_code=400, detail="Invalid recipient email")

        # 2. Execute (Mocked for local testing)
        print(f"📧 [GATEWAY] Sending email to {to_email}")
        print(f"Body: {body}")
        # In production, use smtplib to connect to Mailpit
        return {"status": "sent", "to": to_email}

    elif action_type == "schedule_interview":
        print(f"📅 [GATEWAY] Scheduling interview: {payload}")
        return {"status": "scheduled"}

    else:
        raise HTTPException(status_code=400, detail="Unknown action type")