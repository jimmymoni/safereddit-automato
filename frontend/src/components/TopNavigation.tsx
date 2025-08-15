import React, { useState } from 'react';

interface TopNavigationProps {
  onMobileMenuToggle?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onMobileMenuToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-reddit-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 text-reddit-gray hover:text-reddit-primary"
              onClick={onMobileMenuToggle}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              {/* Logo Icon */}
              <div className="w-8 h-8 bg-reddit-primary rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {/* Brand Name */}
              <h1 className="text-xl font-bold text-reddit-dark">
                SafeReddit
                <span className="text-reddit-primary ml-1">Bot</span>
              </h1>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-reddit-gray" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-reddit-border rounded-full bg-reddit-bg focus:outline-none focus:ring-2 focus:ring-reddit-primary focus:border-transparent placeholder-reddit-gray text-sm"
                placeholder="Search subreddits, posts, keywords..."
              />
            </div>
          </div>

          {/* Right Side - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Icon */}
            <button className="md:hidden p-2 text-reddit-gray hover:text-reddit-primary">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-reddit-gray hover:text-reddit-primary transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5zm0 0V4a3 3 0 013 3v10z" />
              </svg>
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-reddit-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">3</span>
              </div>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-reddit-bg transition-colors"
              >
                <div className="w-8 h-8 bg-reddit-accent rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">U</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-reddit-dark">u/automator</p>
                  <p className="text-xs text-reddit-gray">1,247 karma</p>
                </div>
                <svg className="h-4 w-4 text-reddit-gray" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-reddit-border py-1 z-50">
                  <a href="#profile" className="block px-4 py-2 text-sm text-reddit-dark hover:bg-reddit-bg">
                    👤 Profile
                  </a>
                  <a href="#settings" className="block px-4 py-2 text-sm text-reddit-dark hover:bg-reddit-bg">
                    ⚙️ Settings
                  </a>
                  <a href="#analytics" className="block px-4 py-2 text-sm text-reddit-dark hover:bg-reddit-bg">
                    📊 Analytics
                  </a>
                  <hr className="my-1 border-reddit-border" />
                  <a href="#logout" className="block px-4 py-2 text-sm text-red-600 hover:bg-reddit-bg">
                    🚪 Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;