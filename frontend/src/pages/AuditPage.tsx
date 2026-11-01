import React, { useState, useEffect } from 'react';
import { api, AuditEntry, AuditVerifyResponse } from '../services/api';
import { AuditLogView } from '../components/AuditLogView';
import { RefreshCw, AlertCircle, Filter } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [verificationResult, setVerificationResult] = useState<AuditVerifyResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getAuditTrail(200);
      setLogs(data);
      try {
        const verifyRes = await api.verifyAuditChain();
        setVerificationResult(verifyRes);
      } catch (vErr) {
        // non-fatal
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
    } catch (err: any) {
      setErrorMessage(
        err.status === 403
          ? 'Cryptographic verification requires HR Admin permissions (403 Forbidden).'
          : err.message || 'Audit chain verification failed.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      // Pick a real row id to simulate out-of-band tampering without breaking database storage
      const targetId = logs.length > 1 ? logs[1].id : (logs[0]?.id || 1);
      const res = await api.verifyAuditChain(targetId);
      setVerificationResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulate tamper failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter === 'ALL') return true;
    if (actionFilter === 'SECURITY') {
      return (
        log.action.includes('quarantine') ||
        log.action.includes('locked') ||
        log.action.includes('injection') ||
        log.action.includes('flag')
      );
    }
    if (actionFilter === 'PROPOSALS') {
      return log.action.includes('proposal') || log.action.includes('approved') || log.action.includes('rejected');
    }
    if (actionFilter === 'JOBS') {
      return log.action.includes('job') || log.action.includes('screening') || log.action.includes('candidate');
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Action Filter Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-mono uppercase text-[11px] mr-1">Filter Activity:</span>
          {(['ALL', 'SECURITY', 'PROPOSALS', 'JOBS'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActionFilter(filter)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-colors ${
                actionFilter === filter
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          onClick={loadAudit}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Audit Log Stream */}
      <AuditLogView
        logs={filteredLogs}
        verificationResult={verificationResult}
        onVerify={handleVerifyChain}
        onSimulateTamper={handleSimulateTamper}
        isVerifying={isVerifying}
        isLoading={isLoading}
      />
    </div>
  );
};
