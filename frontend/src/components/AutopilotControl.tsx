import React, { useState, useEffect } from 'react';

interface AutopilotSettings {
  mode: 'conservative' | 'balanced' | 'aggressive' | 'custom';
  postsPerDay: number;
  commentsPerDay: number;
  upvotesPerDay: number;
  subredditRotation: boolean;
  contentGeneration: boolean;
  trendFollowing: boolean;
  riskLevel: number;
}

interface ContentStrategy {
  userPrompt: string;
  targetNiches: string[];
  contentTone: 'professional' | 'casual' | 'educational' | 'engaging';
  topics: string[];
  targetSubreddits: string[];
  postTypes: ('text' | 'discussion' | 'advice' | 'experience')[];
}

interface AutopilotStatus {
  isActive: boolean;
  sessionId?: string;
  status: string;
  queueLength: number;
  healthScore: number;
  riskLevel: string;
  actionsToday: number;
  lastActivity?: string;
  recommendations?: string[];
}

interface QueueAction {
  id: string;
  type: string;
  time: string;
  target: string;
  content: string;
  confidence: string;
}

const AutopilotControl: React.FC = () => {
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus | null>(null);
  const [queueActions, setQueueActions] = useState<QueueAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContentStrategy, setShowContentStrategy] = useState(false);
  const [settings, setSettings] = useState<AutopilotSettings>({
    mode: 'balanced',
    postsPerDay: 3,
    commentsPerDay: 8,
    upvotesPerDay: 25,
    subredditRotation: true,
    contentGeneration: true,
    trendFollowing: true,
    riskLevel: 3
  });
  const [contentStrategy, setContentStrategy] = useState<ContentStrategy>({
    userPrompt: '',
    targetNiches: [],
    contentTone: 'engaging',
    topics: [],
    targetSubreddits: [],
    postTypes: ['discussion', 'advice', 'experience']
  });
  const [testContent, setTestContent] = useState<string>('');
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [nicheSuggestions, setNicheSuggestions] = useState<string[]>([]);
  const [subredditSuggestions, setSubredditSuggestions] = useState<string[]>([]);

  // API functions
  const getAuthToken = () => {
    // Try to get token from cookie (set by Reddit OAuth)
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('reddit_auth_token='))
      ?.split('=')[1];
    
    return token || localStorage.getItem('auth_token');
  };

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

  // Fetch autopilot status
  const fetchAutopilotStatus = async () => {
    try {
      const response = await apiCall('/autopilot/status');
      if (response.success) {
        setAutopilotStatus(response.data);
        setIsAutopilotActive(response.data.isActive);
      }
    } catch (error) {
      console.error('Error fetching autopilot status:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch status');
    }
  };

  // Fetch queue
  const fetchQueue = async () => {
    try {
      const response = await apiCall('/autopilot/queue');
      if (response.success) {
        // Transform backend queue data to frontend format
        const transformedQueue = response.data.queue.map((action: any, index: number) => ({
          id: action.id,
          type: action.type,
          time: new Date(action.scheduledFor).toLocaleTimeString(),
          target: action.data.subreddit || action.data.parentId || action.data.itemId,
          content: action.data.title || action.data.text || `${action.type} action`,
          confidence: action.priority === 'high' ? 'High' : action.priority === 'low' ? 'Low' : 'Medium'
        }));
        setQueueActions(transformedQueue);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  // Start/Stop autopilot
  const toggleAutopilot = async () => {
    if (loading) return;

    // Validation before starting
    if (!isAutopilotActive && !contentStrategy.userPrompt.trim()) {
      setError('Please configure your Content Strategy first. Add your content mission to guide the AI.');
      setShowContentStrategy(true);
      return;
    }

    if (!isAutopilotActive && contentStrategy.targetSubreddits.length === 0) {
      setError('Please add at least one target subreddit in your Content Strategy.');
      setShowContentStrategy(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isAutopilotActive) {
        const response = await apiCall('/autopilot/stop', 'POST');
        if (response.success) {
          setIsAutopilotActive(false);
          await fetchAutopilotStatus();
        }
      } else {
        const autopilotSettings = {
          enabled: true,
          autoPost: settings.mode !== 'conservative',
          autoComment: true,
          autoVote: true,
          targetSubreddits: contentStrategy.targetSubreddits,
          postFrequency: Math.floor((24 * 60) / settings.postsPerDay),
          commentFrequency: Math.floor((24 * 60) / settings.commentsPerDay),
          voteFrequency: Math.floor((24 * 60) / settings.upvotesPerDay),
          maxPostsPerDay: settings.postsPerDay,
          maxCommentsPerDay: settings.commentsPerDay,
          maxVotesPerDay: settings.upvotesPerDay,
          contentStrategy: {
            userPrompt: contentStrategy.userPrompt,
            targetNiches: contentStrategy.targetNiches,
            contentTone: contentStrategy.contentTone,
            postTypes: contentStrategy.postTypes,
            aiGenerated: true
          },
          riskLevel: settings.mode,
          pauseOnLowHealth: true,
          minHealthScore: 50
        };

        const response = await apiCall('/autopilot/start', 'POST', { settings: autopilotSettings });
        if (response.success) {
          setIsAutopilotActive(true);
          await fetchAutopilotStatus();
        }
      }
    } catch (error) {
      console.error('Error toggling autopilot:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle autopilot');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    // Only fetch if we have a token
    const token = getAuthToken();
    if (token) {
      fetchAutopilotStatus();
      fetchQueue();
      
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        fetchAutopilotStatus();
        fetchQueue();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    } else {
      setError('Reddit authentication required. Please connect your Reddit account first.');
    }
  }, []);

  // Generate intelligent suggestions based on user prompt
  const generateSuggestions = (prompt: string) => {
    const promptLower = prompt.toLowerCase();
    
    // Niche mapping
    const nicheKeywords = {
      'productivity': ['productive', 'efficiency', 'time management', 'organization', 'workflow', 'focus'],
      'entrepreneurship': ['business', 'startup', 'entrepreneur', 'company', 'revenue', 'growth', 'scaling'],
      'self improvement': ['improve', 'better', 'develop', 'growth', 'habits', 'mindset', 'goals'],
      'career development': ['career', 'job', 'professional', 'work', 'promotion', 'skills', 'leadership'],
      'technology': ['tech', 'software', 'coding', 'programming', 'digital', 'innovation'],
      'finance': ['money', 'invest', 'financial', 'wealth', 'budget', 'saving', 'income'],
      'health fitness': ['health', 'fitness', 'exercise', 'workout', 'nutrition', 'wellness'],
      'education': ['learn', 'study', 'education', 'knowledge', 'teaching', 'academic'],
      'marketing': ['marketing', 'advertising', 'brand', 'social media', 'content', 'audience'],
      'freelancing': ['freelance', 'remote', 'independent', 'consultant', 'gig']
    };

    // Subreddit mapping
    const subredditMapping: { [key: string]: string[] } = {
      'productivity': ['productivity', 'getmotivated', 'decidingtobebetter', 'selfimprovement'],
      'entrepreneurship': ['entrepreneur', 'startups', 'business', 'smallbusiness'],
      'self improvement': ['selfimprovement', 'decidingtobebetter', 'getmotivated', 'discipline'],
      'career development': ['careeradvice', 'jobs', 'careerguidance', 'professional'],
      'technology': ['technology', 'programming', 'webdev', 'startups'],
      'finance': ['personalfinance', 'investing', 'financialindependence', 'fire'],
      'health fitness': ['fitness', 'loseit', 'nutrition', 'bodybuilding'],
      'education': ['studytips', 'education', 'university', 'college'],
      'marketing': ['marketing', 'socialmedia', 'entrepreneur', 'business'],
      'freelancing': ['freelance', 'digitalnomad', 'entrepreneur', 'remotework']
    };

    // Find matching niches
    const matchedNiches: string[] = [];
    const matchedSubreddits: string[] = [];

    Object.entries(nicheKeywords).forEach(([niche, keywords]) => {
      if (keywords.some(keyword => promptLower.includes(keyword))) {
        matchedNiches.push(niche);
        // Add corresponding subreddits
        if (subredditMapping[niche]) {
          matchedSubreddits.push(...subredditMapping[niche]);
        }
      }
    });

    // Remove duplicates and limit suggestions
    const uniqueNiches = Array.from(new Set(matchedNiches)).slice(0, 6);
    const uniqueSubreddits = Array.from(new Set(matchedSubreddits)).slice(0, 8);
    setNicheSuggestions(uniqueNiches);
    setSubredditSuggestions(uniqueSubreddits);
  };

  // Update suggestions when user prompt changes
  const handlePromptChange = (value: string) => {
    setContentStrategy(prev => ({ ...prev, userPrompt: value }));
    if (value.length > 20) { // Only suggest after meaningful input
      generateSuggestions(value);
    }
  };

  // Test content generation
  const testContentGeneration = async () => {
    if (!contentStrategy.userPrompt.trim()) {
      setError('Please add your content mission first.');
      return;
    }

    setIsGeneratingTest(true);
    setTestContent('');

    try {
      const prompt = `${contentStrategy.userPrompt}\n\nTarget audience: ${contentStrategy.targetNiches.join(', ')}\nSubreddits: ${contentStrategy.targetSubreddits.map(s => `r/${s}`).join(', ')}\nContent types: ${contentStrategy.postTypes.join(', ')}\nTone: ${contentStrategy.contentTone}`;

      const response = await fetch(`http://localhost:8000/api/ai/generate/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          subreddit: contentStrategy.targetSubreddits[0],
          contentType: contentStrategy.postTypes[0],
          tone: contentStrategy.contentTone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        setTestContent(responseData.data.content);
      }
    } catch (error) {
      console.error('Error generating test content:', error);
      setTestContent('⚠️ Could not generate test content. Please check your connection and try again.');
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const autopilotModes = [
    {
      id: 'conservative',
      name: 'Conservative Scholar',
      description: 'Slow and steady growth, minimal risk',
      icon: '🐢',
      settings: { postsPerDay: 1, commentsPerDay: 4, upvotesPerDay: 15, riskLevel: 1 }
    },
    {
      id: 'balanced',
      name: 'Balanced Expert',
      description: 'Optimal growth with calculated risks',
      icon: '⚖️',
      settings: { postsPerDay: 3, commentsPerDay: 8, upvotesPerDay: 25, riskLevel: 3 }
    },
    {
      id: 'aggressive',
      name: 'Growth Maximizer',
      description: 'Fast growth, higher engagement',
      icon: '🚀',
      settings: { postsPerDay: 5, commentsPerDay: 12, upvotesPerDay: 40, riskLevel: 5 }
    },
    {
      id: 'custom',
      name: 'Custom Settings',
      description: 'Fine-tune every parameter',
      icon: '⚙️',
      settings: settings
    }
  ];

  const handleModeChange = (mode: string) => {
    const selectedMode = autopilotModes.find(m => m.id === mode);
    if (selectedMode && mode !== 'custom') {
      setSettings(prev => ({
        ...prev,
        mode: mode as any,
        ...selectedMode.settings
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-reddit-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🧠</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-reddit-dark">Reddit Scholar Autopilot</h2>
            <p className="text-sm text-reddit-gray">AI-powered Reddit growth automation</p>
          </div>
        </div>
        
        {/* Master Switch */}
        <div className="flex items-center space-x-3">
          <span className={`text-sm font-medium ${isAutopilotActive ? 'text-green-600' : 'text-reddit-gray'}`}>
            {loading ? 'UPDATING...' : isAutopilotActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <button
            onClick={toggleAutopilot}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-reddit-primary focus:ring-offset-2 ${
              isAutopilotActive ? 'bg-green-600' : 'bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isAutopilotActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-red-600">⚠️</span>
            <div className="ml-3">
              <div className="text-sm font-medium text-red-800">
                {error.includes('authentication') ? 'Authentication Required' : 'Error'}
              </div>
              <div className="text-sm text-red-700">{error}</div>
              {error.includes('authentication') && (
                <div className="mt-2">
                  <button 
                    onClick={() => window.location.href = '/reddit-connect'}
                    className="text-sm bg-reddit-primary text-white px-3 py-1 rounded hover:bg-reddit-primary/90"
                  >
                    Connect Reddit Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Autopilot Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium text-green-800">Account Health</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {autopilotStatus?.healthScore ? `${autopilotStatus.healthScore}/100` : 'Loading...'}
          </div>
          <div className="text-xs text-green-600">
            Risk Level: {autopilotStatus?.riskLevel || 'Unknown'}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">Today's Actions</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {autopilotStatus?.actionsToday || 0}
          </div>
          <div className="text-xs text-blue-600">
            Queue: {autopilotStatus?.queueLength || 0} pending
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-800">Status</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {autopilotStatus?.status || 'Unknown'}
          </div>
          <div className="text-xs text-purple-600">
            {autopilotStatus?.sessionId ? `Session: ${autopilotStatus.sessionId.slice(0, 8)}...` : 'No active session'}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-800">Next Action</div>
          <div className="text-sm font-bold text-orange-600 mt-1">
            {queueActions.length > 0 ? queueActions[0].type : 'None scheduled'}
          </div>
          <div className="text-xs text-orange-600">
            {queueActions.length > 0 ? `${queueActions[0].target} (${queueActions[0].time})` : 'Queue is empty'}
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-reddit-dark mb-4">Autopilot Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {autopilotModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                settings.mode === mode.id
                  ? 'border-reddit-primary bg-reddit-primary/5'
                  : 'border-reddit-border hover:border-reddit-primary/50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">{mode.icon}</span>
                <span className="font-semibold text-reddit-dark">{mode.name}</span>
              </div>
              <p className="text-sm text-reddit-gray">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Content Strategy Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-reddit-dark">Content Strategy</h3>
          <button
            onClick={() => setShowContentStrategy(!showContentStrategy)}
            className="text-sm text-reddit-primary hover:text-reddit-primary/80 flex items-center space-x-1"
          >
            <span>{showContentStrategy ? 'Hide' : 'Configure'}</span>
            <span>{showContentStrategy ? '▲' : '▼'}</span>
          </button>
        </div>

        {showContentStrategy && (
          <div className="bg-reddit-bg rounded-lg p-6 space-y-6">
            {/* User Prompt Section */}
            <div>
              <label className="block text-sm font-medium text-reddit-dark mb-2">
                🎯 Your Content Mission
              </label>
              <textarea
                value={contentStrategy.userPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Tell the AI what you want to achieve on Reddit. E.g., 'I want to share productivity tips and build authority in the entrepreneurship space. Focus on actionable advice and personal experiences that help others grow their businesses.'"
                className="w-full h-32 p-3 border border-reddit-border rounded-lg resize-none focus:ring-2 focus:ring-reddit-primary focus:border-transparent"
              />
              <div className="mt-2 text-xs text-reddit-gray">
                This guides the AI on what type of content to create and how to position you in the community.
              </div>
            </div>

            {/* Target Niches */}
            <div>
              <label className="block text-sm font-medium text-reddit-dark mb-2">
                📊 Target Niches
              </label>
              
              {/* Suggestions */}
              {nicheSuggestions.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-reddit-gray mb-2">💡 Suggested based on your content mission:</div>
                  <div className="flex flex-wrap gap-2">
                    {nicheSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!contentStrategy.targetNiches.includes(suggestion)) {
                            setContentStrategy(prev => ({
                              ...prev,
                              targetNiches: [...prev.targetNiches, suggestion]
                            }));
                          }
                        }}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 border border-blue-200"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selected Niches */}
              <div className="flex flex-wrap gap-2 mb-3">
                {contentStrategy.targetNiches.map((niche, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-reddit-primary/10 text-reddit-primary rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{niche}</span>
                    <button
                      onClick={() => setContentStrategy(prev => ({
                        ...prev,
                        targetNiches: prev.targetNiches.filter((_, i) => i !== index)
                      }))}
                      className="text-reddit-primary hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Manual Input */}
              <input
                type="text"
                placeholder="Add a niche (e.g., productivity, entrepreneurship) and press Enter"
                className="w-full p-2 border border-reddit-border rounded-lg text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim();
                    if (value && !contentStrategy.targetNiches.includes(value)) {
                      setContentStrategy(prev => ({
                        ...prev,
                        targetNiches: [...prev.targetNiches, value]
                      }));
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Content Tone */}
            <div>
              <label className="block text-sm font-medium text-reddit-dark mb-2">
                🎨 Content Tone
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['professional', 'casual', 'educational', 'engaging'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setContentStrategy(prev => ({ ...prev, contentTone: tone as any }))}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      contentStrategy.contentTone === tone
                        ? 'border-reddit-primary bg-reddit-primary/5 text-reddit-primary'
                        : 'border-reddit-border hover:border-reddit-primary/50 text-reddit-gray'
                    }`}
                  >
                    <div className="font-medium capitalize">{tone}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Subreddits */}
            <div>
              <label className="block text-sm font-medium text-reddit-dark mb-2">
                🎯 Target Subreddits
              </label>
              
              {/* Suggestions */}
              {subredditSuggestions.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-reddit-gray mb-2">💡 Recommended subreddits for your niche:</div>
                  <div className="flex flex-wrap gap-2">
                    {subredditSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!contentStrategy.targetSubreddits.includes(suggestion)) {
                            setContentStrategy(prev => ({
                              ...prev,
                              targetSubreddits: [...prev.targetSubreddits, suggestion]
                            }));
                          }
                        }}
                        className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 border border-green-200"
                      >
                        + r/{suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selected Subreddits */}
              <div className="flex flex-wrap gap-2 mb-3">
                {contentStrategy.targetSubreddits.map((subreddit, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-1"
                  >
                    <a
                      href={`https://reddit.com/r/${subreddit}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      r/{subreddit}
                    </a>
                    <button
                      onClick={() => setContentStrategy(prev => ({
                        ...prev,
                        targetSubreddits: prev.targetSubreddits.filter((_, i) => i !== index)
                      }))}
                      className="text-green-800 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Manual Input */}
              <input
                type="text"
                placeholder="Add subreddit (without r/) and press Enter"
                className="w-full p-2 border border-reddit-border rounded-lg text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim().toLowerCase();
                    if (value && !contentStrategy.targetSubreddits.includes(value)) {
                      setContentStrategy(prev => ({
                        ...prev,
                        targetSubreddits: [...prev.targetSubreddits, value]
                      }));
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <div className="mt-1 text-xs text-reddit-gray">
                Click on any r/subreddit tag to open it in a new tab
              </div>
            </div>

            {/* Post Types */}
            <div>
              <label className="block text-sm font-medium text-reddit-dark mb-2">
                📝 Content Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'text', label: '📄 Text Posts', desc: 'Long-form content' },
                  { id: 'discussion', label: '💬 Discussions', desc: 'Questions & debates' },
                  { id: 'advice', label: '💡 Advice', desc: 'Tips & guidance' },
                  { id: 'experience', label: '📖 Stories', desc: 'Personal experiences' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      const isSelected = contentStrategy.postTypes.includes(type.id as any);
                      setContentStrategy(prev => ({
                        ...prev,
                        postTypes: isSelected
                          ? prev.postTypes.filter(t => t !== type.id)
                          : [...prev.postTypes, type.id as any]
                      }));
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      contentStrategy.postTypes.includes(type.id as any)
                        ? 'border-reddit-primary bg-reddit-primary/5'
                        : 'border-reddit-border hover:border-reddit-primary/50'
                    }`}
                  >
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs text-reddit-gray">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Section */}
            <div className="border-t border-reddit-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-reddit-dark">🔮 AI Content Preview</h4>
                <button 
                  onClick={testContentGeneration}
                  disabled={isGeneratingTest || !contentStrategy.userPrompt.trim()}
                  className="text-sm bg-reddit-primary text-white px-3 py-1 rounded hover:bg-reddit-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingTest ? '⏳ Generating...' : '🎯 Test Generate'}
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-reddit-border">
                {testContent ? (
                  <div>
                    <div className="text-sm text-reddit-gray mb-2">✨ AI-Generated Content Sample:</div>
                    <div className="text-sm bg-gray-50 p-3 rounded border italic">
                      {testContent}
                    </div>
                    <div className="mt-3 text-xs text-green-600">
                      ✅ Ready! This is the type of content the AI will create for your autopilot.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-reddit-gray mb-2">
                      {contentStrategy.userPrompt ? 'Click "Test Generate" to see AI-created content sample:' : 'Configure your content mission above to test AI generation:'}
                    </div>
                    <div className="text-sm">
                      {contentStrategy.userPrompt || '⬆️ Add your content mission in the text area above...'}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {contentStrategy.contentTone} tone
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {contentStrategy.targetSubreddits.length} subreddits
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    {contentStrategy.postTypes.length} content types
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      {settings.mode === 'custom' && (
        <div className="bg-reddit-bg rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-reddit-dark mb-4">Custom Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-reddit-gray mb-1">Posts per Day</label>
              <input
                type="range"
                min="0"
                max="10"
                value={settings.postsPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, postsPerDay: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-reddit-dark font-medium">{settings.postsPerDay} posts</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-reddit-gray mb-1">Comments per Day</label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.commentsPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, commentsPerDay: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-reddit-dark font-medium">{settings.commentsPerDay} comments</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-reddit-gray mb-1">Upvotes per Day</label>
              <input
                type="range"
                min="0"
                max="50"
                value={settings.upvotesPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, upvotesPerDay: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-reddit-dark font-medium">{settings.upvotesPerDay} upvotes</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Features */}
      <div className="mb-6">
        <h4 className="font-semibold text-reddit-dark mb-4">AI Scholar Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-reddit-bg rounded-lg">
            <div>
              <div className="font-medium text-reddit-dark">Smart Content Generation</div>
              <div className="text-sm text-reddit-gray">AI creates relevant posts for your niches</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, contentGeneration: !prev.contentGeneration }))}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.contentGeneration ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                settings.contentGeneration ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-reddit-bg rounded-lg">
            <div>
              <div className="font-medium text-reddit-dark">Trend Following</div>
              <div className="text-sm text-reddit-gray">Automatically engage with trending topics</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, trendFollowing: !prev.trendFollowing }))}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.trendFollowing ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                settings.trendFollowing ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-reddit-bg rounded-lg">
            <div>
              <div className="font-medium text-reddit-dark">Subreddit Rotation</div>
              <div className="text-sm text-reddit-gray">Varies posting across different communities</div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, subredditRotation: !prev.subredditRotation }))}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.subredditRotation ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                settings.subredditRotation ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-reddit-bg rounded-lg">
            <div>
              <div className="font-medium text-reddit-dark">Learning Mode</div>
              <div className="text-sm text-reddit-gray">AI learns from your successful posts</div>
            </div>
            <button className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-green-600">
              <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Autopilot Queue Preview */}
      <div className="mb-6">
        <h4 className="font-semibold text-reddit-dark mb-4">
          Autopilot Queue ({queueActions.length} actions)
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {queueActions.length > 0 ? queueActions.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-reddit-bg rounded-lg text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-reddit-gray">{item.time}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.type === 'post' ? 'bg-blue-100 text-blue-800' :
                  item.type === 'comment' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {item.type}
                </span>
                <span className="text-reddit-dark truncate max-w-xs">{item.target}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  item.confidence === 'High' ? 'bg-green-100 text-green-800' :
                  item.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.confidence}
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center text-reddit-gray py-8">
              <div className="text-lg mb-2">📅</div>
              <div>No actions scheduled</div>
              <div className="text-sm">Queue will populate when autopilot is active</div>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-3">
        <button 
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            isAutopilotActive 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-reddit-primary text-white hover:bg-reddit-primary/90'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={toggleAutopilot}
          disabled={loading}
        >
          {loading ? '⏳ Processing...' : 
           isAutopilotActive ? '⏹️ Stop Autopilot' : '🚀 Start Autopilot'}
        </button>
        <button className="px-6 py-3 border border-reddit-border text-reddit-dark rounded-lg hover:bg-reddit-bg transition-colors">
          📊 View Analytics
        </button>
        <button className="px-6 py-3 border border-reddit-border text-reddit-dark rounded-lg hover:bg-reddit-bg transition-colors">
          ⚙️ Advanced Settings
        </button>
      </div>

      {/* Warning/Info Messages */}
      {isAutopilotActive && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-blue-800">Reddit Scholar Active</div>
              <div className="text-sm text-blue-700">
                AI is analyzing opportunities and will execute actions according to your settings. 
                Account safety is monitored continuously.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutopilotControl;