import React, { useState } from 'react';

const MobileBottomNav: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'vault', name: 'Vault', icon: '📂' },
    { id: 'trends', name: 'Trends', icon: '🔥' },
    { id: 'schedule', name: 'Schedule', icon: '⏰' }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-reddit-border z-40">
        <div className="flex justify-around items-center py-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'text-reddit-primary bg-reddit-primary/10'
                  : 'text-reddit-gray'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-reddit-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-reddit-primary/90 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Hamburger Menu Overlay for Mobile Sidebar */}
      <div className="lg:hidden">
        <button className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-reddit-border">
          <svg className="w-6 h-6 text-reddit-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default MobileBottomNav;