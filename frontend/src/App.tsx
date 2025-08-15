import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import LandingPage from './components/auth/LandingPage';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import RedditConnect from './components/auth/RedditConnect';
import TestPage from './components/TestPage';
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
