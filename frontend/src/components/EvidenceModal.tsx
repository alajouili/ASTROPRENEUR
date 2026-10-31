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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-100">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-800/90 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex justify-between items-start bg-slate-950/70">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-extrabold text-white">{candidate.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Score: {candidate.overall_score.toFixed(1)}%
              </span>
              {isSuspicious ? (
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-500/40 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Prompt Injection Detected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Security Clean
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {candidate.email} &bull; {candidate.phone || 'No phone'} &bull; Source: {candidate.file_name}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-1">
              <Hash className="w-3 h-3 text-sky-400" />
              <span>SHA-256: {candidate.file_hash.substring(0, 28)}...</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Evidence Quotes vs Forensic Document X-Ray */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'evidence'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Job Criteria & Verbatim Evidence Quotes</span>
          </button>
          <button
            onClick={() => setActiveTab('xray')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all relative ${
              activeTab === 'xray'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Forensic Document X-Ray</span>
            {isSuspicious && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'xray' ? (
            <ForensicXRay candidate={candidate} />
          ) : (
            <>
              {/* Security Guard Alerts Banner if Flagged */}
              {isSuspicious && candidate.security_findings.length > 0 && (
                <div className="p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Security Guard: Intercepted Prompt Injections & Anomalies</span>
                  </div>
                  <p className="text-xs text-rose-200/80 mb-3">
                    The Security Guard scanner detected adversarial instructions in this candidate's uploaded resume.
                    These instructions were quarantined and prevented from influencing the AI evaluation or scoring engine.
                  </p>
                  <div className="space-y-2">
                    {candidate.security_findings.map((finding, fIdx) => (
                      <div key={fIdx} className="bg-slate-900/90 p-3 rounded-xl border border-rose-500/30 text-xs">
                        <div className="flex justify-between font-semibold text-rose-300">
                          <span>{finding.description}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-mono text-[10px]">
                            Severity: {finding.severity}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                          Intercepted Snippet: "{finding.snippet}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Summary */}
              {candidate.evaluation_summary && (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1 font-mono">
                    Deterministic Recruitment Synthesis
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{candidate.evaluation_summary}</p>
                </div>
              )}

              {/* Evidence Criteria Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Job-Related Criteria & Verbatim Evidence Quotes
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono">
                    Deterministic Code Verified Quotes
                  </span>
                </div>

                <div className="space-y-4">
                  {candidate.evaluations.map((evalItem, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-lg space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {evalItem.criterion_name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              Weight: {evalItem.criterion_weight.toFixed(1)}x
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-sky-400">
                            {evalItem.score.toFixed(1)} / 100
                          </span>
                        </div>
                      </div>

                      {/* Verbatim Evidence Quote Box */}
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-300">Extracted Quote from Resume:</span>
                          {evalItem.evidence_verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              Verified In Raw Resume Text
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Unverified / Hallucination Penalized
                            </span>
                          )}
                        </div>
                        {evalItem.evidence_quote ? (
                          <p className="font-mono text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800 italic text-[11px]">
                            "{evalItem.evidence_quote}"
                          </p>
                        ) : (
                          <p className="text-slate-500 italic">No verifiable quote found in candidate resume.</p>
                        )}
                      </div>

                      {/* Agent Reasoning */}
                      <div className="text-xs text-slate-400">
                        <span className="font-medium text-slate-300">Evaluation Justification: </span>
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Evidence Inspector
          </button>
        </div>
      </div>
    </div>
  );
};