import React, { useState, useEffect } from 'react';
import { api, PendingApproval } from '../services/api';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { CheckCircle2, Clock, Filter, RefreshCw, ShieldAlert, Sparkles, Lock } from 'lucide-react';

interface ApprovalPageProps {
  onDataChanged?: () => void;
}

export const ApprovalPage: React.FC<ApprovalPageProps> = ({ onDataChanged }) => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'EXECUTED'>('ALL');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (e) {
      console.error('Failed to load approvals', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadApprovals();
    if (onDataChanged) onDataChanged();
  };

  const filteredApprovals = approvals.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const executedCount = approvals.filter((a) => a.status === 'EXECUTED').length;

  return (
    <div className="space-y-5">
      {/* Subheader Filter Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium flex-wrap">
          <span className="text-slate-500 font-mono uppercase text-[11px] mr-1">Filter Queue:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({approvals.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('EXECUTED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'EXECUTED'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Executed ({executedCount})
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Approval Queue */}
      <ApprovalQueue approvals={filteredApprovals} onRefresh={handleRefresh} />
    </div>
  );
};