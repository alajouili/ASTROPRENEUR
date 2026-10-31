import React from 'react';
import { AuditResponse } from '../services/api';
import { ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, FileText, Database, ArrowRight, Fingerprint, Lock } from 'lucide-react';

interface AuditLogViewProps {
  auditData: AuditResponse | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditData, onRefresh, isLoading }) => {
  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Security & Immutable Audit Trail</h1>
            {auditData?.integrity_verified ? (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Hash Chain Verified (SHA-256)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Integrity Compromised
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every candidate upload, prompt-injection scan, deterministic score calculation, human approval, and dispatch is cryptographically signed and logged.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-emerald-400 font-mono">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>EU AI Act Art. 12</span>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs font-bold px-4 py-2 bg-slate-950/70 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
          >
            Verify Ledger
          </button>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-200">Verifying cryptographic hash blocks...</p>
          </div>
        ) : !auditData || auditData.logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">Audit log empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Events will appear as soon as resumes are processed or actions approved.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {auditData.logs.map((log) => {
              const isSecurity = log.action.includes('INJECTION') || log.action.includes('SECURITY');
              const isApproval = log.action.includes('APPROVED') || log.action.includes('EXECUTED');

              return (
                <div key={log.id} className="p-5 hover:bg-slate-800/40 transition-colors space-y-2.5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          isSecurity
                            ? 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                            : isApproval
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {log.actor}
                      </span>
                      <span className="font-bold text-sm text-white font-mono">{log.action}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Details JSON */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </div>

                  {/* Hash Chaining Info */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                    <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                    <span>Block Hash: <strong className="text-slate-300">{log.hash.substring(0, 24)}...</strong></span>
                    {log.prev_hash && (
                      <span className="hidden md:inline">
                        &bull; Prev Hash: <strong className="text-slate-400">{log.prev_hash.substring(0, 18)}...</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};