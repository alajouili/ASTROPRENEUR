import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  Mail,
  Calendar,
  Bot,
  Database,
  Sun,
  Moon,
  Briefcase,
  X,
  LogOut,
  User,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TrustHRLogo } from './TrustHRLogo';

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

  const userRole = user?.role || 'recruiter';

  // Role-specific navigation definitions
  const employeeItems = [
    {
      to: '/careers',
      label: 'Internal Job Board',
      icon: Briefcase,
    },
    {
      to: '/assistant',
      label: 'Policy & Voice Assistant',
      icon: Bot,
    },
  ];

  const recruiterItems = [
    {
      to: '/',
      label: 'Hiring Overview',
      icon: ShieldCheck,
      end: true,
    },
    {
      to: '/screening',
      label: 'ATS Pipeline & Screening',
      icon: Users,
    },
    {
      to: '/scheduling',
      label: 'Interview & Anti-AI Copilot',
      icon: Calendar,
    },
    {
      to: '/inbox',
      label: 'Candidate Inbox Triage',
      icon: Mail,
      badge: inboxCount > 0 ? inboxCount : null,
      badgeColor: 'indigo',
    },
    {
      to: '/assistant',
      label: 'Multilingual Assistant',
      icon: Bot,
    },
  ];

  const adminItems = [
    {
      to: '/',
      label: 'Executive Governance',
      icon: ShieldCheck,
      end: true,
    },
    {
      to: '/approvals',
      label: 'Approval Queue (Two-Man)',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'amber',
    },
    {
      to: '/audit',
      label: 'Cryptographic Audit Trail',
      icon: Database,
      badge: securityAlertCount > 0 ? securityAlertCount : null,
      badgeColor: 'rose',
    },
    {
      to: '/screening',
      label: 'Requisitions & Screening',
      icon: Users,
    },
    {
      to: '/lab',
      label: 'Adversarial & Bias Lab',
      icon: ShieldAlert,
    },
    {
      to: '/assistant',
      label: 'Policy & Compliance AI',
      icon: Bot,
    },
  ];

  const navItems =
    userRole === 'employee'
      ? employeeItems
      : userRole === 'hr_admin'
      ? adminItems
      : recruiterItems;

  const sectionTitle =
    userRole === 'employee'
      ? 'Employee Portal'
      : userRole === 'hr_admin'
      ? 'Executive Oversight'
      : 'Recruiter Console';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
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
            <Link to="/" onClick={onClose}>
              <TrustHRLogo size="md" />
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="space-y-1">
              <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                <span>{sectionTitle}</span>
                <span className="badge-clean text-[9px] font-mono capitalize">
                  {userRole.replace('_', ' ')}
                </span>
              </div>

              {navItems.map((item: any) => {
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
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 shadow-xs border border-indigo-200/50 dark:border-indigo-800/60'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          item.badgeColor === 'amber'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : item.badgeColor === 'rose'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
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
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {user.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In to Console</span>
            </Link>
          )}

          {/* Theme Toggle & Principle */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[10px]">Theme Mode</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-[11px] font-medium"
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
