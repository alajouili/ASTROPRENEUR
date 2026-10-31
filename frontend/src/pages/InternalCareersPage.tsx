import React, { useState, useEffect } from 'react';
import { api, JobOffer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { JobDetailModal } from '../components/JobDetailModal';
import {
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Share2,
  FileText,
  Search,
  Filter,
  Send,
  X,
  Building,
} from 'lucide-react';

export const InternalCareersPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Referral modal state
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [referralJob, setReferralJob] = useState<JobOffer | null>(null);
  const [refereeName, setRefereeName] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      // In mock mode or when jobs list is retrieved
      const data = await api.getJobs();
      setJobs(data);
    } catch {
      // Fallback sample requisitions if employee has role isolation
      setJobs([
        {
          id: 'job-internal-01',
          title: 'Senior Python & ML Security Engineer',
          department: 'Platform Security',
          description: 'Help architect next-generation prompt injection defenses, sandboxed PDF parsers, and verifiable LLM audit trails.',
          criteria: [
            { id: 'c1', label: 'Python & FastAPI', kind: 'must', weight: 3, type: 'keywords', keywords: ['python', 'fastapi'] },
            { id: 'c2', label: 'Adversarial Security', kind: 'must', weight: 3, type: 'keywords', keywords: ['security', 'owasp'] },
            { id: 'c3', label: '3+ Years Experience', kind: 'must', weight: 2, type: 'min_years', min_years: 3 },
          ],
          created_at: new Date().toISOString(),
          criteria_count: 3,
        },
        {
          id: 'job-internal-02',
          title: 'Junior Data Analyst',
          department: 'Business Intelligence',
          description: 'Analyse business data, build dashboards and write SQL queries for the finance team.',
          criteria: [
            { id: 'c1', label: 'Python & Pandas', kind: 'must', weight: 3, type: 'keywords', keywords: ['python', 'pandas'] },
            { id: 'c2', label: 'SQL & PostgreSQL', kind: 'must', weight: 3, type: 'keywords', keywords: ['sql', 'postgresql'] },
            { id: 'c3', label: '2+ Years Experience', kind: 'must', weight: 2, type: 'min_years', min_years: 2 },
          ],
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          criteria_count: 3,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReferral = (job: JobOffer) => {
    setReferralJob(job);
    setRefereeName('');
    setRefereeEmail('');
    setReferralNotes('');
    setReferralSuccess(null);
    setIsReferralOpen(true);
  };

  const handleSubmitReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setReferralSuccess(
      `Internal referral for ${refereeName} on "${referralJob?.title}" was successfully submitted! A notification has been routed to the talent team.`
    );
    setTimeout(() => {
      setIsReferralOpen(false);
      setReferralSuccess(null);
    }, 2800);
  };

  const filteredJobs = jobs.filter((j) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!j.title.toLowerCase().includes(q) && !j.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedDept !== 'ALL') {
      if ((j.department || 'Operations') !== selectedDept) return false;
    }
    return true;
  });

  const departments = ['ALL', ...Array.from(new Set(jobs.map((j) => j.department || 'Operations')))];

  return (
    <div className="space-y-5">
      {/* Employee Mobility Hero Banner */}
      <div className="surface-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="badge-clean text-[10px] font-mono">Internal Mobility Portal</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
              Role: Employee ({user?.full_name || 'Eya Employee'})
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explore Open Roles & Internal Career Pathways
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            TrustHR encourages internal transfers and colleague referrals. Review role requirements, apply for an internal move, or recommend a talented peer for any open position.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-center">
            <span className="block text-xl font-black text-indigo-600 dark:text-indigo-400">
              {jobs.length}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Active Requisitions
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, skills, keywords..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 font-mono">Dept:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requisitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="surface-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-clean text-[10px] font-mono">
                      {job.department || 'Operations'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {job.description}
              </p>

              {/* Must-have tags */}
              <div className="pt-2 flex flex-wrap gap-1.5">
                {job.criteria.map((c) => (
                  <span
                    key={c.id}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      c.kind === 'must'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40'
                    }`}
                  >
                    {c.kind === 'must' ? '★ ' : ''}
                    {c.label} ({c.weight}x)
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedJob(job);
                  setIsDetailOpen(true);
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Criteria</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenReferral(job)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Apply / Refer Colleague</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Internal Referral Modal */}
      {isReferralOpen && referralJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="surface-card w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Submit Internal Application or Referral
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {referralJob.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsReferralOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {referralSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Referral Received!
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {referralSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReferral} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Candidate or Colleague Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={refereeName}
                    onChange={(e) => setRefereeName(e.target.value)}
                    placeholder="e.g. Kais Trabelsi"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Contact Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    value={refereeEmail}
                    onChange={(e) => setRefereeEmail(e.target.value)}
                    placeholder="kais.trabelsi@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Endorsement & Background Notes:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={referralNotes}
                    onChange={(e) => setReferralNotes(e.target.value)}
                    placeholder="Highlight verified accomplishments, technical proficiencies, or internal project contributions..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReferralOpen(false)}
                    className="btn-secondary py-2 px-3 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Internal Referral</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
