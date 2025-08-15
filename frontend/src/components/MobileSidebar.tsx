import React from 'react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-reddit-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-reddit-dark">SafeReddit Bot</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-reddit-bg rounded-lg"
            >
              <svg className="w-6 h-6 text-reddit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Profile Snapshot - Mobile Version */}
          <div className="bg-reddit-bg rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-reddit-accent rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">U</span>
              </div>
              <div>
                <h3 className="font-semibold text-reddit-dark">u/automator</h3>
                <p className="text-sm text-reddit-gray">Active since Dec 2024</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-reddit-upvote">1,247</div>
                <div className="text-xs text-reddit-gray">Post Karma</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-reddit-downvote">892</div>
                <div className="text-xs text-reddit-gray">Comment Karma</div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <nav className="space-y-2">
            <a href="#dashboard" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-reddit-bg">
              <span className="text-xl">📊</span>
              <span className="font-medium text-reddit-dark">Dashboard</span>
            </a>
            <a href="#trends" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-reddit-bg">
              <span className="text-xl">🔥</span>
              <span className="font-medium text-reddit-dark">Trending Threads</span>
            </a>
            <a href="#scheduled" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-reddit-bg">
              <span className="text-xl">⏳</span>
              <span className="font-medium text-reddit-dark">Scheduled Posts</span>
            </a>
            <a href="#vault" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-reddit-bg">
              <span className="text-xl">📂</span>
              <span className="font-medium text-reddit-dark">Content Vault</span>
            </a>
            <a href="#reputation" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-reddit-bg">
              <span className="text-xl">📈</span>
              <span className="font-medium text-reddit-dark">Reputation Tracker</span>
            </a>
            <a href="#niches" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-reddit-bg">
              <span className="text-xl">🌟</span>
              <span className="font-medium text-reddit-dark">Niche Packs</span>
            </a>
          </nav>

          {/* Mobile Quick Actions */}
          <div className="mt-6 pt-4 border-t border-reddit-border">
            <h4 className="text-sm font-semibold text-reddit-gray uppercase tracking-wide mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center space-x-2 p-3 bg-reddit-primary text-white rounded-lg font-medium">
                <span>➕</span>
                <span>Create Post</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 p-3 bg-reddit-accent text-white rounded-lg font-medium">
                <span>⏰</span>
                <span>Schedule Content</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;