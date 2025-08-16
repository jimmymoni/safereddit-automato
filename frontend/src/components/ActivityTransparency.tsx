import React, { useState } from 'react';

interface ActivityLog {
  id: string;
  timestamp: Date;
  action: 'comment' | 'upvote' | 'post' | 'reply';
  target: {
    subreddit: string;
    postTitle: string;
    author: string;
    url: string;
  };
  aiReasoning: string;
  content?: string;
  result: {
    status: 'success' | 'failed' | 'pending';
    karma?: number;
    engagement?: {
      upvotes: number;
      replies: number;
    };
  };
  ruleCompliance: {
    promotionalContentRatio: number;
    timeGapSinceLastPost: string;
    subredditRulesChecked: boolean;
    humanLikeDelay: boolean;
  };
}

const ActivityTransparency: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Mock activity data
  const mockActivities: ActivityLog[] = [
    {
      id: "act_001",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      action: "comment",
      target: {
        subreddit: "r/entrepreneur",
        postTitle: "Struggling with Reddit marketing - any tips?",
        author: "u/startup_founder",
        url: "https://reddit.com/r/entrepreneur/comments/abc123"
      },
      aiReasoning: "High-value opportunity: User asking exactly what our tool solves. Perfect chance to share lessons learned without promotion. Builds credibility in target community.",
      content: "I've been through this exact struggle! The key insights I learned: 1) Study each subreddit's culture for weeks before posting, 2) Focus on giving value first - answer questions, share lessons, help others, 3) Never start with promotion, build trust through authentic participation. The 90/10 rule is crucial - 90% helpful content, 10% about your project. Happy to share more specific strategies if helpful!",
      result: {
        status: "success",
        karma: 12,
        engagement: {
          upvotes: 15,
          replies: 3
        }
      },
      ruleCompliance: {
        promotionalContentRatio: 0.08, // 8% - well under 10% limit
        timeGapSinceLastPost: "72 hours",
        subredditRulesChecked: true,
        humanLikeDelay: true
      }
    },
    {
      id: "act_002",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      action: "upvote",
      target: {
        subreddit: "r/SaaS",
        postTitle: "How do you handle API rate limiting in your apps?",
        author: "u/dev_sarah",
        url: "https://reddit.com/r/SaaS/comments/def456"
      },
      aiReasoning: "Strategic upvote: Technical post relevant to our Reddit API experience. Supports community engagement while staying authentic. No promotional risk.",
      result: {
        status: "success",
        karma: 0
      },
      ruleCompliance: {
        promotionalContentRatio: 0.08,
        timeGapSinceLastPost: "N/A for upvotes",
        subredditRulesChecked: true,
        humanLikeDelay: true
      }
    },
    {
      id: "act_003",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      action: "comment",
      target: {
        subreddit: "r/SaaS",
        postTitle: "How do you handle API rate limiting in your apps?",
        author: "u/dev_sarah", 
        url: "https://reddit.com/r/SaaS/comments/def456"
      },
      aiReasoning: "Technical knowledge sharing opportunity. Low risk, high value. Establishes expertise in SaaS community without any promotional content.",
      content: "Great question! Here's what works for me: 1) Implement exponential backoff - start with 1s delay, double on each failure. 2) Use request queuing to batch API calls efficiently. 3) Cache responses aggressively to reduce API calls. 4) Monitor rate limit headers and adapt dynamically. For Reddit specifically, the 60 requests/minute limit means careful request management is crucial. Happy to share code examples if useful!",
      result: {
        status: "success",
        karma: 8,
        engagement: {
          upvotes: 11,
          replies: 2
        }
      },
      ruleCompliance: {
        promotionalContentRatio: 0.07, // 7%
        timeGapSinceLastPost: "48 hours",
        subredditRulesChecked: true,
        humanLikeDelay: true
      }
    }
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'comment': return '💬';
      case 'upvote': return '⬆️';
      case 'post': return '📝';
      case 'reply': return '↩️';
      default: return '🤖';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceScore = (compliance: ActivityLog['ruleCompliance']) => {
    let score = 100;
    if (compliance.promotionalContentRatio > 0.1) score -= 30;
    if (!compliance.subredditRulesChecked) score -= 20;
    if (!compliance.humanLikeDelay) score -= 15;
    return Math.max(score, 0);
  };

  const filteredActivities = mockActivities.filter(activity => {
    const activityDate = activity.timestamp;
    const now = new Date();
    
    switch (selectedTimeframe) {
      case 'today':
        return activityDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return activityDate >= monthAgo;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-reddit-dark flex items-center">
          <span className="mr-3">📊</span>
          Activity Transparency
        </h2>
        
        <div className="flex space-x-2">
          {(['today', 'week', 'month'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                selectedTimeframe === timeframe
                  ? 'bg-reddit-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-reddit-border p-4">
          <div className="text-2xl font-bold text-green-600">{filteredActivities.length}</div>
          <div className="text-sm text-reddit-gray">Total Actions</div>
        </div>
        <div className="bg-white rounded-lg border border-reddit-border p-4">
          <div className="text-2xl font-bold text-blue-600">
            {filteredActivities.reduce((sum, act) => sum + (act.result.karma || 0), 0)}
          </div>
          <div className="text-sm text-reddit-gray">Karma Gained</div>
        </div>
        <div className="bg-white rounded-lg border border-reddit-border p-4">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(filteredActivities.reduce((sum, act) => sum + act.ruleCompliance.promotionalContentRatio, 0) / filteredActivities.length * 100)}%
          </div>
          <div className="text-sm text-reddit-gray">Avg Promotional %</div>
        </div>
        <div className="bg-white rounded-lg border border-reddit-border p-4">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-sm text-reddit-gray">TOS Compliance</div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg border border-reddit-border">
        <div className="p-4 border-b border-reddit-border">
          <h3 className="font-semibold text-reddit-dark">Recent Activity Log</h3>
          <p className="text-sm text-reddit-gray">Complete transparency of all AI actions taken on your behalf</p>
        </div>

        <div className="divide-y divide-reddit-border">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getActionIcon(activity.action)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-reddit-dark capitalize">{activity.action}</span>
                      <span className="text-reddit-gray">in</span>
                      <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                        {activity.target.subreddit}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(activity.result.status)}`}>
                        {activity.result.status}
                      </span>
                      <span className="text-sm text-reddit-gray">
                        {activity.timestamp.toLocaleString()}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-reddit-dark mb-2">
                      <a 
                        href={activity.target.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-reddit-primary"
                      >
                        {activity.target.postTitle}
                      </a>
                    </h4>
                    
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <h5 className="text-sm font-medium text-blue-900 mb-1">🧠 AI Reasoning</h5>
                      <p className="text-sm text-blue-800">{activity.aiReasoning}</p>
                    </div>

                    {activity.content && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-1">📝 Content Posted</h5>
                        <p className="text-sm text-gray-700 italic">"{activity.content}"</p>
                      </div>
                    )}

                    {activity.result.engagement && (
                      <div className="flex items-center space-x-4 text-sm text-reddit-gray mb-3">
                        <span>⬆️ {activity.result.engagement.upvotes} upvotes</span>
                        <span>💬 {activity.result.engagement.replies} replies</span>
                        {activity.result.karma && <span>🎯 +{activity.result.karma} karma</span>}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedAction(selectedAction === activity.id ? null : activity.id)}
                  className="text-reddit-gray hover:text-reddit-dark ml-4"
                >
                  {selectedAction === activity.id ? '▲' : '▼'}
                </button>
              </div>

              {/* Detailed Compliance Info */}
              {selectedAction === activity.id && (
                <div className="mt-4 pt-4 border-t border-reddit-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-reddit-dark mb-3">📋 Rule Compliance Check</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Promotional Content Ratio:</span>
                          <span className={`font-medium ${
                            activity.ruleCompliance.promotionalContentRatio <= 0.1 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {Math.round(activity.ruleCompliance.promotionalContentRatio * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Time Gap Since Last Post:</span>
                          <span className="font-medium text-green-600">
                            {activity.ruleCompliance.timeGapSinceLastPost}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Subreddit Rules Checked:</span>
                          <span className={`font-medium ${
                            activity.ruleCompliance.subredditRulesChecked 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {activity.ruleCompliance.subredditRulesChecked ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Human-like Delay:</span>
                          <span className={`font-medium ${
                            activity.ruleCompliance.humanLikeDelay 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {activity.ruleCompliance.humanLikeDelay ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-reddit-dark mb-3">🎯 Performance Metrics</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Compliance Score:</span>
                          <span className="font-medium text-green-600">
                            {getComplianceScore(activity.ruleCompliance)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Community Response:</span>
                          <span className="font-medium text-blue-600">
                            {activity.result.engagement ? 'Positive' : 'Neutral'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Trust Building:</span>
                          <span className="font-medium text-green-600">✅ Contributing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="p-8 text-center text-reddit-gray">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-medium text-reddit-dark mb-2">No Activity Yet</h3>
            <p className="text-sm">Actions will appear here once the AI Co-pilot starts engaging with communities.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTransparency;