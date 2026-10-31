import React from 'react';
import { Candidate } from '../services/api';
import { ShieldAlert, ShieldCheck, FileText, CheckCircle2, AlertOctagon, UserPlus, Sparkles, Award } from 'lucide-react';

interface CandidateRankingProps {
  candidates: Candidate[];
  onSelectCandidate: (candidateId: string) => void;
  onOpenUpload: () => void;
  isLoading: boolean;
  jobTitle: string;
}

export const CandidateRanking: React.FC<CandidateRankingProps> = ({
  candidates,
  onSelectCandidate,
  onOpenUpload,
  isLoading,
  jobTitle,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Ranked Candidate Shortlist</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
              Deterministic Math Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Requisition: <span className="font-semibold text-slate-200">{jobTitle}</span> &bull; Scored mathematically from verified verbatim quotes. Hallucinations zero-weighted.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_15px_-3px_rgba(14,165,233,0.4)] transition-all transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Screen New Resume</span>
        </button>
      </div>

      {/* Candidate List / Ranking Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="animate-spin w-9 h-9 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-200">Evaluating candidate evidence & verifying source quotes...</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">Running pymupdf forensics + bilingual injection scanner</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No candidates match criteria</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
              Upload candidate resumes to test prompt-injection defense, evidence quote verification, and deterministic ranking.
            </p>
            <button
              onClick={onOpenUpload}
              className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-500 transition-colors"
            >
              Upload Test Resume
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80 text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold uppercase text-xs font-mono tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Candidate Profile</th>
                  <th className="px-6 py-4">Forensic Guard</th>
                  <th className="px-6 py-4">Deterministic Score</th>
                  <th className="px-6 py-4">Action Gate</th>
                  <th className="px-6 py-4 text-right">Audit Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.map((cand, idx) => {
                  const isSuspicious = cand.security_status === 'SUSPICIOUS_FLAGGED';

                  // Metallic rank styling
                  const rankBadge =
                    idx === 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                      : idx === 1
                      ? 'bg-slate-300/20 text-slate-200 border-slate-400/40'
                      : idx === 2
                      ? 'bg-amber-800/20 text-amber-400 border-amber-700/40'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/40';

                  const scoreColor =
                    cand.overall_score >= 75
                      ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30'
                      : cand.overall_score >= 50
                      ? 'text-amber-400 bg-amber-950/50 border-amber-500/30'
                      : 'text-rose-400 bg-rose-950/50 border-rose-500/30';

                  const barFill =
                    cand.overall_score >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-400'
                      : cand.overall_score >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  return (
                    <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Rank Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-8 h-8 flex items-center justify-center rounded-xl font-bold font-mono text-xs border ${rankBadge}`}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{cand.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{cand.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>{cand.file_name}</span>
                        </div>
                      </td>

                      {/* Forensic Security Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSuspicious ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>ATTACK DEFANGED</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>CLEAN PASS</span>
                          </div>
                        )}
                      </td>

                      {/* Deterministic Score */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-xl text-sm font-bold font-mono border ${scoreColor}`}>
                            {cand.overall_score.toFixed(1)}%
                          </span>
                          <div className="w-24 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 hidden sm:block">
                            <div
                              className={`h-2 rounded-full ${barFill}`}
                              style={{ width: `${Math.min(100, Math.max(5, cand.overall_score))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Action Gate Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cand.pending_actions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cand.pending_actions.map((act) => (
                              <span
                                key={act.id}
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-lg font-mono font-medium border ${
                                  act.status === 'PENDING'
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                                    : act.status === 'APPROVED'
                                    ? 'bg-sky-950/60 text-sky-300 border-sky-500/30'
                                    : act.status === 'EXECUTED'
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {(act.type || act.action_type || '').replace('SEND_EMAIL_', '')}: {act.status}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">No Proposals</span>
                        )}
                      </td>

                      {/* Evidence & Details Action Button */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => onSelectCandidate(cand.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white bg-sky-950/50 hover:bg-sky-900/60 px-3.5 py-1.5 rounded-xl border border-sky-500/30 hover:border-sky-400 transition-all shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span>Inspect Evidence</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};