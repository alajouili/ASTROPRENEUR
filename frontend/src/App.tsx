import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { AuditPage } from './pages/AuditPage';
import { AdversarialLabPage } from './pages/AdversarialLabPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './services/api';
import { AlertTriangle } from 'lucide-react';

const AppShell: React.FC = () => {
  const { user } = useAuth();
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
        ? 'Switched to Demo Simulation Dataset.'
        : 'Switched to Live FastAPI Backend Gateway.'
    );
    setTimeout(() => setToastMessage(null), 4000);
    loadGlobalCounts();
  };

  const currentRole = user?.role ? user.role.replace('_', ' ') : 'Guest';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Persistent Top Mock Banner when Mock Mode is active */}
      {isMockMode && (
        <div className="bg-amber-400 dark:bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 shadow-sm border-b border-amber-600 sticky top-0 z-50">
          <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
          <span>MOCK DATA — not from the backend (Demo Simulation Mode Active)</span>
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
            <div className="p-3 rounded-lg bg-slate-900 text-white dark:bg-slate-800 text-xs font-medium shadow-md flex justify-between items-center border border-slate-700 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white font-bold text-xs px-2 py-0.5 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Enterprise Compliance Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-5 bg-white dark:bg-slate-900 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 font-medium">
              <span className="font-semibold text-slate-800 dark:text-slate-200">TrustHR AI</span>
              <span>&bull;</span>
              <span>Human-Controlled Recruitment Gateway</span>
              <span>&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">EU AI Act Art. 14 HITL</span>
            </div>
            <div>
              Principle: <em>"The agent proposes, the human decides."</em>
            </div>
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
