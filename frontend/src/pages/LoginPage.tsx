import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('recruiter@trusthr.demo');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const signIn = async (emailValue: string, passwordValue: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await login(emailValue.trim(), passwordValue);
      if (user.role === 'employee') {
        navigate('/assistant', { replace: true });
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
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
    await signIn(email, password);
  };

  // One-click demo sign-in (Member 3's presets). Only when a demo password is supplied at build
  // time (VITE_DEMO_PASSWORD); otherwise the buttons only fill the email, and no password ships.
  const demoPassword: string = (import.meta as any).env?.VITE_DEMO_PASSWORD || '';
  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setErrorMessage(null);
    if (demoPassword) {
      setPassword(demoPassword);
      signIn(demoEmail, demoPassword);
    }
  };

  const demoAccounts = [
    { label: 'Recruiter', email: 'recruiter@trusthr.demo' },
    { label: 'HR Admin', email: 'admin@trusthr.demo' },
    { label: 'Employee', email: 'employee@trusthr.demo' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* Brand panel (desktop) */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TrustHR</span>
        </div>
        <div className="max-w-md space-y-5">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            AI does the paperwork.<br />People make the decisions.
          </h2>
          <ul className="space-y-3 text-sm text-slate-300">
            {[
              'Every score is backed by a quote verified against the CV.',
              'Hidden text and prompt injection are removed before analysis.',
              'Nothing is sent or recorded until a person approves it.',
              'Every action is written to a tamper-evident audit trail.',
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <Lock className="w-4 h-4 mt-0.5 shrink-0 text-indigo-300" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">Hackathon prototype · all people and data are fictional</p>
      </aside>

      {/* Sign-in form */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TrustHR</span>
          </div>

          <h1 className="page-title">Sign in</h1>
          <p className="page-subtitle mb-8">Use your TrustHR account.</p>

          {errorMessage && (
            <div role="alert" className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@trusthr.demo"
                  className="input-base pl-9 py-2.5"
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input-base pl-9 py-2.5"
                />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{demoPassword ? 'Demo accounts (one-click sign-in)' : 'Demo accounts (fills the email)'}</div>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickFill(account.email)}
                  className={`btn-secondary px-2 py-1.5 text-xs ${email === account.email ? 'ring-2 ring-indigo-500/30 border-indigo-400' : ''}`}
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Passwords are set when the demo is seeded (<code className="font-mono">SEED_*_PASSWORD</code>) or printed once by the seed script.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
