import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
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
  FileCheck,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  pendingCount: number;
  securityAlertCount: number;
  inboxCount: number;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingCount,
  securityAlertCount,
  inboxCount,
  userRole,
  isOpen,
  onClose,
}) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: ShieldCheck,
      end: true,
    },
    {
      to: '/screening',
      label: 'Resume Screening',
      icon: Users,
    },
    {
      to: '/approvals',
      label: 'Approval Queue',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'amber',
    },
    {
      to: '/inbox',
      label: 'Inbox Triage',
      icon: Mail,
      badge: inboxCount > 0 ? inboxCount : null,
      badgeColor: 'indigo',
    },
    {
      to: '/scheduling',
      label: 'Scheduling',
      icon: Calendar,
    },
    {
      to: '/assistant',
      label: 'Policy Assistant',
      icon: Bot,
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: Database,
      badge: securityAlertCount > 0 ? securityAlertCount : null,
      badgeColor: 'rose',
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
        {/* Top Brand Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
            <Link to="/" onClick={onClose} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                    TrustHR<span className="text-indigo-600 dark:text-indigo-400">.ai</span>
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200/60 dark:border-indigo-800/40">
                    SaaS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  Human-Controlled Gateway
                </p>
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
          <div className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Core Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        item.badgeColor === 'amber'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : item.badgeColor === 'rose'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Compliance, Theme Switcher & User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Air-Gapped HITL Badge */}
          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="font-semibold text-[11px]">Air-Gapped Gateway</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60">
              ENFORCED
            </span>
          </div>

          {/* Theme Switcher Toggle */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark Obsidian</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Enterprise</span>
                </>
              )}
            </span>
            <button
              onClick={toggleTheme}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* User Profile / Role Pill */}
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                {userRole.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                  {userRole} Profile
                </div>
                <div className="text-[10px] text-slate-400">Switch role or SSO</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </aside>
    </>
  );
};