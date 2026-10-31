import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, HomeStats } from '../services/api';
import { EUAIActRadar } from '../components/EUAIActRadar';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  Mail,
  Calendar,
  Lock,
  ArrowRight,
  Bot,
  Activity,
  Layers,
  Fingerprint,
  Cpu,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface HomeOverviewProps {
  userRole: string;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ userRole }) => {
  const [stats, setStats] = useState<HomeStats>({
    candidatesScreened: 0,
    pendingApprovals: 0,
    inboxUnread: 0,
    interviewsScheduled: 0,
    securityThreatsIntercepted: 0,
    hashChainIntegrity: true,
    averageMatchScore: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHomeStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to aggregate statistics from gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMock = api.isMockMode();

  return (
    <div className="space-y-6">
      {/* Enterprise Executive Banner */}
      <div className="surface-card p-6 sm:p-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-clean">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {isMock ? 'Demo Simulation Dataset' : 'Gateway Defense Active'}
              </span>
              <span className="badge-neutral font-mono text-xs">
                Role: <strong className="text-slate-900 dark:text-white ml-1">{userRole}</strong>
              </span>
              <span className="badge-info font-mono text-xs">
                EU AI Act Annex III.4
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              TrustHR AI Recruitment Gateway
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              High-Risk Human-in-the-Loop multi-agent recruitment infrastructure. Resumes are sanitized against microscopic prompt-injections, scored mathematically against verified verbatim quotes, and state changes require explicit recruiter authorization.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zero Hallucinations (Quotes Verified)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <Lock className="w-3.5 h-3.5" />
                Action Gateway Air-Gap
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
            <Link
              to="/screening"
              className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
            >
              <Users className="w-4 h-4" />
              <span>Resume Screening Console</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/approvals"
              className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 px-4"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Approval Queue ({stats.pendingApprovals})</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Primary KPI Grid (Derived dynamically from backend) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Candidates Screened */}
        <div className="surface-card p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Screened</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : stats.candidatesScreened}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Parsed & scored CVs
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="surface-card p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Pending Gate</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {isLoading ? '...' : stats.pendingApprovals}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Awaiting human authorization
            </p>
          </div>
        </div>

        {/* Quarantined Threats */}
        <div className="surface-card p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Quarantined</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {isLoading ? '...' : stats.securityThreatsIntercepted}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Injections & active threats
            </p>
          </div>
        </div>

        {/* Average Match Score */}
        <div className="surface-card p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Avg Match</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isLoading ? '...' : stats.averageMatchScore > 0 ? `${stats.averageMatchScore}%` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Deterministic verified average
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Compliance Radar & Golden Rule Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EU AI Act Radar Component */}
        <div className="surface-card p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>EU AI Act Compliance & Audit Assurance</span>
            </h3>
            <span className="badge-clean text-[10px] font-mono">
              Article 14 Active
            </span>
          </div>
          <div className="pt-4">
            <EUAIActRadar />
          </div>
        </div>

        {/* Golden Rule Architecture Walkthrough */}
        <div className="surface-card p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Action Gateway Security Model</span>
              </h3>
              <span className="badge-neutral text-[10px] font-mono">
                No LLM Side-Effects
              </span>
            </div>

            <div className="pt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Autonomous Intelligence Proposes
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    FastAPI + LangGraph screening agents extract quotes and propose shortlists. Agents have <strong>zero write access</strong> to databases, SMTP, or calendar backends.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Human Authorization & Review
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Recruiters inspect evidence quotes, review quarantined risk flags, edit shortlisted candidate IDs, and record review notes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                    Action Gateway Executes & Signs
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Only <code className="font-mono text-indigo-600 dark:text-indigo-400">executor.py</code> changes database state, locks shortlists, and appends a SHA-256 block into the append-only ledger.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-mono text-[11px]">Audit Hash Chaining</span>
            {userRole.includes('admin') ? (
              <Link
                to="/audit"
                className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Inspect Cryptographic Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : userRole.includes('employee') ? (
              <Link
                to="/careers"
                className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Browse Internal Job Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/screening"
                className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Go to ATS Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
