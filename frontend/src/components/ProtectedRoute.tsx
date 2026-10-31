import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'recruiter' | 'hr_admin' | 'employee'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500 font-mono">Verifying authentication session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto my-12 surface-card p-6 text-center border-rose-200 dark:border-rose-900/40">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Access Restricted (403 Forbidden)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Your current account role is <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user.role}</span>.
          This section requires permissions reserved for <span className="font-mono text-indigo-600 dark:text-indigo-400">{allowedRoles.join(', ')}</span>.
        </p>
        <div className="mt-5">
          <a
            href="/"
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
