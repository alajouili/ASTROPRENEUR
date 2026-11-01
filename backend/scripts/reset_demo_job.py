import os
import sys

sys.path.insert(0, 'backend')
os.environ['DATABASE_URL'] = 'sqlite:///trusthr_dev.db'
os.environ['JWT_SECRET'] = 'dev_secret_key_1234567890123456789012'

from app.db import get_sessionmaker
from app.models import Candidate, JobOffer, Proposal, Screening
from sqlalchemy import delete, select

db = get_sessionmaker()()

# Clean candidates and screenings for job-data-001
db.execute(delete(Screening).where(Screening.job_id == 'job-data-001'))
db.execute(delete(Proposal).where(Proposal.job_id == 'job-data-001'))
db.execute(delete(Candidate).where(Candidate.job_id == 'job-data-001'))

# Remove duplicate dynamic job if present
dup = db.scalar(select(JobOffer).where(JobOffer.id == 'db32934b-0d07-4fab-93d6-7f05c873f5da'))
if dup:
    db.execute(delete(Screening).where(Screening.job_id == dup.id))
    db.execute(delete(Proposal).where(Proposal.job_id == dup.id))
    db.execute(delete(Candidate).where(Candidate.job_id == dup.id))
    db.delete(dup)

db.commit()
print('DB clean: job-data-001 ready for virgin upload')
