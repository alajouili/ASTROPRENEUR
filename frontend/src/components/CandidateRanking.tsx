import React from 'react';
import { Link } from 'react-router-dom';
import { RankedCandidate, NotRankedCandidate, JobOffer } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Sparkles,
  Play,
  RotateCw,
  Scale,
} from 'lucide-react';

interface CandidateRankingProps {
  job: JobOffer | null;
  ranked: RankedCandidate[];
  notRanked: NotRankedCandidate[];
  onSelectCandidate: (candidate: RankedCandidate | NotRankedCandidate) => void;
  onOpenUpload: () => void;
  onStartScreening: () => void;
  isScreening: boolean;
  screeningProgress?: { done: number; total: number };
  isLoading: boolean;
}

export const CandidateRanking: React.FC<CandidateRankingProps> = ({
  job,
  ranked,
  notRanked,
  onSelectCandidate,
  onOpenUpload,
  onStartScreening,
  isScreening,
  screeningProgress,
  isLoading,
}) => {
  const pendingScreenCount = notRanked.length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Candidate Shortlist & Score Breakdown
            </h2>
            <span className="badge-info font-mono text-[11px]">
              Deterministic Verification
            </span>
            {pendingScreenCount > 0 && (
              <span className="badge-warning font-mono text-[11px]">
                {pendingScreenCount} new CV{pendingScreenCount > 1 ? 's' : ''} awaiting screening
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Requisition: <span className="font-semibold text-slate-800 dark:text-slate-200">{job?.title || 'No Job Selected'}</span> &bull; Scored mathematically from verified verbatim quotes. Hallucinations zero-weighted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingScreenCount > 0 && (
            <button
              onClick={onStartScreening}
              disabled={isScreening}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isScreening ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Screening {screeningProgress ? `(${screeningProgress.done}/${screeningProgress.total})` : '...'}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Screen {pendingScreenCount} New CV{pendingScreenCount > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          )}

          <Link
            to="/lab"
            className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Adversarial & Bias Lab</span>
          </Link>

          <button onClick={onOpenUpload} className="btn-secondary text-xs py-2 px-3.5">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Upload CVs</span>
          </button>
        </div>
      </div>

      {/* Screening Progress Bar */}
      {isScreening && (
        <div className="surface-card p-4 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 animate-fade-in">
          <div className="flex justify-between items-center text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-2 font-mono">
            <span>Executing Deterministic Agent Pipeline...</span>
            <span>
              {screeningProgress ? `${screeningProgress.done} of ${screeningProgress.total} CVs processed` : 'Initializing...'}
            </span>
          </div>
          <div className="w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
              style={{
                width: screeningProgress && screeningProgress.total > 0
                  ? `${(screeningProgress.done / screeningProgress.total) * 100}%`
                  : '35%',
              }}
            ></div>
          </div>
          <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 mt-2 font-mono">
            Verifying raw PDF byte streams, running prompt-injection containment, and extracting verbatim evidence.
          </p>
        </div>
      )}

      {/* Candidate List / Ranking Table */}
      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Loading rankings from gateway...
            </p>
          </div>
        ) : ranked.length === 0 && notRanked.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No candidates uploaded yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Upload candidate resumes to verify prompt-injection defense, verbatim quote verification, and deterministic scoring.
            </p>
            <button onClick={onOpenUpload} className="btn-primary text-xs">
              Upload Candidate CVs
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Risk & Forensics</th>
                  <th className="px-5 py-3.5">Must-Haves</th>
                  <th className="px-5 py-3.5">Score & Engine</th>
                  <th className="px-5 py-3.5 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {ranked.map((cand) => {
                  const isSuspicious = cand.risk_level === 'high' || (cand.risk_flags && cand.risk_flags.length > 0);
                  const isMediumRisk = cand.risk_level === 'medium';

                  const rankClass =
                    cand.rank === 1
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold'
                      : cand.rank === 2
                      ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold'
                      : cand.rank === 3
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 font-bold'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400';

                  const scoreColor =
                    cand.score >= 75
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : cand.score >= 50
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-rose-700 dark:text-rose-400';

                  const barBg =
                    cand.score >= 75
                      ? 'bg-emerald-500'
                      : cand.score >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  return (
                    <tr
                      key={cand.candidate_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Rank */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`w-7 h-7 inline-flex items-center justify-center rounded-md text-xs font-mono ${rankClass}`}>
                          #{cand.rank}
                        </span>
                      </td>

                      {/* Candidate Name & File */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {cand.display_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{cand.source_filename}</span>
                        </div>
                      </td>

                      {/* Forensic Security Status Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isSuspicious ? (
                          <span className="badge-danger font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                            <span>Quarantined ({cand.risk_flags.length} flag{cand.risk_flags.length > 1 ? 's' : ''})</span>
                          </span>
                        ) : isMediumRisk ? (
                          <span className="badge-warning font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Medium Risk</span>
                          </span>
                        ) : (
                          <span className="badge-clean font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Clean Pass</span>
                          </span>
                        )}
                      </td>

                      {/* Must Haves */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-mono font-medium ${
                            cand.must_have_met >= cand.must_have_total
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {cand.must_have_met} / {cand.must_have_total} met
                        </span>
                      </td>

                      {/* Score & Engine Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold font-mono ${scoreColor}`}>
                            {cand.score.toFixed(1)}%
                          </span>
                          <span className="badge-neutral font-mono text-[9px] uppercase px-1.5 py-0.5">
                            {cand.engine || 'SIMULATED'}
                          </span>
                        </div>
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                          <div
                            className={`h-1.5 rounded-full ${barBg}`}
                            style={{ width: `${Math.min(100, Math.max(5, cand.score))}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Inspect Evidence */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => onSelectCandidate(cand)}
                          className="btn-secondary text-[11px] py-1.5 px-3"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>Inspect Evidence</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Unscreened / Pending Candidates */}
                {notRanked.map((cand) => (
                  <tr
                    key={cand.candidate_id}
                    className="bg-slate-50/50 dark:bg-slate-850/40 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-xs">
                      —
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                        {cand.display_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>{cand.source_filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="badge-neutral font-mono text-[10px]">
                        Pending Screening
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-xs">
                      —
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-xs">
                      Unscored
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <span className="text-[11px] text-slate-400 font-mono">Not screened yet</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
