import React from 'react';
import { Candidate } from '../services/api';
import { ShieldAlert, ShieldCheck, FileText, CheckCircle2, AlertOctagon, UserPlus, Sparkles, ChevronRight } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Candidate Shortlist & Score Breakdown
            </h2>
            <span className="badge-info font-mono">
              Deterministic Math Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Requisition: <span className="font-semibold text-slate-800 dark:text-slate-200">{jobTitle}</span> &bull; Scored mathematically from verified verbatim quotes. Hallucinations zero-weighted.
          </p>
        </div>

        <button onClick={onOpenUpload} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          <span>Screen New Resume</span>
        </button>
      </div>

      {/* Candidate List / Ranking Table */}
      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Evaluating candidate evidence & verifying source quotes...
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Running pymupdf byte forensics + prompt guard</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No candidates match current criteria</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Upload candidate resumes to test prompt-injection defense, evidence quote verification, and deterministic ranking.
            </p>
            <button onClick={onOpenUpload} className="btn-secondary">
              Upload Test Resume
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Candidate Profile</th>
                  <th className="px-5 py-3.5">Forensic Guard</th>
                  <th className="px-5 py-3.5">Match Score</th>
                  <th className="px-5 py-3.5">Action Gate</th>
                  <th className="px-5 py-3.5 text-right">Audit Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {candidates.map((cand, idx) => {
                  const isSuspicious = cand.security_status === 'SUSPICIOUS_FLAGGED';

                  const rankClass =
                    idx === 0
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold'
                      : idx === 1
                      ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold'
                      : idx === 2
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 font-bold'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400';

                  const scoreColor =
                    cand.overall_score >= 75
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : cand.overall_score >= 50
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-rose-700 dark:text-rose-400';

                  const barBg =
                    cand.overall_score >= 75
                      ? 'bg-emerald-500'
                      : cand.overall_score >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Rank Column */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-mono ${rankClass}`}>
                          #{idx + 1}
                        </span>
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {cand.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cand.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{cand.file_name}</span>
                        </div>
                      </td>

                      {/* Forensic Security Status Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isSuspicious ? (
                          <span className="badge-danger font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                            <span>Quarantined Attack</span>
                          </span>
                        ) : (
                          <span className="badge-clean font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Clean Pass</span>
                          </span>
                        )}
                      </td>

                      {/* Deterministic Score */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-sm font-bold font-mono ${scoreColor}`}>
                            {cand.overall_score.toFixed(1)}%
                          </span>
                          <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div
                              className={`h-1.5 rounded-full ${barBg}`}
                              style={{ width: `${Math.min(100, Math.max(5, cand.overall_score))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Action Gate Column */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {cand.pending_actions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cand.pending_actions.map((act) => (
                              <span
                                key={act.id}
                                className={
                                  act.status === 'PENDING'
                                    ? 'badge-warning font-mono'
                                    : act.status === 'APPROVED'
                                    ? 'badge-info font-mono'
                                    : 'badge-clean font-mono'
                                }
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {(act.type || act.action_type || '').replace('SEND_EMAIL_', '')}: {act.status}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">No proposals</span>
                        )}
                      </td>

                      {/* Evidence & Details Action Button */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => onSelectCandidate(cand.id)}
                          className="btn-secondary text-[11px] py-1.5 px-3"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
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