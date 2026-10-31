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
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Card */}
        <div className="p-8 bg-gradient-to-br from-slate-900 to-sky-950 text-white relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight">TrustHR AI</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/30 text-sky-200 rounded-full border border-sky-400/30">
                  Enterprise SSO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Human-Controlled Evidence-Based Hiring & Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 text-xs text-slate-300">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Argon2id Hashes
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              CSRF Protected
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              RBAC Guard
            </span>
          </div>
        </div>

        {feedback && (
          <div className="mx-8 mt-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* 1-Click Role Switcher Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              1-Click Role Switcher (Instant Demo Presets)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Recruiter */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('Recruiter')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'Recruiter'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Recruiter</span>
                  {selectedRole === 'Recruiter' && (
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Candidate ranking, inline draft edits, Action Gateway dispatch.
                </p>
              </button>

              {/* HR Admin */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('HR Admin')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'HR Admin'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">HR Admin</span>
                  {selectedRole === 'HR Admin' && (
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Cryptographic SHA-256 audit inspection & governance controls.
                </p>
              </button>

              {/* Employee */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('Employee')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedRole === 'Employee'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Employee</span>
                  {selectedRole === 'Employee' && (
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Policy Q&A chatbot with handbook source citations.
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium uppercase">
              Or Sign In With Enterprise Credentials
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Corporate Email / SSO:</label>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Passkey / Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Authorized Profile Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => handleRolePreset(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-semibold text-slate-800"
              >
                <option value="Recruiter">Recruiter (Screening & Approvals)</option>
                <option value="HR Admin">HR Admin (Audit & Compliance)</option>
                <option value="Employee">Employee (Policy Assistant)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-98"
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
