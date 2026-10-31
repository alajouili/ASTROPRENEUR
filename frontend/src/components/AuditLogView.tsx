import React from 'react';
import { AuditEntry, AuditVerifyResponse } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Database,
  Fingerprint,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditEntry[];
  verificationResult: AuditVerifyResponse | null;
  onVerify: () => void;
  onSimulateTamper: () => void;
  isVerifying: boolean;
  isLoading: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  verificationResult,
  onVerify,
  onSimulateTamper,
  isVerifying,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="surface-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Tamper-Evident SHA-256 Audit Trail
            </h2>
            {verificationResult && (
              verificationResult.ok ? (
                <span className="badge-clean font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Chain Verified: {verificationResult.checked} blocks intact</span>
                </span>
              ) : (
                <span className="badge-danger font-mono text-[11px] animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Tamper Detected at Block #{verificationResult.first_bad_id}</span>
                </span>
              )
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Every candidate upload, prompt-injection quarantine, deterministic score calculation, and human approval is chained backward via SHA-256 hashes. Database triggers prohibit in-place <code className="font-mono text-slate-700 dark:text-slate-300">UPDATE</code> / <code className="font-mono text-slate-700 dark:text-slate-300">DELETE</code> operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-neutral font-mono text-xs hidden lg:inline-flex">
            <Fingerprint className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>EU AI Act Art. 12</span>
          </span>

          {/* Simulate Tamper Button for Hackathon Demo */}
          <button
            onClick={onSimulateTamper}
            disabled={isVerifying || logs.length === 0}
            title="Demonstrate out-of-band DB tamper detection without altering actual storage"
            className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Simulate Tamper</span>
          </button>

          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Hashes...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Verify Ledger Chain</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Tamper Alert Banner when verification fails */}
      {verificationResult && !verificationResult.ok && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 rounded-xl space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Cryptographic Chain Break Detected! (Block #{verificationResult.first_bad_id})</span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-mono">
            Integrity check failed: row #{verificationResult.first_bad_id}'s computed SHA-256 hash does not match the forward link. An out-of-band SQL modification or row deletion occurred. Recruitment actions referencing this block will be refused by the Action Gateway.
          </p>
          <div className="pt-1">
            <button
              onClick={onVerify}
              className="px-3 py-1 text-xs font-mono font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
            >
              Re-verify Clean Chain
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Stream */}
      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Retrieving signed audit records from gateway...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Audit log empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Events will be appended as soon as user logins occur or CVs are screened.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const isSecurity =
                log.action.includes('quarantine') ||
                log.action.includes('locked') ||
                log.action.includes('injection');
              const isApproval =
                log.action.includes('approved') || log.action.includes('executed');

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors space-y-2"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 font-bold">
                        #{log.id}
                      </span>
                      <span
                        className={
                          isSecurity
                            ? 'badge-danger font-mono text-[10px]'
                            : isApproval
                            ? 'badge-clean font-mono text-[10px]'
                            : 'badge-neutral font-mono text-[10px]'
                        }
                      >
                        {log.actor_type}: {log.actor_id}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                        {log.action}
                      </span>
                      <span className="badge-info font-mono text-[10px]">
                        {log.entity_type}:{log.entity_id.substring(0, 8)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(log.at).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Details JSON */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}

                  {/* Hash Chaining Info */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
                    <KeyRound className="w-3 h-3 text-indigo-500" />
                    <span>
                      SHA-256 Hash:{' '}
                      <strong className="text-slate-600 dark:text-slate-300 font-mono">
                        {log.hash}
                      </strong>
                    </span>
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
