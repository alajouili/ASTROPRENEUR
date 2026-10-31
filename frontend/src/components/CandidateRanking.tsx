import React from 'react';
import { Candidate } from '../services/api';
import { ShieldAlert, ShieldCheck, FileText, CheckCircle2, AlertOctagon, UserPlus, Sparkles } from 'lucide-react';

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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Ranked Candidate Shortlist</h1>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Deterministic Math Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Role: <span className="font-semibold text-slate-800">{jobTitle}</span> &bull; Ranking is strictly computed from verified job-related quotes.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Screen New Candidate</span>
        </button>
      </div>

      {/* Candidate List / Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-medium">Evaluating candidate evidence & verifying source quotes...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No candidates screened yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Upload sample candidate resumes to test prompt-injection defense, evidence quote verification, and deterministic ranking.
            </p>
            <button
              onClick={onOpenUpload}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700"
            >
              Upload Test Resume
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Security Status</th>
                  <th className="px-6 py-3.5">Deterministic Score</th>
                  <th className="px-6 py-3.5">Human Action Gate</th>
                  <th className="px-6 py-3.5 text-right">Evidence & Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {candidates.map((cand, idx) => {
                  const isSuspicious = cand.security_status === 'SUSPICIOUS_FLAGGED';
                  const scoreColor =
                    cand.overall_score >= 70
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : cand.overall_score >= 50
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Rank Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{cand.name}</div>
                        <div className="text-xs text-slate-500">{cand.email}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Source: {cand.file_name}</div>
                      </td>

                      {/* Security Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSuspicious ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>Prompt Injection Flagged</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Security Clean</span>
                          </div>
                        )}
                      </td>

                      {/* Deterministic Score */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${scoreColor}`}>
                            {cand.overall_score.toFixed(1)}%
                          </span>
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                            <div
                              className={`h-2 rounded-full ${
                                cand.overall_score >= 70 ? 'bg-emerald-500' : cand.overall_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, cand.overall_score))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Human Action Gate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cand.pending_actions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cand.pending_actions.map((act) => (
                              <span
                                key={act.id}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                                  act.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : act.status === 'APPROVED'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : act.status === 'EXECUTED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {(act.type || act.action_type || '').replace('SEND_EMAIL_', '')}: {act.status}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No proposals</span>
                        )}
                      </td>

                      {/* Evidence & Details Action Button */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => onSelectCandidate(cand.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
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
