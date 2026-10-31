import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Search,
  User,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TopbarProps {
  onToggleSidebar: () => void;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onOpenPitchDemo?: () => void;
  userRole: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  isMockMode,
  onToggleMockMode,
  onOpenPitchDemo,
  userRole,
}) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview & Defense Metrics';
      case '/screening':
        return 'Candidate Resume Screening';
      case '/approvals':
        return 'Human Approval & Action Gateway';
      case '/inbox':
        return 'Inbox Triage & Communications';
      case '/scheduling':
        return 'Recruiter Interview Calendar';
      case '/assistant':
        return 'Employee Policy Assistant (RAG)';
      case '/audit':
        return 'Cryptographic Audit Trail';
      case '/login':
        return 'Authentication & Role Profiles';
      default:
        return 'TrustHR AI Workspace';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Left Section: Mobile Toggle & Page Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">TrustHR</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <h1 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right Controls: Pitch Mode, Mock/Live Toggle, Theme Toggle & Role Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 5-Min Pitch Demo Button */}
        {onOpenPitchDemo && (
          <button
            onClick={onOpenPitchDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all transform active:scale-95"
            title="Launch 5-Minute Interactive Hackathon Pitch Mode with Teleprompter"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"></span>
            <span className="hidden sm:inline">5-Min Pitch Mode</span>
            <span className="sm:hidden font-mono text-[11px]">Pitch</span>
          </button>
        )}

        {/* Mock Data / Live API Toggle */}
        <button
          onClick={onToggleMockMode}
          title="Toggle between Zero-Latency Offline Mock Data and Live FastAPI backend"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isMockMode
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 hover:bg-amber-100'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100'
          }`}
        >
          {isMockMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Mock Mode</span>
              <span className="md:hidden">Mock</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="hidden md:inline">Live API</span>
              <span className="md:hidden">Live</span>
            </>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Role Indicator Pill */}
        <Link
          to="/login"
          title="Click to switch role or view credentials"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
        >
          <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{userRole}</span>
        </Link>
      </div>
    </header>
  );
};