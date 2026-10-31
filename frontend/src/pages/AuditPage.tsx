import React, { useState, useEffect } from 'react';
import { api, AuditResponse } from '../services/api';
import { AuditLogView } from '../components/AuditLogView';
import { ShieldCheck, Filter, KeyRound, RefreshCw, Database } from 'lucide-react';

export const AuditPage: React.FC = () => {
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
    <div className="space-y-6 animate-fade-in">
      {/* Actor Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-semibold">Filter Actor:</span>
          {(['ALL', 'SECURITY_GUARD', 'HR_AUTHORIZED_USER', 'ORCHESTRATOR', 'SYSTEM'] as const).map(
            (actor) => (
              <button
                key={actor}
                onClick={() => setActorFilter(actor)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  actorFilter === actor
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {actor.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <button
          onClick={loadAudit}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Main Audit Log Stream */}
      <AuditLogView auditData={filteredAuditData} onRefresh={loadAudit} isLoading={isLoading} />
    </div>
  );
};
