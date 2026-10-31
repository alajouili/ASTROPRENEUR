import React from 'react';
import { ShieldCheck, UserCheck, Lock, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'candidates' | 'approvals' | 'audit';
  setActiveTab: (tab: 'candidates' | 'approvals' | 'audit') => void;
  pendingCount: number;
  securityAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  securityAlertCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-sky-600 text-white p-2 rounded-lg shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">TrustHR AI</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-sky-100 text-sky-800 rounded-full">
                  v1.0 Hackathon
                </span>
              </div>
              <p className="text-xs text-slate-500">Human-Controlled Evidence-Based Hiring</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'candidates'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Candidates & Ranking
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                activeTab === 'approvals'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Human Approval Queue</span>
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                activeTab === 'audit'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Security & Audit Trail</span>
              {securityAlertCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                  {securityAlertCount}
                </span>
              )}
            </button>
          </nav>

          {/* Security & Human Governance Badges */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Human In The Loop</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Evidence-Verified</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
