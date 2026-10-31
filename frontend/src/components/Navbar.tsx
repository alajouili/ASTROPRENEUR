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
  Sparkles,
  Zap,
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
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-400 text-white p-2.5 rounded-xl shadow-[0_0_20px_-3px_rgba(14,165,233,0.5)] group-hover:scale-105 transition-all">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-sky-300 transition-colors">
                  TrustHR<span className="text-sky-400">.ai</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                  DEFENSE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Human-Controlled Hiring Gateway
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex space-x-1 items-center text-xs font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              Overview
            </NavLink>

            <NavLink
              to="/screening"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              Screening
            </NavLink>

            <NavLink
              to="/approvals"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-all relative flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <span>Approvals</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black bg-amber-400 text-slate-950 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                  {pendingCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-all relative flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
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
                `px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              Scheduling
            </NavLink>

            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-400 font-semibold border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              Policy Bot
            </NavLink>

            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-all relative flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <span>Audit Trail</span>
              {securityAlertCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {securityAlertCount}
                </span>
              )}
            </NavLink>
          </nav>

          {/* Right Controls: Pitch Mode, Mock/Live Switch & Role Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 5-Min Pitch Demo Button */}
            {onOpenPitchDemo && (
              <button
                onClick={onOpenPitchDemo}
                className="relative group overflow-hidden flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] border border-indigo-400/30 transition-all transform active:scale-95"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="hidden sm:inline tracking-wide font-extrabold">🚀 5-Min Pitch Mode</span>
                <span className="sm:hidden font-mono">Pitch</span>
              </button>
            )}

            {/* Mock Data / Live API Switch */}
            <button
              onClick={onToggleMockMode}
              title="Click to toggle between Mock Data and Live FastAPI backend"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isMockMode
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isMockMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Mock Data</span>
                  <span className="sm:hidden">Mock</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Live API</span>
                  <span className="sm:hidden">Live</span>
                </>
              )}
            </button>

            {/* Role Indicator Pill & Login Link */}
            <Link
              to="/login"
              title="Click to switch role or view credentials"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-sky-500/40 transition-all"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>{userRole}</span>
            </Link>

            {/* Human-in-the-loop Air-Gap badge */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AIR-GAPPED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Secondary Subnav */}
      <div className="xl:hidden bg-slate-950/95 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between overflow-x-auto space-x-2 text-xs">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/screening"
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Screening
        </NavLink>
        <NavLink
          to="/approvals"
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Approvals ({pendingCount})
        </NavLink>
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Inbox
        </NavLink>
        <NavLink
          to="/scheduling"
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Scheduling
        </NavLink>
        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Policy Bot
        </NavLink>
        <NavLink
          to="/audit"
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg ${isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`
          }
        >
          Audit
        </NavLink>
      </div>
    </header>
  );
};