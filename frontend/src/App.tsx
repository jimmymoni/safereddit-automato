import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import LandingPage from './components/auth/LandingPage';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import RedditConnect from './components/auth/RedditConnect';
import TestPage from './components/TestPage';
import RedditScholar from './components/RedditScholar';
import ThreadPlatform from './components/ThreadPlatform';
import OpportunityCardDemo from './components/OpportunityCardDemo';
import ColorSystemDemo from './components/ColorSystemDemo';
import RedditIntelligenceDashboard from './components/RedditIntelligenceDashboard';
import NotionRedditDashboard from './components/NotionRedditDashboard';
import MultiProjectDashboard from './components/MultiProjectDashboard';
import AutomationDashboard from './components/AutomationDashboard';
import RedditCoPilot from './components/RedditCoPilot';
import OnboardingFlow from './components/OnboardingFlow';
import { SavedOpportunities } from './components/SavedOpportunities';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-reddit-bg font-reddit">
          <Router>
            <Routes>
              {/* Test route */}
              <Route path="/test" element={<TestPage />} />
              
              {/* Opportunity Cards Demo */}
              <Route path="/cards" element={<OpportunityCardDemo />} />
              
              {/* Color System Demo */}
              <Route path="/colors" element={<ColorSystemDemo />} />
              
              {/* Reddit Scholar */}
              <Route path="/scholar" element={<RedditScholar />} />
              
              {/* Thread Platform */}
              <Route path="/threads" element={<ThreadPlatform />} />
              
              {/* Reddit Intelligence Dashboard */}
              <Route path="/intelligence" element={<RedditIntelligenceDashboard />} />
              
              {/* New Notion+Reddit Dashboard */}
              <Route path="/notion-reddit" element={<NotionRedditDashboard />} />
              
              {/* Multi-Project Dashboard */}
              <Route path="/multi-project" element={<MultiProjectDashboard />} />
              
              {/* Automation Dashboard */}
              <Route path="/automation" element={<AutomationDashboard />} />
              
              {/* Reddit Co-Pilot */}
              <Route path="/copilot" element={<RedditCoPilot />} />
              
              {/* Onboarding Flow */}
              <Route path="/onboarding" element={<OnboardingFlow />} />
              
              {/* Saved Opportunities */}
              <Route path="/saved" element={<SavedOpportunities />} />
              
              {/* Auth Flow */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/reddit-connect" element={<RedditConnect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Redirect unknown routes to test page */}
              <Route path="*" element={<Navigate to="/test" replace />} />
            </Routes>
          </Router>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
