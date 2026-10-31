import React, { useState, useEffect } from 'react';
import { api, PendingApproval } from '../services/api';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { CheckCircle2, Clock, Filter, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 animate-fade-in">
      {/* Subheader Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400">Filter Queue:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'ALL' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Proposals ({approvals.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('EXECUTED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'EXECUTED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Executed ({executedCount})
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
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
