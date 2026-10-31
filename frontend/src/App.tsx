import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PitchDemoModal } from './components/PitchDemoModal';
import { HomeOverview } from './pages/HomeOverview';
import { ScreeningPage } from './pages/ScreeningPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { InboxPage } from './pages/InboxPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { AssistantPage } from './pages/AssistantPage';
import { AuditPage } from './pages/AuditPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('Recruiter');
  const [isMockMode, setIsMockMode] = useState<boolean>(api.isMockMode());
  const [isPitchDemoOpen, setIsPitchDemoOpen] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(4);
  const [securityAlertCount, setSecurityAlertCount] = useState<number>(2);
  const [inboxCount, setInboxCount] = useState<number>(3);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGlobalCounts();
  }, [isMockMode]);

  const loadGlobalCounts = async () => {
    try {
      const stats = await api.getHomeStats();
      setPendingCount(stats.pendingApprovals);
      setSecurityAlertCount(stats.securityThreatsIntercepted);
      setInboxCount(stats.inboxUnread);
    } catch (e) {
      console.error('Error fetching global counts', e);
    }
  };

  const handleToggleMockMode = () => {
    const nextMode = !isMockMode;
    api.setMockMode(nextMode);
    setIsMockMode(nextMode);
    setToastMessage(
      nextMode
        ? 'Switched to Offline Mock Mode (Zero-latency local demo dataset active).'
        : 'Switched to Live API Mode (Connected to FastAPI backend).'
    );
    setTimeout(() => setToastMessage(null), 4000);
    loadGlobalCounts();
  };

  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole);
    setToastMessage(`Switched active profile to ${newRole}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
        {/* Ambient Cybernetic Radial Lights */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
        <div className="fixed bottom-10 left-10 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none -z-10"></div>

        {/* Global Navigation Bar */}
        <Navbar
          pendingCount={pendingCount}
          securityAlertCount={securityAlertCount}
          inboxCount={inboxCount}
          userRole={userRole}
          isMockMode={isMockMode}
          onToggleMockMode={handleToggleMockMode}
          onOpenPitchDemo={() => setIsPitchDemoOpen(true)}
        />

        {/* 5-Min Interactive Pitch Mode Controller */}
        <PitchDemoModal
          isOpen={isPitchDemoOpen}
          onClose={() => setIsPitchDemoOpen(false)}
        />

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="max-w-7xl mx-auto w-full px-4 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-900/90 text-white text-xs font-medium shadow-2xl flex justify-between items-center animate-fade-in border border-sky-500/30 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                <span className="text-slate-200">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white font-bold text-xs px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomeOverview userRole={userRole} key={`home-${isMockMode}`} />} />
            <Route path="/screening" element={<ScreeningPage onDataChanged={loadGlobalCounts} key={`screening-${isMockMode}`} />} />
            <Route path="/approvals" element={<ApprovalPage onDataChanged={loadGlobalCounts} key={`approvals-${isMockMode}`} />} />
            <Route path="/inbox" element={<InboxPage key={`inbox-${isMockMode}`} />} />
            <Route path="/scheduling" element={<SchedulingPage key={`scheduling-${isMockMode}`} />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/audit" element={<AuditPage key={`audit-${isMockMode}`} />} />
            <Route
              path="/login"
              element={<LoginPage currentRole={userRole} onRoleChange={handleRoleChange} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Enterprise Compliance Footer */}
        <footer className="bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-md py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                TrustHR AI v1.0
              </span>
              <span>&bull;</span>
              <span>Defense-Grade Multi-Agent Recruitment</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-mono">EU AI Act High-Risk Compliant (Articles 10, 12, 14, 15)</span>
            </div>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Golden Principle: <strong className="text-slate-200">"The agent proposes, the human decides."</strong> Air-gapped Action Gateway prevents unauthorized outbound candidate actions.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};
