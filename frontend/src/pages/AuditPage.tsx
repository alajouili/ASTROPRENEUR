import React, { useState, useEffect } from 'react';
import { api, AuditResponse } from '../services/api';
import { AuditLogView } from '../components/AuditLogView';
import { ShieldCheck, Filter, KeyRound, RefreshCw, Database } from 'lucide-react';

interface AuditPageProps {
  onDataChanged?: () => void;
}

export const AuditPage: React.FC<AuditPageProps> = () => {
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actorFilter, setActorFilter] = useState<string>('ALL');

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditTrail();
      setAuditData(data);
    } catch (e) {
      console.error('Failed to load audit trail', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditData?.logs.filter((log) => {
    if (actorFilter === 'ALL') return true;
    return log.actor === actorFilter;
  });

  const filteredAuditData = auditData
    ? {
        ...auditData,
        logs: filteredLogs || [],
      }
    : null;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Actor Filter Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-mono uppercase tracking-wider">Filter Actor:</span>
          {(['ALL', 'SECURITY_GUARD', 'HR_AUTHORIZED_USER', 'ORCHESTRATOR', 'SYSTEM'] as const).map(
            (actor) => (
              <button
                key={actor}
                onClick={() => setActorFilter(actor)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all border ${
                  actorFilter === actor
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-slate-800/80'
                }`}
              >
                {actor.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <button
          onClick={loadAudit}
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Verify Integrity Chain</span>
        </button>
      </div>

      {/* Main Audit Log Stream */}
      <AuditLogView
        auditData={filteredAuditData}
        onRefresh={loadAudit}
        isLoading={isLoading}
      />
    </div>
  );
};