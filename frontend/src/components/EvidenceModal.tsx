import React from 'react';
import { RankedCandidate, NotRankedCandidate } from '../services/api';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Sparkles,
  Quote,
  Ban,
  HelpCircle,
} from 'lucide-react';

interface EvidenceModalProps {
  candidate: RankedCandidate | NotRankedCandidate | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const isRanked = 'score' in candidate;
  const rankedCand = isRanked ? (candidate as RankedCandidate) : null;
  const isSuspicious = candidate.risk_level === 'high' || (candidate.risk_flags && candidate.risk_flags.length > 0);

  // Criteria results mapping
  const criteriaList = rankedCand?.criteria_results
    ? Array.isArray(rankedCand.criteria_results)
      ? rankedCand.criteria_results
      : Object.entries(rankedCand.criteria_results).map(([id, val]) => ({
          criterion_id: id,
          ...val,
        }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/70 dark:bg-slate-850">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {candidate.display_name}
              </h2>
              {isRanked && (
                <>
                  <span className="badge-info font-mono">
                    Score: {rankedCand?.score.toFixed(1)}%
                  </span>
                  <span className="badge-neutral font-mono text-[10px] uppercase">
                    Engine: {rankedCand?.engine || 'SIMULATED'}
                  </span>
                </>
              )}
              {isSuspicious ? (
                <span className="badge-danger font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Quarantined Risk</span>
                </span>
              ) : (
                <span className="badge-clean font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Clean Pass</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Source File: {candidate.source_filename}</span>
              <span>&bull;</span>
              <span>Candidate ID: {candidate.candidate_id.substring(0, 8)}...</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Security Findings & Risk Flags */}
          {candidate.risk_flags && candidate.risk_flags.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Forensic Guard: Security Findings & Injection Risk</span>
              </div>
              <ul className="space-y-1.5">
                {candidate.risk_flags.map((flag, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-rose-800 dark:text-rose-300 font-mono bg-rose-100/60 dark:bg-rose-900/30 p-2 rounded border border-rose-200 dark:border-rose-800/40"
                  >
                    {flag}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-700/90 dark:text-rose-400">
                Adversarial instructions were quarantined by the Security Guard and excluded from influencing scoring.
              </p>
            </div>
          )}

          {/* Justification Summary */}
          {rankedCand && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Deterministic Justification</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {rankedCand.justification || 'Candidate evaluated mathematically against position criteria.'}
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Must-Have Criteria: <strong className="text-slate-800 dark:text-slate-200">{rankedCand.must_have_met} of {rankedCand.must_have_total} satisfied</strong>
              </div>
            </div>
          )}

          {/* Rejected Evidence Section (EU AI Act Proof) */}
          {rankedCand && rankedCand.rejected_evidence && rankedCand.rejected_evidence.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Ban className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Rejected Evidence (Verbatim Verification Guard)</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                The following candidate claims were <strong className="font-semibold">dropped and zero-weighted</strong> because no matching verbatim quote could be found in the raw resume:
              </p>
              <ul className="space-y-1.5">
                {rankedCand.rejected_evidence.map((claim, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-amber-800 dark:text-amber-300/90 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-amber-200 dark:border-amber-800"
                  >
                    &ldquo;{claim}&rdquo; &rarr; <span className="text-rose-600 dark:text-rose-400 font-semibold">[Quote Not Found]</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Criteria & Verbatim Evidence Quotes */}
          {criteriaList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Job Criteria & Verbatim Verified Quotes
              </h3>
              <div className="space-y-3">
                {criteriaList.map((crit, idx) => {
                  const met = crit.met !== false && (crit.score ?? 100) > 0;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {crit.criterion_id || `Criterion #${idx + 1}`}
                          </span>
                          {crit.weight && (
                            <span className="text-[10px] font-mono text-slate-400">
                              (Weight: {crit.weight})
                            </span>
                          )}
                        </div>
                        <span
                          className={`badge font-mono text-[10px] ${
                            met ? 'badge-clean' : 'badge-danger'
                          }`}
                        >
                          {met ? 'Met' : 'Missing'} &bull; Score: {crit.score ?? (met ? 100 : 0)}
                        </span>
                      </div>

                      {/* Evidence Quote */}
                      {crit.evidence_quote ? (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-semibold mb-1">
                            <Quote className="w-3 h-3" />
                            <span>VERIFIED VERBATIM QUOTE IN RESUME:</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 italic font-mono text-[11px]">
                            &ldquo;{crit.evidence_quote}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          No direct verbatim quote found in candidate text.
                        </div>
                      )}

                      {/* Reason */}
                      {crit.reason && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>Note:</strong> {crit.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isRanked && (
            <div className="p-8 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs">
                This CV has been uploaded but not yet screened. Click "Screen New CVs" on the screening page to run the agent.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
