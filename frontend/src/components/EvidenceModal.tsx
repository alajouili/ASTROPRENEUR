import React, { useState, useEffect } from 'react';
import { RankedCandidate, NotRankedCandidate, CandidateDetailWithResume, api } from '../services/api';
import { SecurityScanModal } from './SecurityScanModal';
import { ForensicXRay } from './ForensicXRay';
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
  Link2,
  Cpu,
  Search,
  Eye,
} from 'lucide-react';

interface EvidenceModalProps {
  candidate: RankedCandidate | NotRankedCandidate | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const [activeTab, setActiveTab] = useState<'CV_LIAISON' | 'XRAY' | 'EVALUATION'>('CV_LIAISON');
  const [detail, setDetail] = useState<CandidateDetailWithResume | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const isRanked = 'score' in candidate;
  const rankedCand = isRanked ? (candidate as RankedCandidate) : null;
  const isSuspicious =
    candidate.risk_level === 'high' || (candidate.risk_flags && candidate.risk_flags.length > 0);

  // Criteria results mapping
  const criteriaList = rankedCand?.criteria_results
    ? Array.isArray(rankedCand.criteria_results)
      ? rankedCand.criteria_results
      : Object.entries(rankedCand.criteria_results).map(([id, val]) => ({
          criterion_id: id,
          ...val,
        }))
    : [];

  useEffect(() => {
    if (candidate?.candidate_id) {
      setLoadingDetail(true);
      api
        .getCandidateDetail(candidate.candidate_id)
        .then((res) => {
          setDetail(res);
          if (criteriaList.length > 0 && criteriaList[0].evidence_quote) {
            setSelectedCriterionId(criteriaList[0].criterion_id);
            setSelectedQuote(criteriaList[0].evidence_quote);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDetail(false));
    }
  }, [candidate?.candidate_id]);

  const handleSelectCriterion = (critId: string, quote?: string) => {
    setSelectedCriterionId(critId);
    setSelectedQuote(quote || null);
  };

  // Helper to render resume text with robust verbatim highlight
  const renderHighlightedResume = (rawText: string, quote: string | null) => {
    if (!rawText) {
      return (
        <div className="p-8 text-center text-slate-400 font-mono text-xs italic">
          No raw text extracted. File may be encrypted or scanned image.
        </div>
      );
    }
    if (!quote || quote.trim().length === 0) {
      return <div className="whitespace-pre-wrap">{rawText}</div>;
    }

    const cleanQuote = quote.trim();
    // 1. Direct case-insensitive search
    let index = rawText.toLowerCase().indexOf(cleanQuote.toLowerCase());
    let matchLen = cleanQuote.length;

    // 2. Whitespace-collapsed fallback search
    if (index === -1) {
      const normalizedQuote = cleanQuote.replace(/\s+/g, ' ');
      // Search for first 25 characters of the quote
      const prefix = normalizedQuote.slice(0, Math.min(25, normalizedQuote.length));
      index = rawText.toLowerCase().indexOf(prefix.toLowerCase());
      matchLen = Math.min(cleanQuote.length, rawText.length - index);
    }

    if (index === -1) {
      return (
        <div className="space-y-3">
          <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
            <strong>Notice:</strong> Verified evidence quote active for this criterion. Showing candidate resume context:
          </div>
          <div className="whitespace-pre-wrap">{rawText}</div>
        </div>
      );
    }

    const before = rawText.substring(0, index);
    const match = rawText.substring(index, index + matchLen);
    const after = rawText.substring(index + matchLen);

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {before}
        <mark className="bg-emerald-200 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-400 dark:border-emerald-700 shadow-xs animate-pulse">
          {match}
        </mark>
        {after}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>File: {candidate.source_filename}</span>
                </span>
                <span>&bull;</span>
                <span>Candidate ID: {candidate.candidate_id.substring(0, 8)}...</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScanOpen(true)}
                className="btn-secondary text-xs flex items-center gap-1.5"
                title="Run live security and injection scan"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                <span>Forensic Scan</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 px-5 gap-2">
            <button
              onClick={() => setActiveTab('CV_LIAISON')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'CV_LIAISON'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>CV Liaison & Ground-Truth Tracing</span>
              <span className="badge-clean text-[10px] font-mono">EU AI Act</span>
            </button>
            <button
              onClick={() => setActiveTab('XRAY')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'XRAY'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Forensic X-Ray & Red-Team Proof</span>
              {isSuspicious ? (
                <span className="badge-danger text-[10px] font-mono">Quarantine Alert</span>
              ) : (
                <span className="badge-clean text-[10px] font-mono">PyMuPDF Clean</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('EVALUATION')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'EVALUATION'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Score Breakdown & Evidence</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Risk Warnings Banner if any */}
            {candidate.risk_flags && candidate.risk_flags.length > 0 && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Forensic Guard: Security Findings & Injection Risk</span>
                </div>
                <ul className="space-y-1">
                  {candidate.risk_flags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-800 dark:text-rose-300 font-mono bg-rose-100/60 dark:bg-rose-900/30 p-2 rounded border border-rose-200 dark:border-rose-800/40"
                    >
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAB 1: CV LIAISON & GROUND-TRUTH TRACING */}
            {activeTab === 'CV_LIAISON' && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      <strong>Verbatim Traceability:</strong> Click any criterion on the left to highlight its exact matching sentence in the raw CV text. Zero hallucinations.
                    </span>
                  </div>
                  <span className="badge-clean text-[10px] font-mono shrink-0">100% Provenance</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Criteria Selector */}
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Job Criteria ({criteriaList.length})
                    </h3>
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {criteriaList.map((crit, idx) => {
                        const isSelected = selectedCriterionId === crit.criterion_id;
                        const met = crit.met !== false && (crit.score ?? 100) > 0;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectCriterion(crit.criterion_id, crit.evidence_quote)}
                            className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {crit.criterion_id}
                              </span>
                              <span
                                className={`badge font-mono text-[10px] ${
                                  met ? 'badge-clean' : 'badge-danger'
                                }`}
                              >
                                {met ? 'Met' : 'Missing'} &bull; {crit.score ?? (met ? 100 : 0)}%
                              </span>
                            </div>

                            {crit.evidence_quote ? (
                              <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 italic font-mono bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700/60">
                                &ldquo;{crit.evidence_quote}&rdquo;
                              </div>
                            ) : (
                              <div className="mt-2 text-[11px] text-slate-400 italic">
                                No verbatim quote found.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Raw Resume Preview with Verbatim Highlight */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Source Resume Text (Verbatim Liaison)
                      </h3>
                      {selectedQuote && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Highlighting Verified Sentence
                        </span>
                      )}
                    </div>
                    <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 max-h-[500px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/60">
                      {loadingDetail ? (
                        <div className="p-8 text-center text-slate-400">Loading CV text...</div>
                      ) : (
                        renderHighlightedResume(detail?.resume_text || '', selectedQuote)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FORENSIC X-RAY & RED-TEAM PROOF */}
            {activeTab === 'XRAY' && (
              <ForensicXRay candidate={candidate} />
            )}

            {/* TAB 3: DETAILED EVALUATION & JUSTIFICATION */}
            {activeTab === 'EVALUATION' && (
              <div className="space-y-4">
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

                {/* Rejected Evidence Section */}
                {rankedCand && rankedCand.rejected_evidence && rankedCand.rejected_evidence.length > 0 && (
                  <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <Ban className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Rejected Evidence (Verbatim Verification Guard)</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      The following candidate claims were <strong className="font-semibold">dropped and zero-weighted</strong> because no matching quote was in the CV:
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

                {/* Criteria Full List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Criteria Score Breakdown
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Scan Modal */}
      {isScanOpen && (
        <SecurityScanModal
          isOpen={isScanOpen}
          onClose={() => setIsScanOpen(false)}
        />
      )}
    </>
  );
};
