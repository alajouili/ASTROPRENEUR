import React from 'react';
import { Scale, ShieldCheck, Lock, UserCheck, FileText, CheckCircle2, AlertOctagon } from 'lucide-react';

export const EUAIActRadar: React.FC = () => {
  const articles = [
    {
      article: 'Article 14',
      title: 'Human Oversight & Human-in-the-Loop',
      status: '100% COMPLIANT',
      description: 'Air-gapped Action Gateway strictly prevents autonomous candidate rejections or outbound emails without recruiter sign-off.',
      icon: UserCheck,
    },
    {
      article: 'Article 12',
      title: 'Automatic Record-Keeping & Auditability',
      status: '100% COMPLIANT',
      description: 'Continuous cryptographic logging. Every screening score, prompt injection scan, and approval is signed in a SHA-256 hash chain.',
      icon: Lock,
    },
    {
      article: 'Article 10',
      title: 'Data Governance & Demographic Fairness',
      status: '100% COMPLIANT',
      description: 'Identity-blind scoring. Demographic twins (Leila vs Karim) receive identical deterministic ranking scores to eliminate bias.',
      icon: Scale,
    },
    {
      article: 'Article 15',
      title: 'Cybersecurity & Adversarial Robustness',
      status: '100% COMPLIANT',
      description: 'Binary-level forensic extraction quarantines invisible white-text, microscopic typography, and prompt-injection overrides.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="surface-card p-5 sm:p-6 border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  EU AI Act Compliance Engine (Annex III.4 High-Risk Mandate)
                </h3>
                <span className="badge-clean">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  AUDIT READY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                European Union Artificial Intelligence Regulation for Employment & HR Systems
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs">
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono">Legal Fine Exposure</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">€0.00 (Zero Liability)</div>
          </div>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 font-mono">Max Penalty Prevented</div>
            <div className="text-amber-600 dark:text-amber-400 font-bold font-mono text-xs">Up to €35,000,000</div>
          </div>
        </div>
      </div>

      {/* 4 Compliance Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {articles.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                    {item.article}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    COMPLIANT
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-500 h-1 rounded-full w-full"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};