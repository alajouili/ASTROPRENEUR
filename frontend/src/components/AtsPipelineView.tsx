import React from 'react';
import { RankedCandidate, NotRankedCandidate, JobOffer } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileText,
  Eye,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

interface AtsPipelineViewProps {
  job: JobOffer | null;
  ranked: RankedCandidate[];
  notRanked: NotRankedCandidate[];
  onSelectCandidate: (candidate: RankedCandidate | NotRankedCandidate) => void;
  onOpenUpload: () => void;
}

interface PipelineColumn {
  id: string;
  title: string;
  badge: string;
  color: string;
  borderColor: string;
  candidates: Array<RankedCandidate | NotRankedCandidate>;
  description: string;
}

export const AtsPipelineView: React.FC<AtsPipelineViewProps> = ({
  job,
  ranked,
  notRanked,
  onSelectCandidate,
  onOpenUpload,
}) => {
  // Categorize candidates into realistic ATS pipeline stages
  const receivedList: Array<RankedCandidate | NotRankedCandidate> = [
    ...notRanked.filter((c) => c.status === 'received' && c.risk_level === 'clean'),
  ];

  const quarantinedList: Array<RankedCandidate | NotRankedCandidate> = [
    ...ranked.filter((c) => c.risk_level !== 'clean' || (c.risk_flags && c.risk_flags.length > 0)),
    ...notRanked.filter((c) => c.risk_level !== 'clean' || (c.risk_flags && c.risk_flags.length > 0)),
  ];

  const evidenceVerifiedList: RankedCandidate[] = ranked.filter(
    (c) =>
      c.risk_level === 'clean' &&
      (!c.risk_flags || c.risk_flags.length === 0) &&
      c.score < 80 &&
      c.status !== 'shortlisted' &&
      c.status !== 'proposed'
  );

  const interviewProposedList: RankedCandidate[] = ranked.filter(
    (c) =>
      c.risk_level === 'clean' &&
      (!c.risk_flags || c.risk_flags.length === 0) &&
      (c.status === 'proposed' || (c.score >= 80 && c.status !== 'shortlisted'))
  );

  const shortlistedList: RankedCandidate[] = ranked.filter(
    (c) => c.status === 'shortlisted'
  );

  const columns: PipelineColumn[] = [
    {
      id: 'received',
      title: 'Intake / Received',
      badge: `${receivedList.length}`,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      borderColor: 'border-slate-300 dark:border-slate-700',
      candidates: receivedList,
      description: 'Raw resumes ingested, sandboxed & awaiting extraction.',
    },
    {
      id: 'quarantined',
      title: 'Forensic Quarantined',
      badge: `${quarantinedList.length}`,
      color: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
      borderColor: 'border-rose-400 dark:border-rose-800',
      candidates: quarantinedList,
      description: 'Adversarial prompt injections, hidden text or OCR exploits intercepted.',
    },
    {
      id: 'verified',
      title: 'Evidence Verified',
      badge: `${evidenceVerifiedList.length}`,
      color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
      borderColor: 'border-indigo-400 dark:border-indigo-800',
      candidates: evidenceVerifiedList,
      description: 'Clean pass with verbatim quotes, page offsets & criteria mapping.',
    },
    {
      id: 'interview',
      title: 'Interview Proposed',
      badge: `${interviewProposedList.length}`,
      color: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
      borderColor: 'border-amber-400 dark:border-amber-800',
      candidates: interviewProposedList,
      description: 'Top scored candidates proposed for interview calendar invite.',
    },
    {
      id: 'shortlisted',
      title: 'Shortlisted / Hired',
      badge: `${shortlistedList.length}`,
      color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
      borderColor: 'border-emerald-400 dark:border-emerald-800',
      candidates: shortlistedList,
      description: 'Human approval executed through Action Gateway (Article 14 HITL).',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Board Column Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`surface-card p-3 rounded-xl border flex flex-col min-h-[520px] max-h-[750px] shadow-xs ${col.borderColor}`}
          >
            {/* Column Header */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  {col.id === 'quarantined' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  ) : col.id === 'verified' ? (
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  ) : col.id === 'shortlisted' ? (
                    <Award className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{col.title}</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                  {col.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1" title={col.description}>
                {col.description}
              </p>
            </div>

            {/* Candidate Cards List */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {col.candidates.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  <p className="text-[11px] text-slate-400 font-mono">No candidates in this stage</p>
                </div>
              ) : (
                col.candidates.map((cand) => {
                  const isRanked = 'score' in cand;
                  const rankedCand = isRanked ? (cand as RankedCandidate) : null;
                  const isQuarantined =
                    cand.risk_level !== 'clean' || (cand.risk_flags && cand.risk_flags.length > 0);

                  return (
                    <div
                      key={cand.candidate_id}
                      onClick={() => onSelectCandidate(cand)}
                      className="group p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer relative"
                    >
                      {/* Top Bar: Name & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {cand.display_name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono truncate block">
                            {cand.source_filename}
                          </span>
                        </div>

                        {rankedCand && (
                          <div
                            className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              rankedCand.score >= 75
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : rankedCand.score >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {Math.round(rankedCand.score)}%
                          </div>
                        )}
                      </div>

                      {/* Must-have criteria status or unranked tag */}
                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
                        {rankedCand ? (
                          <span
                            className={`flex items-center gap-1 ${
                              rankedCand.must_have_met === rankedCand.must_have_total
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-rose-600 dark:text-rose-400 font-bold'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {rankedCand.must_have_met}/{rankedCand.must_have_total} Must-Have
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending Screen</span>
                          </span>
                        )}

                        <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Evidence</span>
                          <Eye className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Threat or Flag Badges */}
                      {isQuarantined && cand.risk_flags && cand.risk_flags.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                          {cand.risk_flags.map((flag: any, idx: number) => {
                            const badgeText =
                              typeof flag === 'string'
                                ? flag
                                : (flag?.code || flag?.name || flag?.detail || 'FLAG').toUpperCase();
                            return (
                              <span
                                key={idx}
                                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                              >
                                [{badgeText}]
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Upload action at bottom of first column */}
            {col.id === 'received' && (
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onOpenUpload}
                  className="w-full py-1.5 px-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>+ Ingest Resumes</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
