import React from 'react';

const LeftSidebar: React.FC = () => {
  return (
    <div className="sticky top-20 h-screen overflow-y-auto pb-20 px-4">
      {/* Profile Snapshot */}
      <div className="bg-white rounded-lg border border-reddit-border p-4 mb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-reddit-accent rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-white">U</span>
          </div>
          <div>
            <h3 className="font-semibold text-reddit-dark">u/automator</h3>
            <p className="text-sm text-reddit-gray">Active since Dec 2024</p>
          </div>
        </div>
        
        {/* Karma Display */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-reddit-upvote">1,247</div>
            <div className="text-xs text-reddit-gray">Post Karma</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-reddit-downvote">892</div>
            <div className="text-xs text-reddit-gray">Comment Karma</div>
          </div>
        </div>

        {/* Persona Health Meter */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-reddit-gray">Persona Health</span>
            <span className="text-sm font-medium text-green-600">Healthy</span>
          </div>
          <div className="w-full bg-reddit-bg rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
          </div>
          <p className="text-xs text-reddit-gray mt-1">Ready for active posting</p>
        </div>

        {/* Autopilot Status */}
        <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-purple-800">🧠 Reddit Scholar</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600">ACTIVE</span>
            </div>
          </div>
          <p className="text-xs text-purple-600">Next: Comment in r/productivity (2m)</p>
        </div>

        {/* Quick Stats */}
        <div className="text-xs text-reddit-gray space-y-1">
          <div className="flex justify-between">
            <span>Posts today:</span>
            <span className="font-medium">2/5</span>
          </div>
          <div className="flex justify-between">
            <span>Comments today:</span>
            <span className="font-medium">7/10</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white rounded-lg border border-reddit-border p-4">
        <h3 className="font-semibold text-reddit-dark mb-3">Quick Access</h3>
        
        <nav className="space-y-2">
          {/* Trending Threads */}
          <a href="#trending" className="flex items-center space-x-3 p-2 rounded-md hover:bg-reddit-bg group">
            <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center group-hover:bg-red-200">
              <span className="text-red-600">🔥</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-reddit-dark">Trending Threads</div>
              <div className="text-xs text-reddit-gray">In your niches</div>
            </div>
            <span className="bg-reddit-primary text-white text-xs px-2 py-1 rounded-full">12</span>
          </a>

          {/* Scheduled Posts */}
          <a href="#scheduled" className="flex items-center space-x-3 p-2 rounded-md hover:bg-reddit-bg group">
            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center group-hover:bg-yellow-200">
              <span className="text-yellow-600">⏳</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-reddit-dark">Scheduled Posts</div>
              <div className="text-xs text-reddit-gray">Next: in 2h 15m</div>
            </div>
            <span className="bg-reddit-accent text-white text-xs px-2 py-1 rounded-full">3</span>
          </a>

          {/* Content Vault */}
          <a href="#vault" className="flex items-center space-x-3 p-2 rounded-md hover:bg-reddit-bg group">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center group-hover:bg-blue-200">
              <span className="text-blue-600">📂</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-reddit-dark">Content Vault</div>
              <div className="text-xs text-reddit-gray">Ready to post</div>
            </div>
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">18</span>
          </a>

          {/* Reputation Tracker */}
          <a href="#reputation" className="flex items-center space-x-3 p-2 rounded-md hover:bg-reddit-bg group">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center group-hover:bg-green-200">
              <span className="text-green-600">📈</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-reddit-dark">Reputation Tracker</div>
              <div className="text-xs text-reddit-gray">+127 this week</div>
            </div>
          </a>

          {/* Niche Packs */}
          <a href="#niches" className="flex items-center space-x-3 p-2 rounded-md hover:bg-reddit-bg group">
            <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center group-hover:bg-purple-200">
              <span className="text-purple-600">🌟</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-reddit-dark">Niche Packs</div>
              <div className="text-xs text-reddit-gray">Premium content</div>
            </div>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">Pro</span>
          </a>
        </nav>

        {/* Bottom Section - Recent Activity */}
        <div className="mt-6 pt-4 border-t border-reddit-border">
          <h4 className="text-xs font-semibold text-reddit-gray uppercase tracking-wide mb-2">Recent Activity</h4>
          <div className="space-y-2">
            <div className="text-xs text-reddit-gray">
              <span className="text-green-600">↑</span> Posted in r/productivity
              <span className="block text-reddit-gray">2 hours ago</span>
            </div>
            <div className="text-xs text-reddit-gray">
              <span className="text-blue-600">💬</span> Commented in r/entrepreneur  
              <span className="block text-reddit-gray">4 hours ago</span>
            </div>
            <div className="text-xs text-reddit-gray">
              <span className="text-reddit-upvote">⚡</span> Auto-upvoted 3 posts
              <span className="block text-reddit-gray">6 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;