import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Mail,
  Calendar,
  Bot,
  Database,
  Sun,
  Moon,
  Lock,
  ChevronRight,
  User,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  pendingCount: number;
  securityAlertCount: number;
  inboxCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingCount,
  securityAlertCount,
  inboxCount,
  isOpen,
  onClose,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const coreNavItems = [
    {
      to: '/',
      label: 'Overview',
      icon: ShieldCheck,
      end: true,
      roles: ['recruiter', 'hr_admin', 'employee'],
    },
    {
      to: '/screening',
      label: 'Resume Screening',
      icon: Users,
      roles: ['recruiter', 'hr_admin'],
    },
    {
      to: '/approvals',
      label: 'Approval Queue',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'amber',
      roles: ['recruiter', 'hr_admin'],
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: Database,
      badge: securityAlertCount > 0 ? securityAlertCount : null,
      badgeColor: 'rose',
      roles: ['hr_admin'],
    },
  ];

  const roadmapNavItems = [
    {
      to: '/inbox',
      label: 'Inbox Triage',
      icon: Mail,
      badge: 'Preview',
    },
    {
      to: '/scheduling',
      label: 'Interview Scheduling',
      icon: Calendar,
      badge: 'Preview',
    },
    {
      to: '/assistant',
      label: 'Policy Assistant',
      icon: Bot,
      badge: 'Preview',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Header */}
        <div className="flex flex-col">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                    TrustHR<span className="text-indigo-600">.ai</span>
                  </span>
                  <span className="badge-clean text-[9px] font-mono px-1 py-0.2">
                    HITL
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                  ACTION GATEWAY
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-220px)]">
            {/* Core Working Modules */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                Core Governance
              </div>
              {coreNavItems
                .filter((item) => !user || item.roles.includes(user.role))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to) && item.to !== '/';

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                            item.badgeColor === 'amber'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
            </div>

            {/* Roadmap Modules (Simulated) */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                <span>Roadmap Modules</span>
                <span className="text-[9px] text-slate-400 font-normal lowercase">(simulated)</span>
              </div>
              {roadmapNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{item.label}</span>
                    </div>

                    <span className="badge-neutral text-[9px] font-mono px-1.5 py-0.2">
                      {item.badge}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Footer: User Profile, Theme Switcher & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* User Info */}
          {user ? (
            <div className="p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate capitalize">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Theme Toggle & Principle */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[10px]">Theme Mode</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
