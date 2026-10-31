import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  User,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TrustHRLogo } from './TrustHRLogo';

interface TopbarProps {
  onToggleSidebar: () => void;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onOpenPitchDemo?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  isMockMode,
  onToggleMockMode,
  onOpenPitchDemo,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview & Governance Metrics';
      case '/screening':
        return 'ATS Pipeline & Candidate Screening';
      case '/approvals':
        return 'Human Approval & Action Gateway';
      case '/inbox':
        return 'Inbox Triage & Communications';
      case '/scheduling':
        return 'Interview Scheduling & Anti-AI Copilot';
      case '/careers':
        return 'Internal Mobility & Careers';
      case '/assistant':
        return 'Multilingual Voice & Policy Assistant';
      case '/audit':
        return 'Cryptographic Audit Trail';
      case '/lab':
        return 'Adversarial & Bias Security Lab';
      case '/login':
        return 'Authentication Console';
      default:
        return 'TrustHR AI Workspace';
    }
  };

  const userRole = user?.role ? user.role.replace('_', ' ') : 'Guest';

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

        <div className="lg:hidden">
          <TrustHRLogo size="sm" showText={false} />
        </div>

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
            title="Launch 5-Minute Interactive Hackathon Pitch Guide"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"></span>
            <span className="hidden sm:inline">5-Min Pitch Guide</span>
            <span className="sm:hidden font-mono text-[11px]">Pitch</span>
          </button>
        )}

        {/* Demo Mode Toggle */}
        <button
          onClick={onToggleMockMode}
          title="Toggle between Demo Simulation Mode and Real Live Backend API"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isMockMode
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 hover:bg-amber-100'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100'
          }`}
        >
          {isMockMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline font-mono">Demo Data Mode</span>
              <span className="md:hidden font-mono">Demo</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="hidden md:inline font-mono">Live Gateway API</span>
              <span className="md:hidden font-mono">Live</span>
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

        {/* User Role Pill */}
        <Link
          to="/login"
          title="Session details / switch user"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 hover:border-indigo-500 transition-colors capitalize font-mono text-[11px]"
        >
          <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{userRole}</span>
        </Link>
      </div>
    </header>
  );
};
