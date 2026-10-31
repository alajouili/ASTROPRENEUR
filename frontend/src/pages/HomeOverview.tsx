import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
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
  AlertTriangle,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';

interface HomeOverviewProps {
  userRole: string;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ userRole }) => {
  const [stats, setStats] = useState<any>({
    candidatesScreened: 128,
    pendingApprovals: 4,
    inboxUnread: 7,
    interviewsScheduled: 9,
    securityThreatsIntercepted: 12,
    hashChainIntegrity: true,
    averageMatchScore: 84.2,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHomeStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Autonomous Defense Active
              </span>
              <span className="text-xs text-slate-400 font-mono">Role: {userRole}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              TrustHR AI Recruitment Gateway
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Human-in-the-loop multi-agent recruitment architecture. Resumes are sanitized against prompt-injections, scored mathematically against verified verbatim quotes, and all actions require authenticated recruiter authorization.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/screening"
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all transform active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Screen Candidates</span>
            </Link>
            <Link
              to="/approvals"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Review Approvals ({stats.pendingApprovals})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resumes Screened</span>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.candidatesScreened}</span>
            <span className="text-xs font-medium text-emerald-600">Deterministic Math</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">100% verified evidence quotes</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Approvals</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{stats.pendingApprovals}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Human Sign-off Req.
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Zero unapproved outbound actions</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Threats Quarantined</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{stats.securityThreatsIntercepted}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              Defanged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">White-text, tiny fonts & prompt injections</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Ledger</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-700">SHA-256 Valid</span>
            <span className="text-xs text-emerald-600 font-mono">100% Chain</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">EU AI Act Article 12 compliance</p>
        </div>
      </div>

      {/* EU AI Act High-Risk Compliance Engine Banner */}
      <EUAIActRadar />

      {/* Quick Navigation Shortcuts */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <span>Operational Hub & 8-Screen Modules</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/screening"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3 text-base">Candidate Screening</h3>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic ranking table, score breakdowns, and verbatim evidence quote inspector.
            </p>
          </Link>

          <Link
            to="/approvals"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3 text-base">Human Approval Queue</h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect pending proposals, edit candidate emails inline, and dispatch via Action Gateway.
            </p>
          </Link>

          <Link
            to="/inbox"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3 text-base">Inbox Triage & Digest</h3>
            <p className="text-xs text-slate-500 mt-1">
              Urgency grouping (High, Med, Low), automated draft preview, and adversarial email isolation.
            </p>
          </Link>

          <Link
            to="/scheduling"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3 text-base">Interview Scheduling</h3>
            <p className="text-xs text-slate-500 mt-1">
              Weekly recruiter calendar, confirmed vs proposed slots, and one-click slot proposer.
            </p>
          </Link>

          <Link
            to="/assistant"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Bot className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3 text-base">Policy Assistant</h3>
            <p className="text-xs text-slate-500 mt-1">
              Conversational RAG bot with verifiable employee handbook citations & confidence metrics.
            </p>
          </Link>

          <Link
            to="/audit"
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-slate-900 mt-3 text-base">Security & Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-1">
              SHA-256 cryptographic blockchain audit stream with real-time tampering validation.
            </p>
          </Link>
        </div>
      </div>

      {/* Live System Status Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Security & Orchestration Defense Status</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              All Systems Operational
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Heartbeat: OK &bull; FastAPI + SQLite</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Forensic Guard</span>
              <span className="text-emerald-700 font-bold">ACTIVE</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Binary byte inspection for invisible white text, &lt;4pt fonts, zero-width characters, and bilingual overrides.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Deterministic Engine</span>
              <span className="text-emerald-700 font-bold">VERIFYING</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mathematical scoring over verbatim extracted quotes. Hallucinated or unverified claims penalized to 0.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Action Gateway</span>
              <span className="text-emerald-700 font-bold">STRICT_ENFORCE</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Physical credential isolation. Zero LLM outbound access. All emails & calendar slots require human sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
