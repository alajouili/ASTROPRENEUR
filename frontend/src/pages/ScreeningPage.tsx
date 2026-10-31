import React, { useState, useEffect } from 'react';
import {
  api,
  JobOffer,
  RankedCandidate,
  NotRankedCandidate,
} from '../services/api';
import { CandidateRanking } from '../components/CandidateRanking';
import { EvidenceModal } from '../components/EvidenceModal';
import { UploadResumeModal } from '../components/UploadResumeModal';
import { SecurityScanModal } from '../components/SecurityScanModal';
import {
  Briefcase,
  Search,
  RefreshCw,
  AlertCircle,
  Plus,
  Cpu,
} from 'lucide-react';

interface ScreeningPageProps {
  onDataChanged?: () => void;
}

export const ScreeningPage: React.FC<ScreeningPageProps> = ({ onDataChanged }) => {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([]);
  const [notRankedCandidates, setNotRankedCandidates] = useState<NotRankedCandidate[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CLEAN' | 'FLAGGED' | 'TOP'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | NotRankedCandidate | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Screening task progress state
  const [isScreening, setIsScreening] = useState<boolean>(false);
  const [screeningProgress, setScreeningProgress] = useState<{ done: number; total: number } | undefined>(undefined);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
        loadRanking(data[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load jobs from gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRanking = async (jobId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.getRanking(jobId);
      setRankedCandidates(response.ranked || []);
      setNotRankedCandidates(response.not_ranked || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load candidate rankings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScreening = async () => {
    if (!selectedJob) return;
    setIsScreening(true);
    setErrorMessage(null);
    try {
      const { task_id } = await api.startScreening(selectedJob.id);

      // Poll task status until done
      const pollInterval = setInterval(async () => {
        try {
          const task = await api.getTask(task_id);
          setScreeningProgress({ done: task.progress_done, total: task.progress_total });

          if (task.status === 'done') {
            clearInterval(pollInterval);
            setIsScreening(false);
            setScreeningProgress(undefined);
            loadRanking(selectedJob.id);
            if (onDataChanged) onDataChanged();
          } else if (task.status === 'failed') {
            clearInterval(pollInterval);
            setIsScreening(false);
            setScreeningProgress(undefined);
            setErrorMessage(`Screening task failed: ${task.error || 'Unknown error'}`);
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setIsScreening(false);
          setErrorMessage(pollErr.message || 'Failed while checking screening progress.');
        }
      }, 800);
    } catch (err: any) {
      setIsScreening(false);
      setErrorMessage(err.message || 'Could not initiate screening task.');
    }
  };

  const handleResumeUploaded = () => {
    if (selectedJob) {
      loadRanking(selectedJob.id);
    }
    if (onDataChanged) onDataChanged();
  };

  // Filter ranked candidates
  const filteredRanked = rankedCandidates.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.display_name.toLowerCase().includes(q);
      const matchFile = c.source_filename.toLowerCase().includes(q);
      if (!matchName && !matchFile) return false;
    }
    if (filterMode === 'CLEAN') return c.risk_level === 'clean' && (!c.risk_flags || c.risk_flags.length === 0);
    if (filterMode === 'FLAGGED') return c.risk_level !== 'clean' || (c.risk_flags && c.risk_flags.length > 0);
    if (filterMode === 'TOP') return c.score >= 75;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Position Selection & Filter Toolbar */}
      <div className="surface-card p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider font-mono">
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Requisition:</span>
          </div>
          <select
            value={selectedJob?.id || ''}
            onChange={(e) => {
              const j = jobs.find((x) => x.id === e.target.value);
              if (j) {
                setSelectedJob(j);
                loadRanking(j.id);
              }
            }}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name or file..."
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
            All Ranked ({rankedCandidates.length})
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
            Quarantined Risks
          </button>
          <button
            onClick={() => setIsScanOpen(true)}
            className="px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Forensic Scan</span>
          </button>
          <button
            onClick={() => selectedJob && loadRanking(selectedJob.id)}
            title="Refresh Ranking"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Candidate Ranking View */}
      <CandidateRanking
        job={selectedJob}
        ranked={filteredRanked}
        notRanked={notRankedCandidates}
        onSelectCandidate={(cand) => setSelectedCandidate(cand)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onStartScreening={handleStartScreening}
        isScreening={isScreening}
        screeningProgress={screeningProgress}
        isLoading={isLoading}
      />

      {/* Evidence Modal */}
      {selectedCandidate && (
        <EvidenceModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
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

      {/* Security Scan Modal */}
      {isScanOpen && (
        <SecurityScanModal
          isOpen={isScanOpen}
          onClose={() => setIsScanOpen(false)}
        />
      )}
    </div>
  );
};
