import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrustHRLogo } from '../components/TrustHRLogo';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Scale,
  Sparkles,
  Zap,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('recruiter@trusthr.demo');
  const [password, setPassword] = useState<string>('DemoPass123!');
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'hr_admin' | 'employee'>('recruiter');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const handleQuickLogin = async (role: 'recruiter' | 'hr_admin' | 'employee') => {
    setSelectedRole(role);
    setErrorMessage(null);
    const demoEmail =
      role === 'recruiter'
        ? 'recruiter@trusthr.demo'
        : role === 'hr_admin'
        ? 'admin@trusthr.demo'
        : 'employee@trusthr.demo';
    const demoPw = 'DemoPass123!';
    setEmail(demoEmail);
    setPassword(demoPw);
    setIsSubmitting(true);
    try {
      const user = await login(demoEmail, demoPw);
      if (from && from !== '/login' && from !== '/') {
        navigate(from, { replace: true });
      } else if (user.role === 'employee') {
        navigate('/careers', { replace: true });
      } else if (user.role === 'hr_admin') {
        navigate('/approvals', { replace: true });
      } else {
        navigate('/screening', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await login(email.trim(), password);

      if (from && from !== '/login' && from !== '/') {
        navigate(from, { replace: true });
      } else if (user.role === 'employee') {
        navigate('/careers', { replace: true });
      } else if (user.role === 'hr_admin') {
        navigate('/approvals', { replace: true });
      } else {
        navigate('/screening', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Panel: Enterprise Platform Capability Showcase */}
        <div className="lg:col-span-6 p-8 sm:p-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0a0f1d] text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>

          <div className="relative space-y-6">
            <TrustHRLogo size="lg" textClassName="text-white" />

            <div className="space-y-2 pt-2">
              <span className="badge-clean text-[10px] font-mono border-indigo-500/40 text-indigo-300">
                EU AI Act Article 14 Verified HITL
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                The Verifiable Trust & Security Gateway for Autonomous HR AI.
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                TrustHR transforms ordinary ATS workflows into an audited, tamper-evident decision fortress. Agents propose candidates; authorized humans make decisions through an append-only cryptographic gateway.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Tamper-Evident SHA-256 Merkle Audit Log
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Immutable database triggers guarantee records can never be deleted or altered post-hoc.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Zero-Trust Forensic PDF Quarantine
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Intercepts prompt injection attacks, hidden zero-font payloads, and OCR steganography.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Interview Anti-AI Teleprompter Shield
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live speech latency & cadence radar detecting candidates secretly reading LLM prompts during video calls.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Argon2id Hash Encryption</span>
            <span>&bull;</span>
            <span>SameSite=Strict CSRF</span>
            <span>&bull;</span>
            <span>Zero-PII Blind Screening</span>
          </div>
        </div>

        {/* Right Panel: Authentication Form & 1-Click Role Switcher */}
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Console Sign In
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Access the TrustHR Gateway using verified enterprise credentials.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            {/* 1-Click Role Switcher Presets */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                <span>Quick Sign-In Presets:</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-[10px]">1-Click Instant Login</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin('recruiter')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === 'recruiter'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 font-medium'
                  }`}
                >
                  <div className="text-xs">Recruiter</div>
                  <div className={`text-[9px] font-mono ${selectedRole === 'recruiter' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Rania (ATS)
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin('hr_admin')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === 'hr_admin'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 font-medium'
                  }`}
                >
                  <div className="text-xs">HR Admin</div>
                  <div className={`text-[9px] font-mono ${selectedRole === 'hr_admin' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Hedi (Audit)
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin('employee')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === 'employee'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 font-medium'
                  }`}
                >
                  <div className="text-xs">Employee</div>
                  <div className={`text-[9px] font-mono ${selectedRole === 'employee' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Eya (Mobility)
                  </div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@trusthr.demo"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Argon2id Secure</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 rounded-xl shadow-md transition-transform active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Cryptographic Tokens...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access {selectedRole.toUpperCase().replace('_', ' ')} Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Demo passwords default to <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">DemoPass123!</code> for evaluator testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
