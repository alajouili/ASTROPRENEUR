import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Presentation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TrustHRLogo } from './TrustHRLogo';

interface TopbarProps {
  onToggleSidebar: () => void;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onOpenPitchDemo?: () => void;
}

const PAGES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Screening activity, pending decisions and security at a glance' },
  '/screening': { title: 'Pipeline & screening', subtitle: 'Evidence-based ranking against the job criteria' },
  '/approvals': { title: 'Approval queue', subtitle: 'Every action waits for a human decision' },
  '/inbox': { title: 'Inbox triage', subtitle: 'Candidate emails and reply drafts' },
  '/scheduling': { title: 'Interview scheduling', subtitle: 'Interview slot proposals and interview copilot' },
  '/careers': { title: 'Internal job board', subtitle: 'Open positions inside the company' },
  '/assistant': { title: 'Policy assistant', subtitle: 'Answers from company policy documents, with sources' },
  '/audit': { title: 'Audit trail', subtitle: 'Tamper-evident record of every action' },
  '/lab': { title: 'Adversarial & bias lab', subtitle: 'Attack and fairness checks on the screening pipeline' },
};

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isMockMode, onToggleMockMode, onOpenPitchDemo }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const page = PAGES[location.pathname] ?? { title: 'TrustHR', subtitle: '' };

  return (
    <header className="h-16 sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onToggleSidebar} className="lg:hidden btn-ghost p-2 -ml-2" aria-label="Open navigation">
          <Menu className="w-5 h-5" />
        </button>
        <div className="lg:hidden shrink-0">
          <TrustHRLogo size="sm" showText={false} />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{page.title}</h1>
          {page.subtitle && (
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 truncate">{page.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Data source: live backend or local sample data */}
        <button
          onClick={onToggleMockMode}
          title={isMockMode ? 'Showing local sample data. Click to use the live backend.' : 'Showing live backend data. Click to show sample data.'}
          className="inline-flex items-center gap-2 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${isMockMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{isMockMode ? 'Sample data' : 'Live data'}</span>
        </button>

        {onOpenPitchDemo && (
          <button onClick={onOpenPitchDemo} className="btn-ghost h-8 px-2.5 text-xs" title="Open the presenter guide">
            <Presentation className="w-4 h-4" />
            <span className="hidden sm:inline">Presenter guide</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="btn-ghost h-8 w-8 p-0"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
