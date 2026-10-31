import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  ScrollText,
  FlaskConical,
  MessageSquareText,
  Mail,
  CalendarDays,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  LogIn,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { initials, roleLabel } from '../lib/format';

interface SidebarProps {
  pendingCount: number;
  securityAlertCount: number;
  inboxCount: number;
  isOpen: boolean;
  onClose: () => void;
}

type Role = 'recruiter' | 'hr_admin' | 'employee';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  end?: boolean;
  count?: number;
  countTone?: 'amber' | 'rose';
  preview?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingCount, securityAlertCount, isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const HR: Role[] = ['recruiter', 'hr_admin'];
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Recruitment',
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard, roles: ['recruiter', 'hr_admin', 'employee'], end: true },
        { to: '/screening', label: 'Resume screening', icon: Users, roles: HR, count: securityAlertCount, countTone: 'rose' },
        { to: '/approvals', label: 'Approval queue', icon: CheckCircle2, roles: HR, count: pendingCount, countTone: 'amber' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { to: '/audit', label: 'Audit trail', icon: ScrollText, roles: ['hr_admin'] },
        { to: '/lab', label: 'Adversarial & bias lab', icon: FlaskConical, roles: HR },
      ],
    },
    {
      title: 'Employees',
      items: [{ to: '/assistant', label: 'Policy assistant', icon: MessageSquareText, roles: ['recruiter', 'hr_admin', 'employee'] }],
    },
    {
      title: 'Preview',
      items: [
        { to: '/inbox', label: 'Inbox triage', icon: Mail, roles: HR, preview: true },
        { to: '/scheduling', label: 'Interview scheduling', icon: CalendarDays, roles: HR, preview: true },
      ],
    },
  ];

  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !user || i.roles.includes(user.role)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-[18px] h-[18px]" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">TrustHR</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Recruitment workspace</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1.5" aria-label="Close navigation">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {visible.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-1.5 eyebrow flex items-center justify-between">
                <span>{group.title}</span>
                {group.title === 'Preview' && (
                  <span className="normal-case tracking-normal font-normal text-slate-400">sample data</span>
                )}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-500/10 dark:text-indigo-300'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-indigo-600" />}
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                              }`}
                            />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.count ? (
                              <span
                                className={`min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[11px] font-semibold text-center tabular-nums ${
                                  item.countTone === 'amber'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                }`}
                              >
                                {item.count}
                              </span>
                            ) : null}
                            {item.preview && <span className="text-[11px] text-slate-400">Preview</span>}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {user ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold shrink-0">
                {initials(user.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.full_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</div>
              </div>
              <button onClick={() => logout()} title="Sign out" aria-label="Sign out" className="btn-ghost p-1.5 hover:text-rose-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary w-full">
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </Link>
          )}
          <button onClick={toggleTheme} className="btn-ghost w-full justify-start px-3 py-1.5 text-xs">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
