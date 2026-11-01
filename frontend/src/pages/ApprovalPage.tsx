import React, { useState, useEffect } from 'react';
import { api, Proposal } from '../services/api';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { RefreshCw, AlertCircle, Mail, ExternalLink } from 'lucide-react';

interface ApprovalPageProps {
  onDataChanged?: () => void;
}

export const ApprovalPage: React.FC<ApprovalPageProps> = ({ onDataChanged }) => {
  const [approvals, setApprovals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  const loadApprovals = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getProposals(statusFilter === 'all' ? undefined : statusFilter);
      setApprovals(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load proposals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadApprovals();
    if (onDataChanged) onDataChanged();
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Subheader Filter Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium flex-wrap">
          <span className="text-slate-500 font-mono uppercase text-[11px] mr-1">Status:</span>
          {/* Approval runs the Action Gateway at once: an approved proposal ends executed or failed. */}
          {(['all', 'pending', 'executed', 'rejected', 'failed', 'superseded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-mono text-xs ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st} {st === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noopener noreferrer"
            title="Inspect outgoing candidate emails dispatched via Action Gateway"
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Open Mailpit (Port 8025)</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>

          <button
            onClick={handleRefresh}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Approval Queue */}
      <ApprovalQueue approvals={approvals} onRefresh={handleRefresh} />
    </div>
  );
};
