import React from 'react';
import { JobOffer } from '../services/api';
import {
  X,
  Briefcase,
  Calendar,
  CheckCircle2,
  Sliders,
  Award,
  Layers,
  FileText,
} from 'lucide-react';

interface JobDetailModalProps {
  job: JobOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !job) return null;

  const allCriteria = job?.criteria || [];
  const mustCriteria = allCriteria.filter((c) => c.kind === 'must');
  const niceCriteria = allCriteria.filter((c) => c.kind === 'nice');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="surface-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {job.title}
                </h2>
                <span className="badge-clean text-[10px] font-mono">
                  {job.department || 'Operations'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                <span>&bull;</span>
                <span>ID: {job.id.slice(0, 8)}...</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Requisition Overview & Context</span>
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {job.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Evaluation Criteria Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Verifiable Evaluation Criteria ({allCriteria.length} total)</span>
            </h3>

            {/* Must-Have Elimination Gates */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mandatory Knock-Out Gates ({mustCriteria.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mustCriteria.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-bold">
                        Weight: {c.weight}x
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                      {c.type === 'min_years' ? (
                        <span>Min Years: {c.min_years} yrs required</span>
                      ) : (
                        <span>Keywords: {c.keywords?.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nice-To-Have Criteria */}
            {niceCriteria.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <Award className="w-4 h-4" />
                  <span>Weighted Bonus Competencies ({niceCriteria.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {niceCriteria.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-bold">
                          Weight: {c.weight}x
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                        {c.type === 'min_years' ? (
                          <span>Min Years: {c.min_years} yrs bonus</span>
                        ) : (
                          <span>Keywords: {c.keywords?.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="btn-primary py-2 px-4 text-xs font-semibold"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
