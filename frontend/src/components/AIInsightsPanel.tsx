import React from 'react';

const AIInsightsPanel: React.FC = () => {
  const insights = [
    {
      id: 1,
      type: 'opportunity',
      icon: '🎯',
      title: 'High-Potential Thread Detected',
      description: 'r/entrepreneur thread about "bootstrapping" is trending. Engagement window: next 2 hours.',
      confidence: 'High',
      action: 'Prepare insightful comment about lean startup strategies',
      priority: 'high'
    },
    {
      id: 2,
      type: 'timing',
      icon: '⏰',
      title: 'Optimal Posting Window',
      description: 'r/productivity shows peak activity in 45 minutes. Perfect for your prepared post.',
      confidence: 'Very High',
      action: 'Schedule "Morning routine transformation" post',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'safety',
      icon: '🛡️',
      title: 'Account Health Check',
      description: 'Engagement ratio is optimal. Ready for increased activity level.',
      confidence: 'High',
      action: 'Safe to proceed with planned actions',
      priority: 'low'
    },
    {
      id: 4,
      type: 'learning',
      icon: '📚',
      title: 'Pattern Recognition',
      description: 'Posts with "transformation" in title show 34% higher engagement in your niches.',
      confidence: 'Medium',
      action: 'Incorporate transformation theme in upcoming content',
      priority: 'medium'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-blue-100 text-blue-800';
      case 'timing': return 'bg-purple-100 text-purple-800';
      case 'safety': return 'bg-green-100 text-green-800';
      case 'learning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-reddit-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-reddit-dark">AI Scholar Insights</h2>
            <p className="text-sm text-reddit-gray">Real-time Reddit intelligence and recommendations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600">Analyzing</span>
        </div>
      </div>

      {/* AI Processing Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">Communities Analyzed</div>
              <div className="text-2xl font-bold text-blue-600">247</div>
            </div>
            <div className="text-2xl text-blue-600">📊</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-800">Trends Tracked</div>
              <div className="text-2xl font-bold text-purple-600">1,342</div>
            </div>
            <div className="text-2xl text-purple-600">📈</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-800">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">87.3%</div>
            </div>
            <div className="text-2xl text-green-600">🎯</div>
          </div>
        </div>
      </div>

      {/* AI Insights List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-reddit-dark text-lg mb-4">Current Insights & Recommendations</h3>
        
        {insights.map(insight => (
          <div key={insight.id} className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(insight.type)}`}>
                  <span className="text-lg">{insight.icon}</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-reddit-dark">{insight.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${getTypeColor(insight.type)}`}>
                      {insight.type.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-reddit-gray">
                      {insight.confidence} Confidence
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-reddit-gray mb-3">{insight.description}</p>
                
                <div className="bg-white/50 rounded-md p-3 border border-white/20">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-reddit-dark">🎯 Recommended Action:</span>
                    <span className="text-sm text-reddit-dark">{insight.action}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Learning Section */}
      <div className="mt-8 pt-6 border-t border-reddit-border">
        <h3 className="font-semibold text-reddit-dark text-lg mb-4">AI Learning Progress</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-reddit-bg rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-reddit-dark">Content Optimization</span>
              <span className="text-sm text-reddit-gray">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
            <p className="text-xs text-reddit-gray mt-1">Learning from 1,247 successful posts</p>
          </div>

          <div className="bg-reddit-bg rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-reddit-dark">Timing Prediction</span>
              <span className="text-sm text-reddit-gray">87%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
            <p className="text-xs text-reddit-gray mt-1">Analyzing engagement patterns across 45 subreddits</p>
          </div>

          <div className="bg-reddit-bg rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-reddit-dark">Community Analysis</span>
              <span className="text-sm text-reddit-gray">94%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
            <p className="text-xs text-reddit-gray mt-1">Understanding community preferences and rules</p>
          </div>

          <div className="bg-reddit-bg rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-reddit-dark">Safety Monitoring</span>
              <span className="text-sm text-reddit-gray">99%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '99%' }}></div>
            </div>
            <p className="text-xs text-reddit-gray mt-1">Maintaining perfect Reddit TOS compliance</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          📊 View Detailed Analytics
        </button>
        <button className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
          🎯 Apply Recommendations
        </button>
        <button className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
          ⚙️ Adjust Learning Parameters
        </button>
      </div>
    </div>
  );
};

export default AIInsightsPanel;