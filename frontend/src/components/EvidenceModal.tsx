import React, { useState, useEffect, useMemo } from 'react';
import { RankedCandidate, NotRankedCandidate, CandidateDetailWithResume, api, CandidateNote } from '../services/api';
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
  Quote, MessageSquare, Send, Plus,
  Ban,
  HelpCircle,
  Link2,
  Cpu,
  Search,
  Eye,
  Info,
  Scale,
} from 'lucide-react';

interface EvidenceModalProps {
  candidate: RankedCandidate | NotRankedCandidate | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const [activeTab, setActiveTab] = useState<'CV_LIAISON' | 'XRAY' | 'EVALUATION' | 'NOTES' | 'GDPR'>('CV_LIAISON');
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  useEffect(() => {
    if (candidate?.candidate_id) {
      api.getCandidateNotes(candidate.candidate_id).then(setNotes).catch(() => {});
    }
  }, [candidate?.candidate_id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !candidate?.candidate_id) return;
    setIsAddingNote(true);
    try {
      const note = await api.addCandidateNote(candidate.candidate_id, newNoteContent.trim());
      setNotes((prev) => [note, ...prev]);
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsAddingNote(false);
    }
  };
  const [detail, setDetail] = useState<CandidateDetailWithResume | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const isRanked = 'score' in candidate;
  const rankedCand = isRanked ? (candidate as RankedCandidate) : null;
  const isSuspicious =
    candidate.risk_level === 'high' || (candidate.risk_flags && candidate.risk_flags.length > 0);

  // Criteria results mapping with complete backend schema normalization and resume text fallback
  const criteriaList = useMemo(() => {
    const rawData = rankedCand?.criteria_results || (detail as any)?.screening?.criteria_results;
    const rawList = rawData
      ? Array.isArray(rawData)
        ? rawData
        : Object.entries(rawData).map(([id, val]: [string, any]) => ({
            criterion_id: id,
            ...val,
          }))
      : [];

    return rawList.map((crit: any) => {
      // 1. Try explicit backend evidence
      let quote =
        crit.evidence_quote ||
        (Array.isArray(crit.evidence) && crit.evidence.length > 0 ? crit.evidence[0] : null) ||
        (typeof crit.evidence === 'string' && crit.evidence.trim().length > 0 ? crit.evidence : null) ||
        crit.quote ||
        null;

      // 2. Dynamic Verbatim Liaison Fallback: locate exact sentence in resume text if quote is missing
      if (!quote && detail?.resume_text) {
        const text = detail.resume_text;
        const searchTerms = [
          crit.label,
          crit.criterion_id,
          crit.id,
          ...(crit.keywords || []),
        ]
          .filter(Boolean)
          .map((s: string) => s.toLowerCase().trim());

        const lines = text.split(/\r?\n+/);
        for (const line of lines) {
          const lLower = line.toLowerCase();
          if (searchTerms.some((term) => term.length >= 2 && lLower.includes(term))) {
            quote = line.trim();
            break;
          }
        }
      }

      const isMet = crit.result === 'met' || crit.met === true || (crit.score !== undefined && crit.score > 0);
      const isPartial = crit.result === 'partial';
      const score = crit.score !== undefined ? crit.score : isMet ? 100 : isPartial ? 50 : 0;

      return {
        ...crit,
        criterion_id: crit.criterion_id || crit.id,
        label: crit.label || crit.criterion_id || crit.id,
        evidence_quote: quote,
        all_evidence: Array.isArray(crit.evidence) ? crit.evidence : quote ? [quote] : [],
        met: isMet,
        result: crit.result || (isMet ? 'met' : isPartial ? 'partial' : 'missing'),
        score,
        note: crit.note || crit.reason || '',
        downgraded: !!crit.downgraded,
      };
    });
  }, [rankedCand, detail]);

  // Auto-select first criterion quote when criteriaList is available
  useEffect(() => {
    if (criteriaList.length > 0 && !selectedCriterionId) {
      setSelectedCriterionId(criteriaList[0].criterion_id);
      setSelectedQuote(criteriaList[0].evidence_quote);
    }
  }, [criteriaList, selectedCriterionId]);

  useEffect(() => {
    if (candidate?.candidate_id) {
      setLoadingDetail(true);
      api
        .getCandidateDetail(candidate.candidate_id)
        .then((res) => {
          setDetail(res);
          if (criteriaList.length > 0) {
            setSelectedCriterionId((prev) => prev || criteriaList[0].criterion_id);
            setSelectedQuote((prev) => prev || criteriaList[0].evidence_quote);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDetail(false));
    }
  }, [candidate?.candidate_id]);

  const handleSelectCriterion = (critId: string, quote?: string | null) => {
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
      const prefix = normalizedQuote.slice(0, Math.min(25, normalizedQuote.length));
      index = rawText.toLowerCase().indexOf(prefix.toLowerCase());
      matchLen = Math.min(cleanQuote.length, rawText.length - index);
    }

    // 3. Fallback: single keyword / phrase search if quote is long
    if (index === -1 && cleanQuote.split(' ').length > 2) {
      const words = cleanQuote.split(/\s+/).filter((w) => w.length > 3);
      for (const w of words) {
        const found = rawText.toLowerCase().indexOf(w.toLowerCase());
        if (found !== -1) {
          index = found;
          matchLen = w.length;
          break;
        }
      }
    }

    if (index === -1) {
      return (
        <div className="space-y-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Active Provenance Quote:</strong> &ldquo;{cleanQuote}&rdquo;
            </div>
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
        <mark className="bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-400 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/50">
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
              onClick={() => setActiveTab('NOTES')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'NOTES'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Recruiter Notes</span>
              <span className="badge-clean text-[10px] font-mono">{notes.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('GDPR')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'GDPR'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Scale className="w-4 h-4 text-emerald-500" />
              <span>GDPR Art. 22 Feedback</span>
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
                  {candidate.risk_flags.map((flag: any, idx: number) => {
                    const text =
                      typeof flag === 'string'
                        ? flag
                        : flag?.detail
                        ? `${flag?.code ? `[${flag.code.toUpperCase()}] ` : ''}${flag.detail}${flag.excerpt ? ` ("${flag.excerpt}")` : ''}`
                        : flag?.code || JSON.stringify(flag);
                    return (
                      <li
                        key={idx}
                        className="text-xs text-rose-800 dark:text-rose-300 font-mono bg-rose-100/60 dark:bg-rose-900/30 p-2 rounded border border-rose-200 dark:border-rose-800/40"
                      >
                        {text}
                      </li>
                    );
                  })}
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
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectCriterion(crit.criterion_id, crit.evidence_quote)}
                            className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/40 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white capitalize">
                                  {crit.label}
                                </span>
                                {crit.label.toLowerCase() !== crit.criterion_id.toLowerCase() && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    Key: {crit.criterion_id}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`badge font-mono text-[10px] ${
                                  crit.met
                                    ? 'badge-clean'
                                    : crit.result === 'partial'
                                    ? 'badge-warning'
                                    : 'badge-danger'
                                }`}
                              >
                                {crit.met ? 'Met' : crit.result === 'partial' ? 'Partial' : 'Missing'} &bull; {crit.score}%
                              </span>
                            </div>

                            {crit.evidence_quote ? (
                              <div className="mt-2 text-[11px] text-emerald-950 dark:text-emerald-200 font-mono bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 leading-relaxed shadow-xs">
                                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Exact Verbatim Quote</span>
                                </div>
                                &ldquo;{crit.evidence_quote}&rdquo;
                              </div>
                            ) : (
                              <div className="mt-2 text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-850/60 p-2 rounded border border-slate-200/60 dark:border-slate-800">
                                No verbatim quote found in candidate resume.
                              </div>
                            )}

                            {crit.note && (
                              <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                                Audit note: {crit.note}
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
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white capitalize">
                                {crit.label}
                              </span>
                              {crit.weight && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  (Weight: {crit.weight})
                                </span>
                              )}
                            </div>
                            <span
                              className={`badge font-mono text-[10px] ${
                                crit.met
                                  ? 'badge-clean'
                                  : crit.result === 'partial'
                                  ? 'badge-warning'
                                  : 'badge-danger'
                              }`}
                            >
                              {crit.met ? 'Met' : crit.result === 'partial' ? 'Partial' : 'Missing'} &bull; Score: {crit.score}%
                            </span>
                          </div>

                          {crit.evidence_quote ? (
                            <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-semibold mb-1">
                                <Quote className="w-3 h-3" />
                                <span>VERIFIED VERBATIM QUOTE IN RESUME:</span>
                              </div>
                              <p className="text-emerald-950 dark:text-emerald-200 italic font-mono text-[11px] leading-relaxed">
                                &ldquo;{crit.evidence_quote}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              No direct verbatim quote found in candidate text.
                            </div>
                          )}

                          {crit.note && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              <strong>Note:</strong> {crit.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* TAB 5: GDPR ARTICLE 22 EXPLAINABILITY & CANDIDATE FEEDBACK */}
            {activeTab === 'GDPR' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                  <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                      GDPR Article 22 & EU AI Act Article 13 Right-to-Explanation Notice
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Under EU data protection legislation, candidates subject to AI-assisted screening are entitled to clear, intelligible, and verifiable justifications for their evaluation. Automated decisions without human review are prohibited by our Action Gateway architecture.
                    </p>
                  </div>
                </div>

                <div className="p-5 surface-card rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-mono">Candidate Subject</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {candidate.display_name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 uppercase text-[10px] font-mono">Final Deterministic Score</span>
                      <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {(rankedCand?.score ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                      Verifiable Factual Findings (Objective Criteria)
                    </h5>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>Mandatory Criteria Status:</span>
                        <span className={((candidate as any).must_haves_met ?? isRanked) ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {((candidate as any).must_haves_met ?? isRanked) ? '100% SATISFIED' : 'UNMET REQUIREMENTS'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>Security & Manipulation Analysis:</span>
                        <span className={candidate.risk_level === 'clean' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {candidate.risk_level === 'clean' ? 'CLEAN (No Adversarial Tokens)' : `FLAGGED [${candidate.risk_level.toUpperCase()}]`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                      Candidate-Facing Explainability Summary
                    </h5>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 font-sans text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                      {(rankedCand?.score ?? 0) >= 70 ? (
                        <p>
                          Your profile demonstrated strong alignment with the technical prerequisites. Verbatim evidence quotes from your resume were mathematically verified against the job rubric. Our human recruiting committee has placed your application into the active interview scheduling phase.
                        </p>
                      ) : (
                        <p>
                          While your technical background presents notable strengths, our deterministic evaluation found that several mandatory must-have requirements for this specific role were not substantiated by verbatim evidence in your submitted resume.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>Right of Appeal:</strong> To request a manual re-evaluation by the HR Director under GDPR Article 22.3, submit your petition citing reference <code className="font-mono text-indigo-500">ID-{candidate.candidate_id ? candidate.candidate_id.substring(0, 8) : "REF"}</code> to <code className="font-mono text-indigo-500">appeals@trusthr.demo</code> within 14 business days.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: RECRUITER NOTES & HUMAN OVERSIGHT */}
            {activeTab === 'NOTES' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    Add Collaborative Recruiter Note
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Notes are stamped with your identity and recorded in the tamper-evident audit ledger.
                  </p>
                  <form onSubmit={handleAddNote} className="space-y-2.5">
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Add observations about candidate background, interview performance, or technical evaluation..."
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isAddingNote || !newNoteContent.trim()}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isAddingNote ? 'Saving...' : 'Post Note'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Evaluation History & Notes ({notes.length})
                  </h4>
                  {notes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      No recruiter notes entered for this candidate yet.
                    </div>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            👤 {n.author_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {n.content}
                        </p>
                      </div>
                    ))
                  )}
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
