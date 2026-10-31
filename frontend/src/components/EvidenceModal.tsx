import React, { useState } from 'react';
import { CandidateDetail } from '../services/api';
import { ForensicXRay } from './ForensicXRay';
import { X, CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert, FileText, Hash, Sparkles, Cpu } from 'lucide-react';

interface EvidenceModalProps {
  candidate: CandidateDetail | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ candidate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'xray'>('evidence');
  if (!candidate) return null;

  const isSuspicious = candidate.security_status === 'SUSPICIOUS_FLAGGED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/70 dark:bg-slate-850">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{candidate.name}</h2>
              <span className="badge-info font-mono">
                Match: {candidate.overall_score.toFixed(1)}%
              </span>
              {isSuspicious ? (
                <span className="badge-danger font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  Prompt Injection Flagged
                </span>
              ) : (
                <span className="badge-clean font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Clean Pass
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {candidate.email} &bull; {candidate.phone || 'No phone'} &bull; Source: {candidate.file_name}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-0.5">
              <Hash className="w-3 h-3 text-slate-400" />
              <span>SHA-256: {candidate.file_hash.substring(0, 24)}...</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Evidence Quotes vs Forensic Document X-Ray */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-850/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Job Criteria & Verbatim Evidence Quotes</span>
          </button>
          <button
            onClick={() => setActiveTab('xray')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all relative ${
              activeTab === 'xray'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Forensic Document X-Ray</span>
            {isSuspicious && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'xray' ? (
            <ForensicXRay candidate={candidate} />
          ) : (
            <>
              {/* Security Guard Alerts Banner if Flagged */}
              {isSuspicious && candidate.security_findings.length > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Security Guard: Intercepted Prompt Injections & Anomalies</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    The Security Guard scanner detected adversarial instructions in this candidate's uploaded resume.
                    These instructions were quarantined and prevented from influencing the AI evaluation or scoring engine.
                  </p>
                  <div className="space-y-1.5">
                    {candidate.security_findings.map((finding, fIdx) => (
                      <div key={fIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 text-xs">
                        <div className="flex justify-between font-semibold text-rose-900 dark:text-rose-300">
                          <span>{finding.description}</span>
                          <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-mono text-[10px]">
                            Severity: {finding.severity}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                          Intercepted Snippet: "{finding.snippet}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Summary */}
              {candidate.evaluation_summary && (
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1 font-mono">
                    Deterministic Recruitment Synthesis
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{candidate.evaluation_summary}</p>
                </div>
              )}

              {/* Evidence Criteria Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                    Job-Related Criteria & Verbatim Evidence Quotes
                  </h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    Deterministic Quotes Verified
                  </span>
                </div>

                <div className="space-y-3">
                  {candidate.evaluations.map((evalItem, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {evalItem.criterion_name}
                          </span>
                          <span className="badge-neutral font-mono text-[10px]">
                            Weight: {evalItem.criterion_weight.toFixed(1)}x
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {evalItem.score.toFixed(1)} / 100
                        </span>
                      </div>

                      {/* Verbatim Evidence Quote Box */}
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Extracted Quote from Resume:</span>
                          {evalItem.evidence_verified ? (
                            <span className="badge-clean text-[10px]">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Verified In Resume Source
                            </span>
                          ) : (
                            <span className="badge-danger text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Unverified / Hallucination Penalized
                            </span>
                          )}
                        </div>
                        {evalItem.evidence_quote ? (
                          <p className="font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 italic text-[11px]">
                            "{evalItem.evidence_quote}"
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">No verifiable quote found in candidate resume.</p>
                        )}
                      </div>

                      {/* Agent Reasoning */}
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Justification: </span>
                        {evalItem.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close Evidence Inspector
          </button>
        </div>
      </div>
    </div>
  );
};