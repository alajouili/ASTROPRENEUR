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
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchFile = c.file_name.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchFile) return false;
    }
    if (filterMode === 'CLEAN') return c.security_status === 'CLEAN';
    if (filterMode === 'FLAGGED') return c.security_status === 'SUSPICIOUS_FLAGGED';
    if (filterMode === 'TOP') return c.overall_score >= 75;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Job Selection & Filters Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span>Requisition:</span>
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
            className="p-2.5 border border-slate-700/80 rounded-xl text-sm font-semibold bg-slate-950/80 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>

          {/* Quick Search Input */}
          <input
            type="text"
            placeholder="Search candidate or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border border-slate-700/80 rounded-xl text-xs bg-slate-950/60 text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              filterMode === 'ALL'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            All Candidates ({candidates.length})
          </button>
          <button
            onClick={() => setFilterMode('TOP')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              filterMode === 'TOP'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            Score &ge; 75%
          </button>
          <button
            onClick={() => setFilterMode('CLEAN')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              filterMode === 'CLEAN'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            Clean Only
          </button>
          <button
            onClick={() => setFilterMode('FLAGGED')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
              filterMode === 'FLAGGED'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            Quarantined Attacks
          </button>
          <button
            onClick={() => selectedJob && loadCandidates(selectedJob.id)}
            title="Refresh Candidate List"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800/80 hover:bg-slate-800/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
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