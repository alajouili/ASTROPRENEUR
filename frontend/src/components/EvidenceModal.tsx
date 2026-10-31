import React from 'react';
import { CandidateDetail } from '../services/api';
import { X, CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert, FileText, Hash } from 'lucide-react';

interface EvidenceModalProps {
  candidate: CandidateDetail | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const isSuspicious = candidate.security_status === 'SUSPICIOUS_FLAGGED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                Score: {candidate.overall_score.toFixed(1)}%
              </span>
              {isSuspicious ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Prompt Injection Detected
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Security Clean
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {candidate.email} &bull; {candidate.phone || 'No phone'} &bull; Source: {candidate.file_name}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-1">
              <Hash className="w-3 h-3" />
              <span>SHA-256 Integrity: {candidate.file_hash.substring(0, 24)}...</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Security Guard Alerts Banner if Flagged */}
          {isSuspicious && candidate.security_findings.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Security Guard: Intercepted Prompt Injections & Anomalies</span>
              </div>
              <p className="text-xs text-rose-700 mb-3">
                The Security Guard scanner detected adversarial instructions in this candidate's uploaded resume.
                These instructions were quarantined and prevented from influencing the AI evaluation or scoring engine.
              </p>
              <div className="space-y-2">
                {candidate.security_findings.map((finding, fIdx) => (
                  <div key={fIdx} className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs">
                    <div className="flex justify-between font-semibold text-rose-900">
                      <span>{finding.description}</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px]">
                        Severity: {finding.severity}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                      Intercepted Snippet: "{finding.snippet}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Summary */}
          {candidate.evaluation_summary && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                Recruitment Synthesis
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{candidate.evaluation_summary}</p>
            </div>
          )}

          {/* Evidence Criteria Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Job-Related Criteria & Verbatim Evidence Quotes
              </h3>
              <span className="text-xs text-slate-500">
                Deterministic Code Verified Quotes
              </span>
            </div>

            <div className="space-y-4">
              {candidate.evaluations.map((evalItem, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {evalItem.criterion_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          Weight: {evalItem.criterion_weight.toFixed(1)}x
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {evalItem.score.toFixed(1)} / 100
                      </span>
                    </div>
                  </div>

                  {/* Verbatim Evidence Quote Box */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-600">Extracted Quote from Resume:</span>
                      {evalItem.evidence_verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Verified In Raw Resume Text
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Unverified / Hallucination Penalized
                        </span>
                      )}
                    </div>
                    {evalItem.evidence_quote ? (
                      <p className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 italic">
                        "{evalItem.evidence_quote}"
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No verifiable quote found in candidate resume.</p>
                    )}
                  </div>

                  {/* Agent Reasoning */}
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Evaluation Justification: </span>
                    {evalItem.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close Evidence Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
