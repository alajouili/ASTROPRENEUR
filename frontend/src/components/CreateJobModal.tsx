import React, { useState } from 'react';
import { api, Criterion, JobOffer } from '../services/api';
import {
  X,
  Plus,
  Trash2,
  Briefcase,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: JobOffer) => void;
}

interface CriterionDraft {
  id: string;
  label: string;
  kind: 'must' | 'nice';
  weight: number;
  type: 'keywords' | 'min_years';
  keywordsStr: string;
  min_years: number;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & AI');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial criteria list
  const [criteria, setCriteria] = useState<CriterionDraft[]>([
    {
      id: 'primary_skill',
      label: 'Core Framework & Languages',
      kind: 'must',
      weight: 3,
      type: 'keywords',
      keywordsStr: 'Python, FastAPI, Docker',
      min_years: 0,
    },
    {
      id: 'min_experience',
      label: 'Professional Experience',
      kind: 'must',
      weight: 3,
      type: 'min_years',
      keywordsStr: '',
      min_years: 2,
    },
    {
      id: 'database_skills',
      label: 'Database & Storage',
      kind: 'nice',
      weight: 2,
      type: 'keywords',
      keywordsStr: 'PostgreSQL, Redis, SQL',
      min_years: 0,
    },
  ]);

  if (!isOpen) return null;

  const handleAddCriterion = () => {
    const nextIdx = criteria.length + 1;
    setCriteria((prev) => [
      ...prev,
      {
        id: `criterion_${Date.now().toString().slice(-4)}`,
        label: `Requirement ${nextIdx}`,
        kind: 'nice',
        weight: 2,
        type: 'keywords',
        keywordsStr: 'Git, CI/CD',
        min_years: 0,
      },
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    if (criteria.length <= 1) {
      setErrorMessage('A job requisition must have at least one evaluation criterion.');
      return;
    }
    setCriteria((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const handleUpdateCriterion = (index: number, patch: Partial<CriterionDraft>) => {
    setCriteria((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a job title.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a job description for candidates.');
      return;
    }

    // Convert draft criteria to valid Criterion objects conforming to backend schemas
    const parsedCriteria: Criterion[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];
      if (!c.label.trim()) {
        setErrorMessage(`Criterion #${i + 1} must have a label.`);
        return;
      }

      // Generate sanitized alphanumeric id
      let cleanId = c.label
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 30);
      if (!cleanId || usedIds.has(cleanId)) {
        cleanId = `crit_${i + 1}_${Date.now().toString().slice(-4)}`;
      }
      usedIds.add(cleanId);

      if (c.type === 'keywords') {
        const kws = c.keywordsStr
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        if (kws.length === 0) {
          setErrorMessage(`Criterion "${c.label}" requires at least one keyword.`);
          return;
        }
        parsedCriteria.push({
          id: cleanId,
          label: c.label.trim(),
          kind: c.kind,
          weight: c.weight,
          type: 'keywords',
          keywords: kws,
        });
      } else {
        parsedCriteria.push({
          id: cleanId,
          label: c.label.trim(),
          kind: c.kind,
          weight: c.weight,
          type: 'min_years',
          min_years: Number(c.min_years) || 1,
        });
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newJob = await api.createJob({
        title: title.trim(),
        description: description.trim(),
        criteria: parsedCriteria,
      });

      onJobCreated(newJob);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create job requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="surface-card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Create New Job Requisition</span>
                <span className="badge-clean text-[10px] font-mono">Action Gateway</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define the role description and deterministic evaluation criteria with strict weights.
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior AI Security Engineer, Full-Stack Lead..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Security, Infrastructure..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Detailed Requisition Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail responsibilities, tech stack, team goals, and expectations for incoming candidates..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
            />
          </div>

          {/* Criteria Builder */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Configurable Evaluation Criteria & Weights</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Must-have criteria act as strict elimination gates; nice-to-have criteria award weighted bonuses.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {criteria.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => handleUpdateCriterion(idx, { label: e.target.value })}
                      placeholder="Criterion label (e.g. Distributed Systems)"
                      className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />

                    {/* Kind: Must vs Nice */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateCriterion(idx, { kind: 'must' })}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                          c.kind === 'must'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Must-Have
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCriterion(idx, { kind: 'nice' })}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                          c.kind === 'nice'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Nice-to-Have
                      </button>
                    </div>

                    {/* Weight Selector */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="text-[10px] font-mono uppercase">Weight:</span>
                      <select
                        value={c.weight}
                        onChange={(e) => handleUpdateCriterion(idx, { weight: Number(e.target.value) })}
                        className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                      >
                        <option value={1}>1x (Standard)</option>
                        <option value={2}>2x (Important)</option>
                        <option value={3}>3x (Critical)</option>
                        <option value={4}>4x (Decisive)</option>
                        <option value={5}>5x (Max Core)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Type Selector: Keywords vs Min Years */}
                  <div className="flex items-center gap-3 text-xs pl-7">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`type_${idx}`}
                        checked={c.type === 'keywords'}
                        onChange={() => handleUpdateCriterion(idx, { type: 'keywords' })}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Keywords & Evidence</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`type_${idx}`}
                        checked={c.type === 'min_years'}
                        onChange={() => handleUpdateCriterion(idx, { type: 'min_years' })}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Minimum Years Experience</span>
                    </label>

                    {c.type === 'keywords' ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={c.keywordsStr}
                          onChange={(e) => handleUpdateCriterion(idx, { keywordsStr: e.target.value })}
                          placeholder="Comma-separated keywords (e.g. Python, Pandas, NumPy)"
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          step={0.5}
                          value={c.min_years}
                          onChange={(e) => handleUpdateCriterion(idx, { min_years: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                        />
                        <span className="text-[11px] text-slate-400">years minimum</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Audit Action: <code className="text-indigo-600 dark:text-indigo-400">job.created</code> logged to Merkle tree
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2 px-4 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary py-2 px-5 text-xs font-semibold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering Requisition...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Create & Publish Requisition</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
