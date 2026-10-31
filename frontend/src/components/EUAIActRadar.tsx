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
      color: 'emerald',
    },
    {
      article: 'Article 12',
      title: 'Automatic Record-Keeping & Auditability',
      status: '100% COMPLIANT',
      description: 'Continuous cryptographic logging. Every screening score, prompt injection scan, and approval is signed in a SHA-256 hash chain.',
      icon: Lock,
      color: 'emerald',
    },
    {
      article: 'Article 10',
      title: 'Data Governance & Demographic Fairness',
      status: '100% COMPLIANT',
      description: 'Identity-blind scoring. Demographic twins (Leila vs Karim) receive identical deterministic ranking scores to eliminate bias.',
      icon: Scale,
      color: 'emerald',
    },
    {
      article: 'Article 15',
      title: 'Cybersecurity & Adversarial Robustness',
      status: '100% COMPLIANT',
      description: 'Binary-level forensic extraction quarantines invisible white-text, microscopic typography, and prompt-injection overrides.',
      icon: ShieldCheck,
      color: 'emerald',
    },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-800/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  EU AI Act Compliance Engine (High-Risk Category Annex III.4)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  VERIFIED AUDIT READY
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5">
                European Union Artificial Intelligence Regulation (High-Risk Employment & HR Systems Mandate)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/30 px-3.5 py-2 rounded-xl border border-indigo-500/20 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Potential Legal Fine Exposure</div>
            <div className="text-emerald-400 font-bold font-mono text-sm">€0.00 (Zero Liability)</div>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Non-Compliance Penalty Prevented</div>
            <div className="text-amber-300 font-bold font-mono text-sm">Up to €35,000,000</div>
          </div>
        </div>
      </div>

      {/* 4 Compliance Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {articles.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/20 hover:border-indigo-400/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    {item.article}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.status}
                  </span>
                </div>
                <div className="font-semibold text-xs text-white mb-1 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-indigo-200/70 leading-relaxed">{item.description}</p>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
