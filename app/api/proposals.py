# app/api/proposals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.proposal import Proposal
from app.core.dependencies import require_role, verify_csrf
from app.core.gateway import execute_action

router = APIRouter(prefix="/proposals", tags=["proposals"])

@router.post("/create")
async def create_proposal(
    action_type: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["recruiter", "hr_admin"]))
):
    """The AI/Agent calls this. It does NOT send the email, it just saves a draft."""
    proposal = Proposal(
        action_type=action_type,
        payload=payload,
        status="pending",
        created_by=user.get("sub")
    )
    db.add(proposal)
    await db.commit()
    return {"message": "Proposal created", "id": proposal.id}

@router.get("/")
async def list_proposals(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["recruiter", "hr_admin"]))
):
    """Humans view pending drafts here."""
    result = await db.execute(select(Proposal).where(Proposal.status == "pending"))
    return result.scalars().all()

@router.post("/{proposal_id}/approve")
async def approve_proposal(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    # csrf: None = Depends(verify_csrf), # Enable when frontend is ready
    user: dict = Depends(require_role(["hr_admin"])) # ONLY HR Admin can approve!
):
    """Human clicks 'Approve'. This triggers the Gateway."""
    # 1. Fetch Proposal
    result = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = result.scalars().first()
    
    if not proposal or proposal.status != "pending":
        raise HTTPException(status_code=404, detail="Proposal not found or already processed")

    # 2. Execute via Gateway
    execution_result = execute_action(proposal.action_type, proposal.payload)

    # 3. Mark as approved
    proposal.status = "approved"
    await db.commit()

    return {"message": "Approved and executed", "result": execution_result}