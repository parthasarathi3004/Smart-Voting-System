import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HelpDeskModal from './components/HelpDeskModal';

import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VoterRegistration from './pages/VoterRegistration';
import CandidateManagement from './pages/CandidateManagement';
import ExecutiveAnalytics from './pages/ExecutiveAnalytics';
import VoterBooth from './pages/VoterBooth';

// Session Guard: Whenever the user leaves the admin workspace routes, IMMEDIATELY wipe admin session
function AdminSessionGuard() {
  const location = useLocation();

  useEffect(() => {
    // Only these routes constitute the authorized admin workspace
    const isAdminWorkspace = 
      location.pathname.startsWith('/admin/dashboard') ||
      location.pathname.startsWith('/admin/register-voter') ||
      location.pathname.startsWith('/admin/candidates');

    // If navigated away from admin workspace, invalidate session immediately so password is required next time!
    if (!isAdminWorkspace) {
      sessionStorage.removeItem('activeAdminSession');
      sessionStorage.removeItem('adminSession');
      localStorage.removeItem('adminSession');
    }
  }, [location.pathname]);

  // Invalidate session if window/tab is closed or refreshed
  useEffect(() => {
    const handleExit = () => {
      sessionStorage.removeItem('activeAdminSession');
      sessionStorage.removeItem('adminSession');
      localStorage.removeItem('adminSession');
    };
    window.addEventListener('beforeunload', handleExit);
    return () => window.removeEventListener('beforeunload', handleExit);
  }, []);

  return null;
}

// Route protector for admin paths: strictly checks active officer session
function ProtectedAdminRoute({ children }) {
  const sessionStr = sessionStorage.getItem('activeAdminSession');
  let isValid = false;
  try {
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.success && session.token && session.user?.username === 'parthasarathi') {
        isValid = true;
      }
    }
  } catch {
    isValid = false;
  }

  if (!isValid) {
    sessionStorage.removeItem('activeAdminSession');
    sessionStorage.removeItem('adminSession');
    localStorage.removeItem('adminSession');
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}


export default function App() {
  return (
    <BrowserRouter>
      {/* Real-time Session Guard: wipes admin session whenever leaving workspace */}
      <AdminSessionGuard />

      <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col font-sans">
        {/* Sticky Parallax Glass Header */}
        <Navbar />

        {/* Dynamic Route Content */}
        <main className="flex-1">
          <Routes>
            {/* Landing & Role Separation */}
            <Route path="/" element={<LandingPage />} />

            {/* Voter Portal & Biometric Booth */}
            <Route path="/voter" element={<VoterBooth />} />

            {/* Admin Base & Authentication */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />


            {/* Admin Workspace */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />

            {/* Admin Submodule: Voter Registration */}
            <Route 
              path="/admin/register-voter" 
              element={
                <ProtectedAdminRoute>
                  <VoterRegistration />
                </ProtectedAdminRoute>
              } 
            />

            {/* Admin Submodule: Candidate Management & Config */}
            <Route 
              path="/admin/candidates" 
              element={
                <ProtectedAdminRoute>
                  <CandidateManagement />
                </ProtectedAdminRoute>
              } 
            />

            {/* Executive Analytics Dashboard */}
            <Route 
              path="/admin/analytics" 
              element={<ExecutiveAnalytics />} 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Floating Action Help Desk Button */}
        <HelpDeskModal />
      </div>
    </BrowserRouter>
  );
}
