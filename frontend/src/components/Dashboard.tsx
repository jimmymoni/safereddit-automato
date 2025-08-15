import React, { useState } from 'react';
import TopNavigation from './TopNavigation';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import RightSidebar from './RightSidebar';
import MobileBottomNav from './MobileBottomNav';
import MobileSidebar from './MobileSidebar';

const Dashboard: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <TopNavigation onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main Layout Container */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 shrink-0">
          <LeftSidebar />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 px-4 lg:px-6 pb-20 lg:pb-6">
          <MainContent />
        </div>
        
        {/* Right Sidebar - Hidden on mobile and tablet */}
        <div className="hidden xl:block w-80 shrink-0">
          <RightSidebar />
        </div>
      </div>
      
      {/* Mobile Bottom Navigation - Only shown on mobile */}
      <div className="block lg:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Dashboard;