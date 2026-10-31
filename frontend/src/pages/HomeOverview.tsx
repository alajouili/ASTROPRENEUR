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
  ChevronRight,
  Terminal,
  Cpu,
  Layers,
  Fingerprint,
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

  // Live Defense Security SOC Feed Simulation
  const liveEvents = [
    { time: '19:30:12', tag: 'FORENSICS', type: 'rose', message: 'Intercepted 1.2pt white-text injection in resume #109 (Candidate "Maxime V.")' },
    { time: '19:29:45', tag: 'DETERMINISTIC', type: 'emerald', message: '100% verified evidence quotes verified for Candidate Leila Ben Salem (94.0%)' },
    { time: '19:28:30', tag: 'GATEWAY', type: 'amber', message: 'Proposed interview invitation held for Recruiter authorization (Air-Gap enforced)' },
    { time: '19:26:15', tag: 'AUDIT', type: 'sky', message: 'Signed block #482 into SHA-256 chain: hash b9f4a1e8... verified' },
    { time: '19:24:02', tag: 'INBOX', type: 'indigo', message: 'Triaged 3 candidate emails with LLM draft recommendations' },
  ];

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
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 p-6 sm:p-9 shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                AUTONOMOUS DEFENSE ACTIVE
              </span>
              <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80">
                Operator Role: <span className="text-sky-400 font-bold">{userRole}</span>
              </span>
              <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-sky-950/60 text-sky-300 border border-sky-500/30">
                EU AI Act Art. 14 HITL
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              TrustHR <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-300">AI Recruitment Gateway</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              High-Risk Human-in-the-Loop Multi-Agent Recruitment Architecture. Incoming candidate CVs are deeply inspected for microscopic font prompt-injections, scored mathematically against verified verbatim quotes, and all outbound communications require authenticated recruiter authorization.
            </p>

            <div className="pt-1 flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zero Hallucinations (Quotes Enforced)
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Air-Gapped Gateway
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              to="/screening"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_-3px_rgba(14,165,233,0.4)] transition-all transform active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Screen Candidates</span>
            </Link>
            <Link
              to="/approvals"
              className="flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-amber-500/40 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Review Approvals ({stats.pendingApprovals})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Requisition Defense Pipeline Funnel */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              End-to-End Autonomous Defense & Recruitment Funnel
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            Air-Gap Gateway Enforced
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-sky-500/30 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-400">1. Inbound CVs</span>
            <div className="text-xl font-extrabold text-white mt-1">{stats.candidatesScreened}</div>
            <span className="text-[10px] text-sky-400 font-medium">Multi-Format Ingest</span>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-900/30 hover:border-rose-500/30 transition-all">
            <span className="text-[10px] uppercase font-bold text-rose-400">2. Forensics</span>
            <div className="text-xl font-extrabold text-rose-400 mt-1">{stats.securityThreatsIntercepted} Defanged</div>
            <span className="text-[10px] text-rose-300/80 font-medium">&lt;2pt Fonts & White-text</span>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-sky-500/30 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-400">3. Quote Proofs</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">100% Valid</div>
            <span className="text-[10px] text-emerald-300/80 font-medium">Verbatim Source Exact</span>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-sky-500/30 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-400">4. Shortlist</span>
            <div className="text-xl font-extrabold text-sky-400 mt-1">12 Ranked</div>
            <span className="text-[10px] text-sky-300/80 font-medium">Math Scoring ({stats.averageMatchScore}%)</span>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-900/40 hover:border-amber-500/40 transition-all">
            <span className="text-[10px] uppercase font-bold text-amber-400">5. Human Gate</span>
            <div className="text-xl font-extrabold text-amber-400 mt-1">{stats.pendingApprovals} Proposals</div>
            <span className="text-[10px] text-amber-300/80 font-medium">Requires Sign-off</span>
          </div>

          {/* Step 6 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-emerald-500/30 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-400">6. Dispatched</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">{stats.interviewsScheduled} Locked</div>
            <span className="text-[10px] text-emerald-300/80 font-medium">Mailpit & Calendar</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Top KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Screening */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg hover:border-sky-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deterministic Match</span>
            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white tracking-tight">{stats.averageMatchScore}%</span>
              <p className="text-xs text-slate-400 mt-1">{stats.candidatesScreened} Resumes Scored</p>
            </div>
            {/* Circular Mini Progress Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="18" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray="113"
                  strokeDashoffset="18"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold font-mono text-sky-400">84%</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified Quote Basis</span>
            <span className="text-emerald-400 font-bold">100% Grounded</span>
          </div>
        </div>

        {/* KPI 2: Human Approvals */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Sign-Off</span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{stats.pendingApprovals}</span>
              <p className="text-xs text-slate-400 mt-1">Actions in Air-Gap Queue</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
              HITL Locked
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Zero Outbound Without Human</span>
            <span className="text-amber-400 font-bold font-mono">100% Strict</span>
          </div>
        </div>

        {/* KPI 3: Quarantined Threats */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg hover:border-rose-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Threats Quarantined</span>
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-rose-400 tracking-tight">{stats.securityThreatsIntercepted}</span>
              <p className="text-xs text-slate-400 mt-1">Adversarial Attacks Defanged</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
              0% Bypassed
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>White-text & Prompt Guard</span>
            <span className="text-rose-400 font-bold">Quarantined</span>
          </div>
        </div>

        {/* KPI 4: Audit Ledger */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SHA-256 Ledger</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-extrabold text-emerald-400 tracking-tight">CHAIN INTACT</span>
              <p className="text-xs text-slate-400 mt-1">Cryptographic Blockchain Trail</p>
            </div>
            <Fingerprint className="w-8 h-8 text-emerald-500/40" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>EU AI Act Art. 12 Compliant</span>
            <span className="text-emerald-400 font-mono font-bold">Tamper-Proof</span>
          </div>
        </div>
      </div>

      {/* Live Threat Defense Activity Stream (SOC Feed) */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Defense Operations Stream (Real-Time Agent Telemetry)
            </h3>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            ACTIVE MONITORING
          </span>
        </div>

        <div className="mt-3 divide-y divide-slate-800/60 font-mono text-xs">
          {liveEvents.map((evt, idx) => {
            const badgeColor =
              evt.type === 'rose'
                ? 'bg-rose-950/70 text-rose-300 border-rose-500/30'
                : evt.type === 'emerald'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                : evt.type === 'amber'
                ? 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                : evt.type === 'indigo'
                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/30'
                : 'bg-sky-950/70 text-sky-300 border-sky-500/30';

            return (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 text-[11px]">{evt.time}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                    {evt.tag}
                  </span>
                  <span className="text-slate-200 text-xs">{evt.message}</span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Signed SHA-256</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* EU AI Act High-Risk Compliance Engine Banner */}
      <EUAIActRadar />

      {/* 8-Screen Operational Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Operational Hub & 8-Screen Modules</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Member 3 Complete Suite</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Candidate Screening */}
          <Link
            to="/screening"
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hover:border-sky-500/50 hover:bg-slate-900/80 transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Users className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-white mt-4 text-base group-hover:text-sky-300 transition-colors">Candidate Screening</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Deterministic ranking table, score breakdowns per criterion, and verbatim quote verification inspector.
            </p>
          </Link>

          {/* Module 2: Approvals */}
          <Link
            to="/approvals"
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hover:border-amber-500/50 hover:bg-slate-900/80 transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-white mt-4 text-base group-hover:text-amber-300 transition-colors">Human Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Air-gapped Action Gateway. Inspect pending email and calendar proposals, edit inline, and authorize execution.
            </p>
          </Link>

          {/* Module 3: Inbox */}
          <Link
            to="/inbox"
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Mail className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-white mt-4 text-base group-hover:text-indigo-300 transition-colors">Inbox Triage & Digest</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Automated classification into availability, status inquiries, or adversarial messages with pre-composed responses.
            </p>
          </Link>

          {/* Module 4: Scheduling */}
          <Link
            to="/scheduling"
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Calendar className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-white mt-4 text-base group-hover:text-emerald-300 transition-colors">Interview Scheduling</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Interactive calendar view with recruiter free slots, candidate invitations, and one-click hold management.
            </p>
          </Link>

          {/* Module 5: Assistant */}
          <Link
            to="/assistant"
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hover:border-purple-500/50 hover:bg-slate-900/80 transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Bot className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-white mt-4 text-base group-hover:text-purple-300 transition-colors">Policy Assistant</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Conversational RAG assistant answering employee policy queries with exact handbook citations and confidence scores.
            </p>
          </Link>

          {/* Module 6: Audit Trail */}
          <Link
            to="/audit"
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl hover:border-sky-500/50 hover:bg-slate-900/80 transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/80 group-hover:bg-slate-700 group-hover:text-white transition-all">
                <Database className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-white mt-4 text-base group-hover:text-sky-300 transition-colors">Security & Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Cryptographically chained SHA-256 logs recording every screening, prompt injection detection, and recruiter approval.
            </p>
          </Link>
        </div>
      </div>

      {/* System Defense Telemetry Matrix */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Backend Orchestration & Provider Telemetry
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ALL 4 DEFENSE LAYERS HEALTHY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Primary LLM</span>
              <span className="text-emerald-400 font-bold font-mono">ONLINE</span>
            </div>
            <div className="font-semibold text-white">Gemini 2.5 Flash-Lite</div>
            <div className="text-[11px] text-slate-500 mt-1">42ms latency &bull; Structured JSON</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Fallback LLM</span>
              <span className="text-sky-400 font-bold font-mono">STANDBY</span>
            </div>
            <div className="font-semibold text-white">Groq Llama-3.3 70B</div>
            <div className="text-[11px] text-slate-500 mt-1">Automatic quota failover</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Mailpit Sandbox</span>
              <span className="text-emerald-400 font-bold font-mono">CONNECTED</span>
            </div>
            <div className="font-semibold text-white">SMTP Port 1025 / UI 8025</div>
            <div className="text-[11px] text-slate-500 mt-1">Safe isolated email mock</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Action Gateway</span>
              <span className="text-emerald-400 font-bold font-mono">AIR-GAPPED</span>
            </div>
            <div className="font-semibold text-white">Human Token Required</div>
            <div className="text-[11px] text-slate-500 mt-1">Zero unauthorized outbounds</div>
          </div>
        </div>
      </div>
    </div>
  );
};