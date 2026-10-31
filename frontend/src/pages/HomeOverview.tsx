import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, HomeStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EUAIActRadar } from '../components/EUAIActRadar';
import { roleLabel } from '../lib/format';
import {
  Users,
  CheckCircle2,
  ShieldAlert,
  Gauge,
  ArrowRight,
  FileSearch,
  UserCheck,
  Lock,
  MessageSquareText,
  AlertCircle,
  RefreshCw,
  Briefcase,
} from 'lucide-react';

interface HomeOverviewProps {
  userRole: string;
}

const EMPTY: HomeStats = {
  candidatesScreened: 0,
  pendingApprovals: 0,
  inboxUnread: 0,
  interviewsScheduled: 0,
  securityThreatsIntercepted: 0,
  hashChainIntegrity: null,
  averageMatchScore: 0,
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ElementType;
  tone: string;
  loading: boolean;
  to?: string;
}> = ({ label, value, hint, icon: Icon, tone, loading, to }) => {
  const body = (
    <div className="surface-card p-5 h-full transition-colors hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
        {loading ? <span className="skeleton inline-block h-8 w-16 align-middle" /> : value}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
  return to ? <Link to={to} className="block rounded-xl">{body}</Link> : body;
};

export const HomeOverview: React.FC<HomeOverviewProps> = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HomeStats>(EMPTY);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await api.getHomeStats());
    } catch (err: any) {
      setError(err.message || 'Could not load the dashboard figures.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const firstName = user?.full_name?.split(' ')[0];

  if (user?.role === 'employee') {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="page-title">Welcome{firstName ? `, ${firstName}` : ''}</h2>
          <p className="page-subtitle">Questions about leave, remote work, benefits or your personal data? Ask the policy assistant.</p>
        </div>
        <Link to="/assistant" className="surface-card p-6 flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="section-title">Policy assistant</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Answers come only from company policy documents, with the source of each answer.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
        <Link to="/careers" className="surface-card p-6 flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="section-title">Internal job board</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">See open positions inside the company.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="page-title">Welcome back{firstName ? `, ${firstName}` : ''}</h2>
          <p className="page-subtitle">
            {roleLabel(user?.role)} · AI prepares the recruiting work, you make every decision about people.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/screening" className="btn-secondary">
            <Users className="w-4 h-4" />
            Screen CVs
          </Link>
          <Link to="/approvals" className="btn-primary">
            <CheckCircle2 className="w-4 h-4" />
            Review approvals
            {stats.pendingApprovals > 0 && (
              <span className="ml-0.5 px-1.5 rounded-full bg-white/20 text-xs tabular-nums">{stats.pendingApprovals}</span>
            )}
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={loadStats} className="btn-secondary py-1 px-2.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Key figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="CVs screened" value={stats.candidatesScreened} hint="Across all open positions" icon={Users}
          tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" loading={isLoading} to="/screening" />
        <StatCard label="Awaiting approval" value={stats.pendingApprovals} hint="Actions waiting for a person" icon={CheckCircle2}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" loading={isLoading} to="/approvals" />
        <StatCard label="Flagged CVs" value={stats.securityThreatsIntercepted} hint="Hidden text or injection attempts" icon={ShieldAlert}
          tone="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" loading={isLoading} to="/screening" />
        <StatCard label="Average match" value={stats.averageMatchScore > 0 ? `${stats.averageMatchScore}%` : '—'}
          hint="Score computed in code from verified evidence" icon={Gauge}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* How a decision is made */}
        <section className="surface-card p-6 lg:col-span-2">
          <h3 className="section-title">How a decision is made</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The agent proposes, a person decides.</p>
          <ol className="mt-5 space-y-5">
            {[
              { icon: FileSearch, title: 'The agent analyses', text: 'Each CV is cleaned, then scored against the job criteria. Every claim needs a quote found in the CV.' },
              { icon: UserCheck, title: 'A person reviews', text: 'The recruiter checks the evidence and risk flags, edits the shortlist if needed, then approves or rejects.' },
              { icon: Lock, title: 'The gateway acts', text: 'Only the Action Gateway changes records or sends email, after approval, and it logs every step.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  {i < 2 && <span className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-2" />}
                </div>
                <div className="pb-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{title}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          {user?.role === 'hr_admin' && (
            <Link to="/audit" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Open the audit trail <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </section>

        {/* Controls */}
        <section className="surface-card p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="section-title">Safeguards for high-risk AI</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Recruitment is a high-risk use under the EU AI Act. How TrustHR addresses the main requirements:
              </p>
            </div>
          </div>
          <EUAIActRadar />
        </section>
      </div>
    </div>
  );
};
