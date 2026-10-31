import React from 'react';
import { Scale, ScrollText, ShieldCheck, UserCheck } from 'lucide-react';

// How the product's controls map to the EU AI Act articles for high-risk (employment) systems.
// It lists what is implemented; it is not a legal compliance certificate.
const CONTROLS = [
  {
    article: 'Art. 14',
    title: 'Human oversight',
    control: 'No email, status change or booking happens before a person approves it in the approval queue.',
    icon: UserCheck,
  },
  {
    article: 'Art. 12',
    title: 'Record-keeping',
    control: 'Every upload, score, approval and action is written to an append-only, hash-chained audit trail.',
    icon: ScrollText,
  },
  {
    article: 'Art. 10',
    title: 'Data governance & fairness',
    control: 'Scoring reads a blind profile without name or gender; fairness twins are tested to score identically.',
    icon: Scale,
  },
  {
    article: 'Art. 15',
    title: 'Robustness & cybersecurity',
    control: 'Hidden text and prompt-injection attempts are removed and flagged before any analysis.',
    icon: ShieldCheck,
  },
];

export const EUAIActRadar: React.FC = () => (
  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
    {CONTROLS.map(({ article, title, control, icon: Icon }) => (
      <li key={article} className="flex gap-3 py-3 first:pt-0 last:pb-0">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-slate-900 dark:text-white">{title}</span>
            <span className="text-xs text-slate-400">{article}</span>
            <span className="badge-clean ml-auto">Implemented</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{control}</p>
        </div>
      </li>
    ))}
  </ul>
);
