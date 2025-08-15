import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const RedditConnect: React.FC = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [redditUser, setRedditUser] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we're returning from a successful Reddit OAuth
    const success = searchParams.get('success');
    const username = searchParams.get('username');
    const karma = searchParams.get('karma');
    console.log('Karma from OAuth:', karma); // Use karma to avoid lint warning
    
    if (success === 'true' && username) {
      setConnected(true);
      setRedditUser(`u/${username}`);
      setConnecting(false);
    }
  }, [searchParams]);

  const handleConnectReddit = async () => {
    setConnecting(true);
    
    try {
      // First get the Reddit OAuth URL from backend with credentials to maintain session
      const response = await fetch('http://localhost:8000/api/auth/reddit', {
        method: 'GET',
        credentials: 'include', // Include cookies for session management
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Reddit for OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.message || 'Failed to get Reddit auth URL');
      }
    } catch (error) {
      console.error('Failed to connect Reddit:', error);
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    // Navigate to dashboard
    window.location.href = '/dashboard';
  };

  const handleSkip = () => {
    // Navigate to dashboard without Reddit connection
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-reddit-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-reddit-primary text-3xl font-bold">
            SafeReddit Automator
          </Link>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">
            Connect Your Reddit Account
          </h2>
          <p className="mt-2 text-gray-600">
            Link your Reddit account to start automating your growth
          </p>
        </div>

        {/* Connection Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {!connected ? (
            <>
              {/* Reddit Logo and Info */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-reddit-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Connect Reddit?
                </h3>
                <p className="text-gray-600">
                  We'll request these permissions to automate your Reddit activity safely:
                </p>
              </div>

              {/* Permissions List */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Read your identity</p>
                    <p className="text-xs text-gray-500">Get your username and basic profile info</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submit posts and comments</p>
                    <p className="text-xs text-gray-500">Create AI-generated content safely</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vote and interact</p>
                    <p className="text-xs text-gray-500">Upvote and engage with relevant content</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Read subreddits and posts</p>
                    <p className="text-xs text-gray-500">Analyze trends and find opportunities</p>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">100% Reddit TOS Compliant</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      We respect rate limits (max 100 API calls/min) and maintain safe delays between posts (1 per 10-15 mins per subreddit)
                    </p>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <button
                onClick={handleConnectReddit}
                disabled={connecting}
                className="w-full bg-reddit-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-reddit-primary/90 focus:ring-2 focus:ring-reddit-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {connecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting to Reddit...
                  </>
                ) : (
                  'Connect Reddit Account'
                )}
              </button>

              {/* Skip Option */}
              <button
                onClick={handleSkip}
                className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
              >
                Skip for now (you can connect later)
              </button>
            </>
          ) : (
            /* Connected State */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Successfully Connected!
              </h3>
              <p className="text-gray-600 mb-4">
                Your Reddit account {redditUser} is now connected and ready for automation.
              </p>
              <button
                onClick={handleContinue}
                className="w-full bg-reddit-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-reddit-primary/90"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedditConnect;