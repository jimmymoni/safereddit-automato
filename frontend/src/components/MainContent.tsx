import React, { useState, useEffect, useCallback } from 'react';
import AutopilotControl from './AutopilotControl';
import AIInsightsPanel from './AIInsightsPanel';
import { useRedditUser } from '../hooks/useRedditUser';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { redditUser } = useRedditUser();
  
  // Trend Finder state
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // Fetch trending posts from user's subscribed subreddits
  const fetchTrendingPosts = useCallback(async () => {
    if (!redditUser.connected) return;
    
    setIsLoadingTrends(true);
    setTrendsError(null);
    
    try {
      // Get JWT token from cookie (same as useRedditUser hook)
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('reddit_auth_token='))
        ?.split('=')[1];
        
      if (!token) {
        setTrendsError('Reddit authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/reddit/trending/subscribed?limit=25', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTrendingPosts(result.data.posts);
      } else {
        setTrendsError(result.error || 'Failed to fetch trending posts');
      }
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      setTrendsError('Failed to connect to server');
    } finally {
      setIsLoadingTrends(false);
    }
  }, [redditUser.connected]);

  // Fetch user's subscribed subreddits
  const fetchSubscriptions = useCallback(async () => {
    if (!redditUser.connected) return;
    
    try {
      // Get JWT token from cookie (same as useRedditUser hook)
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('reddit_auth_token='))
        ?.split('=')[1];
        
      if (!token) {
        console.log('No Reddit auth token found');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/reddit/subscriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubscriptions(result.data.subreddits);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  }, [redditUser.connected]);

  // Load data when component mounts or when Reddit connection changes
  useEffect(() => {
    if (redditUser.connected && activeTab === 'trends') {
      fetchTrendingPosts();
      fetchSubscriptions();
    }
  }, [redditUser.connected, activeTab, fetchTrendingPosts, fetchSubscriptions]);

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'Just now';
  };

  return (
    <div className="py-6">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-reddit-border">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'autopilot', name: 'Reddit Scholar', icon: '🧠' },
              { id: 'trends', name: 'Trend Finder', icon: '🔥' },
              { id: 'vault', name: 'Content Vault', icon: '📂' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-reddit-primary text-reddit-primary'
                    : 'border-transparent text-reddit-gray hover:text-reddit-dark hover:border-reddit-border'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Reputation Tracker Panel */}
          <div className="bg-white rounded-lg border border-reddit-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-reddit-dark">Reputation Tracker</h2>
              <select className="text-sm border border-reddit-border rounded px-3 py-1">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            
            {/* Karma Growth Graph Placeholder */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-4">
              <div className="flex items-end justify-between h-32">
                {[20, 35, 45, 30, 55, 70, 65].map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-reddit-primary rounded-t w-8" 
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-xs text-reddit-gray mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-reddit-bg rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {redditUser.connected ? (redditUser.postKarma + redditUser.commentKarma).toLocaleString() : '0'}
                </div>
                <div className="text-sm text-reddit-gray">Total Karma</div>
              </div>
              <div className="text-center p-4 bg-reddit-bg rounded-lg">
                <div className="text-2xl font-bold text-reddit-primary">
                  {redditUser.connected ? `${redditUser.accountHealth}%` : 'N/A'}
                </div>
                <div className="text-sm text-reddit-gray">Account Health</div>
              </div>
              <div className="text-center p-4 bg-reddit-bg rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {redditUser.connected ? redditUser.postKarma.toLocaleString() : '0'}
                </div>
                <div className="text-sm text-reddit-gray">Post Karma</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-reddit-border p-6">
            <h2 className="text-lg font-semibold text-reddit-dark mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-reddit-border rounded-lg hover:border-reddit-primary hover:bg-reddit-bg transition-colors">
                <span className="text-2xl">➕</span>
                <span className="font-medium">Create Post</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-reddit-border rounded-lg hover:border-reddit-accent hover:bg-yellow-50 transition-colors">
                <span className="text-2xl">⏰</span>
                <span className="font-medium">Schedule</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-reddit-border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                <span className="text-2xl">🎯</span>
                <span className="font-medium">Find Trends</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-reddit-border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <span className="text-2xl">📊</span>
                <span className="font-medium">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reddit Scholar Autopilot Tab */}
      {activeTab === 'autopilot' && (
        <div className="space-y-6">
          <AutopilotControl />
          <AIInsightsPanel />
        </div>
      )}

      {/* Trend Finder Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {/* Header with refresh button */}
          <div className="bg-white rounded-lg border border-reddit-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-reddit-dark">Trending in Your Subreddits</h2>
              <button 
                onClick={fetchTrendingPosts}
                disabled={isLoadingTrends}
                className="bg-reddit-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-reddit-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoadingTrends ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {/* Subscriptions summary */}
            {subscriptions.length > 0 && (
              <div className="text-sm text-reddit-gray">
                Showing trending posts from {subscriptions.length} subscribed subreddits
              </div>
            )}
          </div>

          {/* Reddit connection check */}
          {!redditUser.connected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">Reddit Not Connected</h3>
                  <p className="text-sm text-yellow-700 mb-3">Connect your Reddit account to see trending posts from your subscribed subreddits.</p>
                  <button 
                    onClick={() => window.location.href = '/reddit-connect'}
                    className="bg-reddit-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-reddit-primary/90 transition-colors"
                  >
                    Connect Reddit Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {trendsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-red-600 text-xl">❌</span>
                <div>
                  <h3 className="font-medium text-red-800">Error Loading Trends</h3>
                  <p className="text-sm text-red-700">{trendsError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoadingTrends && (
            <div className="bg-white rounded-lg border border-reddit-border p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-reddit-primary"></div>
                <span className="ml-3 text-reddit-gray">Loading trending posts...</span>
              </div>
            </div>
          )}

          {/* Trending Posts Feed */}
          {redditUser.connected && !isLoadingTrends && !trendsError && (
            <div className="space-y-4">
              {trendingPosts.length === 0 ? (
                <div className="bg-white rounded-lg border border-reddit-border p-8 text-center">
                  <span className="text-4xl mb-4 block">📭</span>
                  <h3 className="font-medium text-reddit-dark mb-2">No Trending Posts Found</h3>
                  <p className="text-sm text-reddit-gray">Try subscribing to more subreddits or check back later.</p>
                </div>
              ) : (
                trendingPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg border border-reddit-border p-4 hover:border-reddit-primary transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex flex-col items-center space-y-1">
                        <button className="text-reddit-gray hover:text-reddit-upvote">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-xs font-bold">{post.score}</span>
                        <button className="text-reddit-gray hover:text-reddit-downvote">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm text-reddit-gray mb-2">
                          <span className="font-medium">r/{post.subreddit}</span>
                          <span>•</span>
                          <span>Posted by u/{post.author}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(post.created)}</span>
                          <div className="ml-auto flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              post.analysis.trending > 50 ? 'bg-green-500' : 
                              post.analysis.trending > 25 ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}></div>
                            <span className={`text-xs font-medium ${
                              post.analysis.trending > 50 ? 'text-green-600' : 
                              post.analysis.trending > 25 ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {post.analysis.trending > 50 ? 'High Potential' : 
                               post.analysis.trending > 25 ? 'Medium Potential' : 'Low Potential'}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="font-medium text-reddit-dark mb-2 hover:text-reddit-primary cursor-pointer">
                          <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                            {post.title}
                          </a>
                        </h3>
                        
                        {post.flair && (
                          <div className="mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {post.flair}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-reddit-gray">
                            <span>💬 {post.numComments} comments</span>
                            <span>📈 Trending Score: {post.analysis.trending}</span>
                            <span>⬆️ {Math.round(post.upvoteRatio * 100)}% upvoted</span>
                          </div>
                          
                          <button 
                            onClick={() => window.open(post.permalink, '_blank')}
                            className="bg-reddit-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-reddit-primary/90 transition-colors"
                          >
                            Join Conversation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Vault Tab */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {/* Vault Header */}
          <div className="bg-white rounded-lg border border-reddit-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-reddit-dark">Content Vault</h2>
              <button className="bg-reddit-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-reddit-primary/90">
                + Add Content
              </button>
            </div>
            
            <div className="flex space-x-4">
              <input 
                type="text" 
                placeholder="Search content..." 
                className="flex-1 border border-reddit-border rounded-lg px-3 py-2 text-sm"
              />
              <select className="border border-reddit-border rounded-lg px-3 py-2 text-sm">
                <option>All Tags</option>
                <option>Productivity</option>
                <option>Entrepreneurship</option>
                <option>Tech</option>
              </select>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(item => (
              <div key={item} className="bg-white rounded-lg border border-reddit-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Post</span>
                  <div className="flex space-x-2">
                    <button className="text-reddit-gray hover:text-reddit-primary">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button className="text-reddit-gray hover:text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <h3 className="font-medium text-reddit-dark mb-2">
                  5 productivity hacks that changed my life
                </h3>
                
                <p className="text-sm text-reddit-gray mb-3 line-clamp-3">
                  These simple strategies helped me double my output and reduce stress levels significantly...
                </p>
                
                <div className="flex items-center justify-between text-xs text-reddit-gray">
                  <span>Created 2 days ago</span>
                  <div className="flex space-x-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Ready</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg border border-reddit-border p-6">
          <h2 className="text-lg font-semibold text-reddit-dark mb-4">Analytics Dashboard</h2>
          <p className="text-reddit-gray">Detailed analytics coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default MainContent;