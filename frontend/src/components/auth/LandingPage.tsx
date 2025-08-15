import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-reddit-primary to-reddit-accent flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center text-white">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6">
            SafeReddit Automator
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Organic Reddit growth automation with AI-powered content generation.
            Follow Reddit TOS and grow your presence safely.
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Content Generation</h3>
              <p className="opacity-80">Smart content creation with Kimi AI for engaging posts and comments</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Smart Automation</h3>
              <p className="opacity-80">TOS-compliant posting with safety delays and rate limiting</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="opacity-80">Real-time opportunity detection and performance tracking</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            to="/signup"
            className="block w-full sm:w-auto bg-white text-reddit-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            to="/signin"
            className="block w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="opacity-70">
            100% Reddit TOS compliant • Max 100 API calls/min • 1 post per 10-15 mins per subreddit
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;