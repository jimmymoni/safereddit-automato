import React, { useState } from 'react';

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

const AutopilotControl: React.FC = () => {
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
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
            {isAutopilotActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <button
            onClick={() => setIsAutopilotActive(!isAutopilotActive)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-reddit-primary focus:ring-offset-2 ${
              isAutopilotActive ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isAutopilotActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Autopilot Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium text-green-800">Account Health</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">Excellent</div>
          <div className="text-xs text-green-600">Risk Level: Low</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">Today's Actions</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">12/15</div>
          <div className="text-xs text-blue-600">80% Complete</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-800">AI Insights</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">3</div>
          <div className="text-xs text-purple-600">New Opportunities</div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-800">Next Action</div>
          <div className="text-sm font-bold text-orange-600 mt-1">Comment in</div>
          <div className="text-xs text-orange-600">r/productivity (2m)</div>
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
        <h4 className="font-semibold text-reddit-dark mb-4">Autopilot Queue (Next 24h)</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {[
            { time: '2:30 PM', action: 'Post', target: 'r/productivity', content: '"5 habits that doubled my output"', confidence: 'High' },
            { time: '3:45 PM', action: 'Comment', target: 'r/entrepreneur', content: 'Reply to trending post about startups', confidence: 'Medium' },
            { time: '5:20 PM', action: 'Upvote', target: '3 posts', content: 'Strategic upvoting in target communities', confidence: 'Low Risk' },
            { time: '7:15 PM', action: 'Post', target: 'r/selfimprovement', content: '"My morning routine transformation"', confidence: 'High' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-reddit-bg rounded-lg text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-reddit-gray">{item.time}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.action === 'Post' ? 'bg-blue-100 text-blue-800' :
                  item.action === 'Comment' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {item.action}
                </span>
                <span className="text-reddit-dark">{item.target}</span>
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
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-3">
        <button 
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            isAutopilotActive 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-reddit-primary text-white hover:bg-reddit-primary/90'
          }`}
          onClick={() => setIsAutopilotActive(!isAutopilotActive)}
        >
          {isAutopilotActive ? '⏹️ Stop Autopilot' : '🚀 Start Autopilot'}
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