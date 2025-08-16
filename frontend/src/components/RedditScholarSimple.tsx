import React, { useState, useEffect } from 'react';
import { useRedditUser } from '../hooks/useRedditUser';
import AICopilot from './AICopilot';
import ActivityTransparency from './ActivityTransparency';

interface AutomationPlan {
  targetSubreddits: string[];
  contentStrategy: string;
  postingSchedule: string;
  engagementPlan: string;
  safetyMeasures: string[];
}

interface ScholarStatus {
  isActive: boolean;
  status: 'idle' | 'analyzing' | 'setting_up' | 'active' | 'paused';
  progress: number;
  todayActions: number;
  healthScore: number;
}

type ViewMode = 'setup' | 'copilot' | 'activity';

const RedditScholarSimple: React.FC = () => {
  const { redditUser } = useRedditUser();
  const [userStory, setUserStory] = useState('');
  const [automationPlan, setAutomationPlan] = useState<AutomationPlan | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('setup');
  const [scholarStatus, setScholarStatus] = useState<ScholarStatus>({
    isActive: false,
    status: 'idle',
    progress: 0,
    todayActions: 0,
    healthScore: 100
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('reddit_auth_token='))
      ?.split('=')[1];
  };

  // API call helper
  const apiCall = async (endpoint: string, method: string = 'GET', data?: any) => {
    const token = getAuthToken();
    const response = await fetch(`http://localhost:8000/api${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Analyze user story and generate automation plan
  const analyzeStoryAndStart = async () => {
    if (!userStory.trim()) {
      setError('Please share your story first');
      return;
    }

    if (!redditUser.connected) {
      setError('Please connect your Reddit account first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setScholarStatus(prev => ({ ...prev, status: 'analyzing', progress: 20 }));

    try {
      // Step 1: Analyze story and generate automation plan
      const analysisResponse = await apiCall('/scholar/analyze-story', 'POST', {
        story: userStory,
        userProfile: {
          username: redditUser.redditUsername,
          karma: redditUser.postKarma + redditUser.commentKarma,
          accountHealth: redditUser.accountHealth
        }
      });

      if (analysisResponse.success) {
        setAutomationPlan(analysisResponse.data.plan);
        setScholarStatus(prev => ({ ...prev, progress: 60 }));

        // Step 2: Initialize automation with the generated plan
        setScholarStatus(prev => ({ ...prev, status: 'setting_up', progress: 80 }));
        
        const startResponse = await apiCall('/scholar/start-automation', 'POST', {
          story: userStory,
          plan: analysisResponse.data.plan,
          settings: {
            // Rulebook-compliant defaults
            maxPostsPerWeek: 3,
            maxCommentsPerDay: 8,
            engagementRatio: 0.9, // 90% non-promotional content
            safetyChecks: true,
            humanLikeDelays: true,
            respectSubredditRules: true
          }
        });

        if (startResponse.success) {
          setScholarStatus({
            isActive: true,
            status: 'active',
            progress: 100,
            todayActions: 0,
            healthScore: 100
          });
          // Automatically switch to co-pilot view once automation starts
          setCurrentView('copilot');
        }
      }
    } catch (error) {
      console.error('Error starting automation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start automation');
      setScholarStatus(prev => ({ ...prev, status: 'idle', progress: 0 }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Pause/Resume automation
  const toggleAutomation = async () => {
    try {
      if (scholarStatus.isActive) {
        await apiCall('/scholar/pause', 'POST');
        setScholarStatus(prev => ({ ...prev, status: 'paused' }));
      } else {
        await apiCall('/scholar/resume', 'POST');
        setScholarStatus(prev => ({ ...prev, status: 'active' }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle automation');
    }
  };

  // Emergency stop automation
  const emergencyStop = async () => {
    try {
      setIsAnalyzing(true);
      
      // Try both authenticated and test endpoints
      try {
        await apiCall('/scholar/emergency-stop', 'POST');
      } catch (authError) {
        // Fallback to test endpoint if auth fails
        await fetch('http://localhost:8000/api/scholar/test-emergency-stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      setScholarStatus({
        isActive: false,
        status: 'idle',
        progress: 0,
        todayActions: 0,
        healthScore: 100
      });
      setAutomationPlan(null);
      setUserStory('');
      setCurrentView('setup');
      setError(null);
      alert('✅ Automation stopped successfully! All activities have been halted.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to stop automation');
      alert('❌ Failed to stop automation. Please try again or contact support.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch current status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      if (!redditUser.connected) return;
      
      try {
        const response = await apiCall('/scholar/status');
        if (response.success) {
          setScholarStatus(response.data.status);
          setAutomationPlan(response.data.plan);
        }
      } catch (error) {
        // Ignore errors on initial load
      }
    };

    fetchStatus();
  }, [redditUser.connected]);

  const getStatusMessage = () => {
    switch (scholarStatus.status) {
      case 'analyzing': return 'Analyzing your story...';
      case 'setting_up': return 'Setting up automation...';
      case 'active': return 'Growing your Reddit presence';
      case 'paused': return 'Automation paused';
      default: return 'Ready to start';
    }
  };

  const getProgressColor = () => {
    if (scholarStatus.healthScore >= 80) return 'bg-green-500';
    if (scholarStatus.healthScore >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Slim Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-reddit-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🧠</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-reddit-dark">Reddit Scholar Autopilot</h1>
          </div>
        </div>
        
        {/* View Switcher */}
        {automationPlan && (
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'setup', label: 'Setup', icon: '⚙️' },
              { id: 'copilot', label: 'AI Co-pilot', icon: '🧠' },
              { id: 'activity', label: 'Activity Log', icon: '📊' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as ViewMode)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                  currentView === view.id
                    ? 'bg-white text-reddit-primary shadow-sm'
                    : 'text-reddit-gray hover:text-reddit-dark'
                }`}
              >
                <span>{view.icon}</span>
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reddit Connection Check */}
      {!redditUser.connected && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-orange-600 text-2xl">🔗</span>
            <div className="flex-1">
              <h3 className="font-medium text-orange-800 mb-2">Connect Reddit Account</h3>
              <p className="text-sm text-orange-700 mb-4">
                Connect your Reddit account to start growing your presence safely and authentically.
              </p>
              <button 
                onClick={() => window.location.href = '/reddit-connect'}
                className="bg-reddit-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-reddit-primary/90 transition-colors"
              >
                Connect Reddit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentView === 'setup' && (
        <div className="bg-white rounded-xl border border-reddit-border p-6 mb-6">
          {!automationPlan ? (
          // Initial Story Input
          <div>
            <div className="mb-4">
              <label className="block text-lg font-medium text-reddit-dark mb-2">
                What's your story?
              </label>
              <p className="text-sm text-reddit-gray mb-3">
                Tell your story. We'll handle the rest. Be specific about your project, challenges, and goals.
              </p>
              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="What are you building? What's your challenge? What do you want to achieve?

e.g., 'I'm building a recruitment app, 50% done, struggling with visibility, I want more sign-ups and feedback from potential users.'"
                className="w-full h-40 p-4 border border-reddit-border rounded-lg resize-none focus:ring-2 focus:ring-reddit-primary focus:border-transparent text-base"
                disabled={isAnalyzing}
              />
            </div>

            <button
              onClick={analyzeStoryAndStart}
              disabled={isAnalyzing || !userStory.trim() || !redditUser.connected}
              className="w-full bg-reddit-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-reddit-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing your story...</span>
                </div>
              ) : (
                '🚀 Start Reddit Growth'
              )}
            </button>
          </div>
        ) : (
          // Automation Plan & Status
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-reddit-dark">Your Growth Plan</h2>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getProgressColor()} ${scholarStatus.status === 'active' ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm font-medium text-reddit-gray">
                  {getStatusMessage()}
                </span>
              </div>
            </div>

            {/* Plan Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-reddit-dark mb-2">🎯 Target Communities</h3>
                  <div className="flex flex-wrap gap-2">
                    {automationPlan.targetSubreddits.map((sub, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        r/{sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-reddit-dark mb-2">📅 Posting Schedule</h3>
                  <p className="text-sm text-reddit-gray">{automationPlan.postingSchedule}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-reddit-dark mb-2">💬 Engagement Strategy</h3>
                  <p className="text-sm text-reddit-gray">{automationPlan.engagementPlan}</p>
                </div>

                <div>
                  <h3 className="font-medium text-reddit-dark mb-2">📊 Today's Progress</h3>
                  <div className="text-2xl font-bold text-green-600">{scholarStatus.todayActions}</div>
                  <div className="text-xs text-reddit-gray">Quality interactions</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {scholarStatus.status !== 'idle' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-reddit-dark">Setup Progress</span>
                  <span className="text-sm text-reddit-gray">{scholarStatus.progress}%</span>
                </div>
                <div className="w-full bg-reddit-bg rounded-full h-2">
                  <div 
                    className="bg-reddit-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${scholarStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="space-y-3">
              <div className="flex space-x-4">
                <button
                  onClick={toggleAutomation}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    scholarStatus.isActive && scholarStatus.status !== 'paused'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-reddit-primary text-white hover:bg-reddit-primary/90'
                  }`}
                >
                  {scholarStatus.isActive && scholarStatus.status !== 'paused' ? '⏸️ Pause' : '▶️ Resume'}
                </button>
                
                <button 
                  onClick={() => {
                    setAutomationPlan(null);
                    setUserStory('');
                    setScholarStatus({ isActive: false, status: 'idle', progress: 0, todayActions: 0, healthScore: 100 });
                  }}
                  className="px-6 py-3 border border-reddit-border text-reddit-dark rounded-lg hover:bg-reddit-bg transition-colors"
                >
                  ⚙️ New Strategy
                </button>
              </div>
              
              {/* Emergency Stop Button */}
              {scholarStatus.isActive && (
                <button
                  onClick={emergencyStop}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? '⏳ Stopping...' : '🛑 EMERGENCY STOP - Halt All Activity'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-600">⚠️</span>
              <div className="ml-3">
                <div className="text-sm font-medium text-red-800">Error</div>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* AI Co-pilot View */}
      {currentView === 'copilot' && automationPlan && (
        <AICopilot />
      )}

      {/* Activity Transparency View */}
      {currentView === 'activity' && automationPlan && (
        <ActivityTransparency />
      )}

      {/* Compact Rulebook Summary */}
      {currentView === 'setup' && (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
        <h3 className="font-medium text-reddit-dark mb-2 flex items-center text-sm">
          <span className="mr-2">✨</span>
          Our AI follows Reddit's golden rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-reddit-gray">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">•</span>
            <span>3 quality posts/week maximum</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">•</span>
            <span>Engage genuinely, build relationships</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">•</span>
            <span>Value-first, authentic stories only</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">•</span>
            <span>Full automation handles complexity</span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default RedditScholarSimple;