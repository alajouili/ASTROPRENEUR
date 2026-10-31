import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldAlert,
  User,
  CheckCircle,
} from 'lucide-react';

interface LoginPageProps {
  currentRole: string;
  onRoleChange: (newRole: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ currentRole, onRoleChange }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [username, setUsername] = useState<string>('sarah.recruiter@trusthr.ai');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRolePreset = (role: 'Recruiter' | 'HR Admin' | 'Employee') => {
    setSelectedRole(role);
    if (role === 'Recruiter') {
      setUsername('sarah.recruiter@trusthr.ai');
    } else if (role === 'HR Admin') {
      setUsername('claire.compliance@trusthr.ai');
    } else {
      setUsername('mehdi.employee@trusthr.ai');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRoleChange(selectedRole);
    setFeedback(`Authenticated as ${selectedRole}! Redirecting...`);
    setTimeout(() => {
      if (selectedRole === 'Employee') {
        navigate('/assistant');
      } else {
        navigate('/');
      }
    }, 600);
  };

  const handleQuickSwitch = (role: 'Recruiter' | 'HR Admin' | 'Employee') => {
    setSelectedRole(role);
    onRoleChange(role);
    setFeedback(`Switched active role to ${role}!`);
    setTimeout(() => {
      if (role === 'Employee') {
        navigate('/assistant');
      } else {
        navigate('/');
      }
    }, 500);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg surface-card overflow-hidden shadow-lg">
        {/* Top Header Card */}
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">TrustHR<span className="text-indigo-600">.ai</span></span>
                <span className="badge-info font-mono text-[10px]">
                  Enterprise SSO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Human-Controlled Evidence-Based Hiring Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Argon2id Hashes
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              CSRF Protected
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              RBAC Guard
            </span>
          </div>
        </div>

        {feedback && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="p-6 sm:p-7 space-y-5">
          {/* 1-Click Role Switcher Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
              1-Click Role Switcher (Instant Demo Presets)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Recruiter */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('Recruiter')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedRole === 'Recruiter'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Recruiter</span>
                  {selectedRole === 'Recruiter' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Candidate ranking, inline draft edits, Action Gateway.
                </p>
              </button>

              {/* HR Admin */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('HR Admin')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedRole === 'HR Admin'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">HR Admin</span>
                  {selectedRole === 'HR Admin' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Cryptographic SHA-256 audit inspection & governance.
                </p>
              </button>

              {/* Employee */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('Employee')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedRole === 'Employee'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Employee</span>
                  {selectedRole === 'Employee' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Policy Q&A chatbot with handbook citations.
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono uppercase">
              Or Sign In With Enterprise SSO
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Corporate Email / SSO:</label>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-base font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Passkey / Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Authorized Profile Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => handleRolePreset(e.target.value as any)}
                className="input-base font-semibold"
              >
                <option value="Recruiter">Recruiter (Screening & Approvals)</option>
                <option value="HR Admin">HR Admin (Audit & Compliance)</option>
                <option value="Employee">Employee (Policy Assistant)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5"
            >
              <span>Sign In as {selectedRole}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};