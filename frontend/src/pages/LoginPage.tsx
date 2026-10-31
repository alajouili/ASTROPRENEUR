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
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in text-slate-100">
      <div className="w-full max-w-xl bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        {/* Top Header Card */}
        <div className="p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white relative border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight">TrustHR<span className="text-sky-400">.ai</span></span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-sky-500/20 text-sky-300 rounded-full border border-sky-400/30">
                  Enterprise SSO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Human-Controlled Evidence-Based Hiring & Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              Argon2id Hashes
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              CSRF Protected
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
              <UserCheck className="w-3.5 h-3.5" />
              RBAC Guard
            </span>
          </div>
        </div>

        {feedback && (
          <div className="mx-8 mt-6 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* 1-Click Role Switcher Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">
              1-Click Role Switcher (Instant Live Hackathon Demo)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Recruiter */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('Recruiter')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedRole === 'Recruiter'
                    ? 'border-sky-500/50 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Recruiter</span>
                  {selectedRole === 'Recruiter' && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Candidate ranking, inline draft edits, Action Gateway dispatch.
                </p>
              </button>

              {/* HR Admin */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('HR Admin')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedRole === 'HR Admin'
                    ? 'border-emerald-500/50 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">HR Admin</span>
                  {selectedRole === 'HR Admin' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Cryptographic SHA-256 audit inspection & governance controls.
                </p>
              </button>

              {/* Employee */}
              <button
                type="button"
                onClick={() => handleQuickSwitch('Employee')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedRole === 'Employee'
                    ? 'border-purple-500/50 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Employee</span>
                  {selectedRole === 'Employee' && (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Policy Q&A chatbot with handbook source citations.
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-mono uppercase">
              Or Sign In With Enterprise Credentials
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Corporate Email / SSO:</label>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Passkey / Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Authorized Profile Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => handleRolePreset(e.target.value as any)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-white"
              >
                <option value="Recruiter">Recruiter (Screening & Approvals)</option>
                <option value="HR Admin">HR Admin (Audit & Compliance)</option>
                <option value="Employee">Employee (Policy Assistant)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_-3px_rgba(14,165,233,0.4)] transition-all flex items-center justify-center gap-2 transform active:scale-98"
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