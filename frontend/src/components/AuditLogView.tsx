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
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Security & Immutable Audit Trail
            </h2>
            {auditData?.integrity_verified ? (
              <span className="badge-clean font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Hash Chain Verified (SHA-256)
              </span>
            ) : (
              <span className="badge-danger font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Integrity Compromised
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Every candidate upload, prompt-injection scan, deterministic score calculation, human approval, and dispatch is cryptographically signed and logged.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-neutral font-mono text-xs hidden sm:inline-flex">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>EU AI Act Art. 12</span>
          </span>
          <button onClick={onRefresh} className="btn-secondary text-xs py-1.5 px-3">
            Verify Ledger
          </button>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verifying cryptographic hash blocks...</p>
          </div>
        ) : !auditData || auditData.logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Audit log empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Events will appear as soon as resumes are processed or actions approved.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditData.logs.map((log) => {
              const isSecurity = log.action.includes('INJECTION') || log.action.includes('SECURITY');
              const isApproval = log.action.includes('APPROVED') || log.action.includes('EXECUTED');

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          isSecurity
                            ? 'badge-danger font-mono text-[10px]'
                            : isApproval
                            ? 'badge-clean font-mono text-[10px]'
                            : 'badge-neutral font-mono text-[10px]'
                        }
                      >
                        {log.actor}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">{log.action}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Details JSON */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </div>

                  {/* Hash Chaining Info */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
                    <KeyRound className="w-3 h-3 text-indigo-500" />
                    <span>Block Hash: <strong className="text-slate-600 dark:text-slate-300">{log.hash.substring(0, 24)}...</strong></span>
                    {log.prev_hash && (
                      <span className="hidden md:inline">
                        &bull; Prev Hash: <strong className="text-slate-500 dark:text-slate-400">{log.prev_hash.substring(0, 16)}...</strong>
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