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
    <div className="space-y-4">
      {/* Actor Filter Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-mono uppercase text-[11px] mr-1">Filter Actor:</span>
          {(['ALL', 'SECURITY_GUARD', 'HR_AUTHORIZED_USER', 'ORCHESTRATOR', 'SYSTEM'] as const).map(
            (actor) => (
              <button
                key={actor}
                onClick={() => setActorFilter(actor)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-colors ${
                  actorFilter === actor
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {actor.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <button
          onClick={loadAudit}
          className="btn-secondary text-xs py-1.5 px-3"
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