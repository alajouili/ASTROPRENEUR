import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.db.models import Base, Candidate, JobOffer, PendingAction
from backend.app.gateway.approval import create_pending_proposal, review_pending_action
from backend.app.gateway.action_gateway import ActionGateway, create_audit_entry

@pytest_asyncio.fixture
async def async_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()

@pytest.mark.asyncio
async def test_action_gateway_blocks_unapproved_action(async_db: AsyncSession):
    # Setup candidate & pending proposal
    candidate = Candidate(
        job_id="dummy-job",
        name="Candidate One",
        email="cand1@example.com",
        raw_cv_text="CV text",
        file_name="cv.txt",
        file_hash="abc"
    )
    async_db.add(candidate)
    await async_db.flush()

    action = await create_pending_proposal(
        db=async_db,
        candidate_id=candidate.id,
        action_type="SEND_EMAIL_INVITE",
        payload={"to_email": candidate.email, "subject": "Interview", "body": "Invite text"}
    )
    await async_db.commit()

    # Attempting to dispatch an action whose status is still PENDING must raise PermissionError
    with pytest.raises(PermissionError) as exc_info:
        await ActionGateway.dispatch_approved_action(async_db, action.id)

    assert "is not APPROVED" in str(exc_info.value)

@pytest.mark.asyncio
async def test_human_approval_and_safe_dispatch(async_db: AsyncSession):
    candidate = Candidate(
        job_id="dummy-job",
        name="Candidate Two",
        email="cand2@example.com",
        raw_cv_text="CV text",
        file_name="cv.txt",
        file_hash="xyz"
    )
    async_db.add(candidate)
    await async_db.flush()

    action = await create_pending_proposal(
        db=async_db,
        candidate_id=candidate.id,
        action_type="SEND_EMAIL_INVITE",
        payload={"to_email": candidate.email, "subject": "Interview", "body": "Original draft"}
    )
    await async_db.commit()

    # Recruiter reviews and approves action with edits
    reviewed = await review_pending_action(
        db=async_db,
        action_id=action.id,
        decision="APPROVED",
        reviewer="lead_recruiter_sarah",
        review_notes="Looks great, adjusted interview date",
        edited_payload={"to_email": candidate.email, "subject": "Technical Interview", "body": "Approved body text"}
    )
    await async_db.commit()
    assert reviewed.status == "APPROVED"
    assert reviewed.reviewed_by == "lead_recruiter_sarah"

    # Now Action Gateway can safely execute
    result = await ActionGateway.dispatch_approved_action(async_db, action.id)
    await async_db.commit()

    assert result["status"] in ("SENT_VIA_SMTP", "SIMULATED_LOCAL_DELIVERY")
    assert reviewed.status == "EXECUTED"
    assert reviewed.executed_at is not None
