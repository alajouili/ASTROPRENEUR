import React, { useState, useEffect } from 'react';
import { api, JobOffer, Candidate, CandidateDetail } from '../services/api';
import { CandidateRanking } from '../components/CandidateRanking';
import { EvidenceModal } from '../components/EvidenceModal';
import { UploadResumeModal } from '../components/UploadResumeModal';
import { Briefcase, Filter, Sparkles, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

interface ScreeningPageProps {
  onDataChanged?: () => void;
}

export const ScreeningPage: React.FC<ScreeningPageProps> = ({ onDataChanged }) => {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CLEAN' | 'FLAGGED' | 'TOP'>('ALL');
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<CandidateDetail | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
        loadCandidates(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load jobs', e);
    }
  };

  const loadCandidates = async (jobId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getRankedCandidates(jobId);
      setCandidates(data);
    } catch (e) {
      console.error('Failed to load candidates', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (candidateId: string) => {
    try {
      const detail = await api.getCandidateDetails(candidateId);
      setSelectedCandidateDetail(detail);
    } catch (e) {
      console.error('Failed to fetch candidate details', e);
    }
  };

  const handleResumeUploaded = () => {
    if (selectedJob) {
      loadCandidates(selectedJob.id);
    }
    if (onDataChanged) onDataChanged();
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    if (filterMode === 'CLEAN') return c.security_status === 'CLEAN';
    if (filterMode === 'FLAGGED') return c.security_status === 'SUSPICIOUS_FLAGGED';
    if (filterMode === 'TOP') return c.overall_score >= 75;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Job Selection & Filters Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Briefcase className="w-4 h-4 text-sky-600" />
            <span>Active Position:</span>
          </div>
          <select
            value={selectedJob?.id || ''}
            onChange={(e) => {
              const j = jobs.find((x) => x.id === e.target.value);
              if (j) {
                setSelectedJob(j);
                loadCandidates(j.id);
              }
            }}
            className="p-2 border border-slate-300 rounded-lg text-sm font-medium bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Filter Shortlist:</span>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'ALL' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Candidates ({candidates.length})
          </button>
          <button
            onClick={() => setFilterMode('TOP')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'TOP' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Score &ge; 75%
          </button>
          <button
            onClick={() => setFilterMode('CLEAN')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'CLEAN' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Clean Only
          </button>
          <button
            onClick={() => setFilterMode('FLAGGED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'FLAGGED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Flagged Attacks
          </button>
          <button
            onClick={() => selectedJob && loadCandidates(selectedJob.id)}
            title="Refresh Candidate List"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Candidate Ranking View */}
      <CandidateRanking
        candidates={filteredCandidates}
        onSelectCandidate={handleSelectCandidate}
        onOpenUpload={() => setIsUploadOpen(true)}
        isLoading={isLoading}
        jobTitle={selectedJob?.title || 'Senior Backend Engineer'}
      />

      {/* Evidence Modal */}
      {selectedCandidateDetail && (
        <EvidenceModal
          candidate={selectedCandidateDetail}
          onClose={() => setSelectedCandidateDetail(null)}
        />
      )}

      {/* Upload Modal */}
      {isUploadOpen && selectedJob && (
        <UploadResumeModal
          jobId={selectedJob.id}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleResumeUploaded}
        />
      )}
    </div>
  );
};
