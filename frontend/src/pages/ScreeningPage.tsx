import React, { useState, useEffect } from 'react';
import { api, JobOffer, Candidate, CandidateDetail } from '../services/api';
import { CandidateRanking } from '../components/CandidateRanking';
import { EvidenceModal } from '../components/EvidenceModal';
import { UploadResumeModal } from '../components/UploadResumeModal';
import { Briefcase, Filter, Sparkles, ShieldAlert, CheckCircle2, RefreshCw, Search } from 'lucide-react';

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
    <div className="space-y-5">
      {/* Position Selection & Filter Toolbar */}
      <div className="surface-card p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Position:</span>
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
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            onClick={() => setFilterMode('TOP')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'TOP'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Score &ge; 75%
          </button>
          <button
            onClick={() => setFilterMode('CLEAN')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'CLEAN'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Clean Pass
          </button>
          <button
            onClick={() => setFilterMode('FLAGGED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'FLAGGED'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Quarantined
          </button>
          <button
            onClick={() => selectedJob && loadCandidates(selectedJob.id)}
            title="Refresh Candidate List"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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