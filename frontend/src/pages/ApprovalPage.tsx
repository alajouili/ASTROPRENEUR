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
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Subheader Filter Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
          <span className="text-slate-400 uppercase tracking-wider font-mono">Queue Filter:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all border ${
              statusFilter === 'ALL'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            All Proposals ({approvals.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl transition-all border ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('EXECUTED')}
            className={`px-3 py-1.5 rounded-xl transition-all border ${
              statusFilter === 'EXECUTED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
            }`}
          >
            Executed ({executedCount})
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition-colors"
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