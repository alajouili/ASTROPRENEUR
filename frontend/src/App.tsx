import React, { useState, useEffect } from 'react';
import { api, JobOffer, Candidate, CandidateDetail, PendingApproval, AuditResponse } from './services/api';
import { Navbar } from './components/Navbar';
import { CandidateRanking } from './components/CandidateRanking';
import { EvidenceModal } from './components/EvidenceModal';
import { ApprovalQueue } from './components/ApprovalQueue';
import { AuditLogView } from './components/AuditLogView';
import { UploadResumeModal } from './components/UploadResumeModal';
import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'approvals' | 'audit'>('candidates');
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<CandidateDetail | null>(null);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);

  const [isLoadingCandidates, setIsLoadingCandidates] = useState<boolean>(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState<boolean>(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Initial load: ensure job offer exists
  useEffect(() => {
    initializeJobData();
  }, []);

  const initializeJobData = async () => {
    try {
      const existingJobs = await api.getJobs();
      if (existingJobs.length > 0) {
        setJobs(existingJobs);
        setSelectedJob(existingJobs[0]);
        loadCandidates(existingJobs[0].id);
      } else {
        // Create default benchmark job offer
        const newJob = await api.createJob({
          title: 'Senior Backend Engineer - Python & Distributed Systems',
          department: 'Core Infrastructure',
          description: 'Architect high-throughput distributed microservices in Python. Enforce strict API security, relational data integrity, and deterministic testing.',
          criteria: [
            {
              name: 'Python & AsyncIO Systems',
              weight: 2.0,
              description: 'FastAPI, Python AsyncIO, concurrency, high-performance architecture',
              required: true,
            },
            {
              name: 'Relational Databases & Performance',
              weight: 1.5,
              description: 'PostgreSQL, SQLAlchemy, indexing, transactional integrity',
              required: true,
            },
            {
              name: 'Security & Defense-in-Depth',
              weight: 1.5,
              description: 'API security, OAuth2/JWT, input sanitization, OWASP prevention',
              required: false,
            },
            {
              name: 'Testing & System Reliability',
              weight: 1.0,
              description: 'Pytest unit testing, automated verification pipelines',
              required: false,
            },
          ],
        });
        setJobs([newJob]);
        setSelectedJob(newJob);
        loadCandidates(newJob.id);
      }
      loadApprovals();
      loadAudit();
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  const loadCandidates = async (jobId: string) => {
    setIsLoadingCandidates(true);
    try {
      const data = await api.getRankedCandidates(jobId);
      setCandidates(data);
    } catch (err) {
      console.error('Error loading candidates:', err);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const loadApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err) {
      console.error('Error loading approvals:', err);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const loadAudit = async () => {
    setIsLoadingAudit(true);
    try {
      const data = await api.getAuditTrail();
      setAuditData(data);
    } catch (err) {
      console.error('Error loading audit trail:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSelectCandidate = async (candidateId: string) => {
    try {
      const detail = await api.getCandidateDetails(candidateId);
      setSelectedCandidateDetail(detail);
    } catch (err) {
      console.error('Error fetching candidate details:', err);
    }
  };

  const handleResumeUploaded = () => {
    if (selectedJob) {
      loadCandidates(selectedJob.id);
    }
    loadApprovals();
    loadAudit();
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;
  const securityAlertCount = candidates.filter((c) => c.security_status === 'SUSPICIOUS_FLAGGED').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingApprovalsCount}
        securityAlertCount={securityAlertCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'candidates' && (
          <CandidateRanking
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            onOpenUpload={() => setIsUploadOpen(true)}
            isLoading={isLoadingCandidates}
            jobTitle={selectedJob?.title || 'Senior Backend Engineer'}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueue
            approvals={approvals}
            onRefresh={() => {
              loadApprovals();
              if (selectedJob) loadCandidates(selectedJob.id);
              loadAudit();
            }}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            auditData={auditData}
            onRefresh={loadAudit}
            isLoading={isLoadingAudit}
          />
        )}
      </main>

      {/* Evidence Breakdown Modal */}
      {selectedCandidateDetail && (
        <EvidenceModal
          candidate={selectedCandidateDetail}
          onClose={() => setSelectedCandidateDetail(null)}
        />
      )}

      {/* Upload & Screen Resume Modal */}
      {isUploadOpen && selectedJob && (
        <UploadResumeModal
          jobId={selectedJob.id}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleResumeUploaded}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            TrustHR AI &bull; Secure Multi-Agent HR Recruitment Platform
          </p>
          <p>
            Golden Rule: The agent executes, the human decides about people. Prompt-injection resilient &bull; Deterministic scoring &bull; Cryptographic audit trail.
          </p>
        </div>
      </footer>
    </div>
  );
};
