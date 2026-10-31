import React from 'react';
import { AuditResponse } from '../services/api';
import { ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, FileText, Database, ArrowRight } from 'lucide-react';

interface AuditLogViewProps {
  auditData: AuditResponse | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditData, onRefresh, isLoading }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Security & Immutable Audit Trail</h1>
            {auditData?.integrity_verified ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Hash Chain Verified (SHA-256)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Integrity Compromised
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every candidate upload, prompt-injection scan, score calculation, human approval, and dispatch is cryptographically signed and logged.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          Refresh Audit Trail
        </button>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-medium">Verifying cryptographic hash blocks...</p>
          </div>
        ) : !auditData || auditData.logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Audit log empty</h3>
            <p className="text-sm text-slate-500 mt-1">
              Events will appear as soon as resumes are processed or actions approved.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {auditData.logs.map((log) => {
              const isSecurity = log.action.includes('INJECTION') || log.action.includes('SECURITY');
              const isApproval = log.action.includes('APPROVED') || log.action.includes('EXECUTED');

              return (
                <div key={log.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isSecurity
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isApproval
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.actor}
                      </span>
                      <span className="font-semibold text-sm text-slate-900">{log.action}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Details JSON */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </div>

                  {/* Hash Chaining Info */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    <span>Block Hash: {log.hash.substring(0, 20)}...</span>
                    {log.prev_hash && (
                      <span className="hidden md:inline">
                        &bull; Prev: {log.prev_hash.substring(0, 16)}...
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
