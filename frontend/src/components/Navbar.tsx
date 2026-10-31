import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Users,
  CheckCircle2,
  Mail,
  Calendar,
  Bot,
  Database,
  Radio,
  Wifi,
  WifiOff,
  User,
} from 'lucide-react';

interface NavbarProps {
  pendingCount: number;
  securityAlertCount: number;
  inboxCount: number;
  userRole: string;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onOpenPitchDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pendingCount,
  securityAlertCount,
  inboxCount,
  userRole,
  isMockMode,
  onToggleMockMode,
  onOpenPitchDemo,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="bg-sky-600 text-white p-2 rounded-xl shadow-xs group-hover:bg-sky-500 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">TrustHR AI</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Human-Controlled Hiring Gateway
              </p>
            </div>
          </Link>

          {/* Nav Links for All Screens */}
          <nav className="hidden xl:flex space-x-1 items-center text-xs font-semibold">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              Overview
            </NavLink>

            <NavLink
              to="/screening"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              Screening
            </NavLink>

            <NavLink
              to="/approvals"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors relative flex items-center gap-1 ${
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span>Approvals</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors relative flex items-center gap-1 ${
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span>Inbox</span>
              {inboxCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                  {inboxCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/scheduling"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              Scheduling
            </NavLink>

            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              Policy Bot
            </NavLink>

            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg transition-colors relative flex items-center gap-1 ${
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span>Audit Trail</span>
              {securityAlertCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                  {securityAlertCount}
                </span>
              )}
            </NavLink>
          </nav>

          {/* Right Global Controls: Pitch Mode, Mock/Live Switch & Role Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 5-Min Pitch Demo Button */}
            {onOpenPitchDemo && (
              <button
                onClick={onOpenPitchDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm transition-all transform active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="hidden sm:inline">🚀 5-Min Pitch Mode</span>
                <span className="sm:hidden font-mono">Pitch</span>
              </button>
            )}

            {/* Mock Data / Live API Switch */}
            <button
              onClick={onToggleMockMode}
              title="Click to toggle between Mock Data and Live FastAPI backend"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isMockMode
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isMockMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Mock Data (Offline)</span>
                  <span className="sm:hidden">Mock</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="hidden sm:inline">Live API (FastAPI)</span>
                  <span className="sm:hidden">Live</span>
                </>
              )}
            </button>

            {/* Role Indicator Pill & Login Link */}
            <Link
              to="/login"
              title="Click to switch role or view credentials"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{userRole}</span>
            </Link>

            {/* Human in the loop badge */}
            <div className="hidden 2xl:flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <UserCheck className="w-3 h-3" />
              <span>HITL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Compact Secondary Subnav */}
      <div className="xl:hidden bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between overflow-x-auto space-x-2 text-xs">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/screening"
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Screening
        </NavLink>
        <NavLink
          to="/approvals"
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Approvals ({pendingCount})
        </NavLink>
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Inbox
        </NavLink>
        <NavLink
          to="/scheduling"
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Scheduling
        </NavLink>
        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Policy Bot
        </NavLink>
        <NavLink
          to="/audit"
          className={({ isActive }) =>
            `px-2 py-1 rounded ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-600'}`
          }
        >
          Audit
        </NavLink>
      </div>
    </header>
  );
};
