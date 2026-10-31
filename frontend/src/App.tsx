import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PitchDemoModal } from './components/PitchDemoModal';
import { HomeOverview } from './pages/HomeOverview';
import { ScreeningPage } from './pages/ScreeningPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { InboxPage } from './pages/InboxPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { AssistantPage } from './pages/AssistantPage';
import { InternalCareersPage } from './pages/InternalCareersPage';
import { AuditPage } from './pages/AuditPage';
import { AdversarialLabPage } from './pages/AdversarialLabPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './services/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Info, X, AlertTriangle } from 'lucide-react';

const AppShell: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMockMode, setIsMockMode] = useState<boolean>(api.isMockMode());
  const [isPitchDemoOpen, setIsPitchDemoOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [securityAlertCount, setSecurityAlertCount] = useState<number>(0);
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGlobalCounts();
  }, [isMockMode, user]);

  const loadGlobalCounts = async () => {
    if (!user) return;
    try {
      const stats = await api.getHomeStats();
      setPendingCount(stats.pendingApprovals);
      setSecurityAlertCount(stats.securityThreatsIntercepted);
      setInboxCount(stats.inboxUnread);
    } catch {
      // stats error handled inline
    }
  };

  const handleToggleMockMode = () => {
    const nextMode = !isMockMode;
    api.setMockMode(nextMode);
    setIsMockMode(nextMode);
    setToastMessage(
      nextMode
        ? 'Showing local sample data. Nothing is read from or sent to the backend.'
        : 'Showing live data from the backend.'
    );
    setTimeout(() => setToastMessage(null), 4000);
    loadGlobalCounts();
  };

  const currentRole = user?.role ? user.role.replace('_', ' ') : 'Guest';

  // The sign-in page stands alone: no navigation to pages a signed-out visitor cannot open.
  if (location.pathname === '/login') {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] text-slate-900 dark:text-slate-100">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Persistent Top Mock Banner when Mock Mode is active */}
      {isMockMode && (
        <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 border-b border-amber-200 dark:border-amber-500/20 lg:pl-64">
          <Info className="w-4 h-4 shrink-0" />
          <span>Sample data mode: nothing on screen comes from the backend. Switch to "Live data" in the top bar.</span>
        </div>
      )}

      {/* Collapsible / Responsive Enterprise Sidebar */}
      <Sidebar
        pendingCount={pendingCount}
        securityAlertCount={securityAlertCount}
        inboxCount={inboxCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Container (Indented on desktop for Sidebar) */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* Topbar Navigation */}
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isMockMode={isMockMode}
          onToggleMockMode={handleToggleMockMode}
          onOpenPitchDemo={() => setIsPitchDemoOpen(true)}
        />

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="max-w-7xl mx-auto w-full px-4 pt-4">
            <div role="status" className="px-4 py-3 rounded-lg bg-slate-900 text-white dark:bg-slate-800 text-sm shadow-lg flex justify-between items-center gap-3 animate-fade-in">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1 rounded" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin', 'employee']}>
                    <HomeOverview userRole={currentRole} key={`home-${isMockMode}`} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/screening"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin']}>
                    <ScreeningPage onDataChanged={loadGlobalCounts} key={`screening-${isMockMode}`} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/approvals"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin']}>
                    <ApprovalPage onDataChanged={loadGlobalCounts} key={`approvals-${isMockMode}`} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute allowedRoles={['hr_admin']}>
                    <AuditPage key={`audit-${isMockMode}`} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin']}>
                    <AdversarialLabPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inbox"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin']}>
                    <InboxPage key={`inbox-${isMockMode}`} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scheduling"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin']}>
                    <SchedulingPage key={`scheduling-${isMockMode}`} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin', 'employee']}>
                    <AssistantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/careers"
                element={
                  <ProtectedRoute allowedRoles={['recruiter', 'hr_admin', 'employee']}>
                    <InternalCareersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>TrustHR · fictional data only</span>
            <span>The agent proposes, a person decides.</span>
          </div>
        </footer>
      </div>

      {/* 5-Min Interactive Pitch Mode Controller */}
      <PitchDemoModal
        isOpen={isPitchDemoOpen}
        onClose={() => setIsPitchDemoOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};
