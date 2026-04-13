/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from './components/AuthContext';
import Navbar from './components/Navbar';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import IdeaHub from './pages/IdeaHub';
import Profile from './pages/Profile';
import CreateIdea from './pages/CreateIdea';
import IdeaDetail from './pages/IdeaDetail';
import TeamSpace from './pages/TeamSpace';
import Messages from './pages/Messages';
import DiscoverFounders from './pages/DiscoverFounders';
import LearningHub from './pages/LearningHub';
import Workspace from './pages/Workspace';
import Funding from './pages/Funding';
import InvestorHub from './pages/InvestorHub';
import IdeaValidation from './pages/IdeaValidation';

function AppRoutes() {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkAiHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (!data.aiReady) {
          toast.warning("Gemini API Key Missing", {
            description: "AI features like Idea Validation and Co-founder Matching require an API key. Please add GEMINI_API_KEY to your environment variables in Settings.",
            duration: 10000,
          });
        }
      } catch (e) {
        console.error("Health check failed:", e);
      }
    };
    checkAiHealth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f1] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#903f00] rounded-full"></div>
          <p className="text-[#1f1b12] font-bold">Forging your experience...</p>
        </div>
      </div>
    );
  }

  // Redirect to onboarding if not completed
  if (user && !userData?.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/create-idea') ||
                          location.pathname.startsWith('/hub') ||
                          location.pathname.startsWith('/messages') ||
                          location.pathname.startsWith('/profile') ||
                          location.pathname.startsWith('/idea') ||
                          location.pathname.startsWith('/investor-hub') ||
                          location.pathname.startsWith('/validate') ||
                          location.pathname.startsWith('/learning') ||
                          location.pathname.startsWith('/founders');

  const showNavbar = !user || !isDashboardRoute;

  return (
    <div className="min-h-screen bg-[#fff8f1] text-[#1f1b12] font-sans">
      <Navbar />
      <main className={showNavbar ? "pt-20" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/hub" element={user ? <IdeaHub /> : <Navigate to="/login" />} />
          <Route path="/founders" element={user ? <DiscoverFounders /> : <Navigate to="/login" />} />
          <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/create-idea" element={user ? <CreateIdea /> : <Navigate to="/login" />} />
          <Route path="/idea/:ideaId" element={user ? <IdeaDetail /> : <Navigate to="/login" />} />
          <Route path="/idea/:ideaId/team" element={user ? <TeamSpace /> : <Navigate to="/login" />} />
          <Route path="/idea/:ideaId/workspace" element={user ? <Workspace /> : <Navigate to="/login" />} />
          <Route path="/idea/:ideaId/funding" element={user ? <Funding /> : <Navigate to="/login" />} />
          <Route path="/investor-hub" element={user ? <InvestorHub /> : <Navigate to="/login" />} />
          <Route path="/validate" element={user ? <IdeaValidation /> : <Navigate to="/login" />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/learning" element={user ? <LearningHub /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

