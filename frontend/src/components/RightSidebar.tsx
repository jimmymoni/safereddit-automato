import React, { useState } from 'react';

const RightSidebar: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState('14:30');
  const [postTone, setPostTone] = useState('friendly');

  return (
    <div className="sticky top-20 h-screen overflow-y-auto pb-20 px-4">
      {/* Post Scheduler Widget */}
      <div className="bg-white rounded-lg border border-reddit-border p-4 mb-4">
        <h3 className="font-semibold text-reddit-dark mb-4 flex items-center">
          <span className="mr-2">⏰</span>
          Quick Scheduler
        </h3>
        
        {/* Calendar Widget */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-reddit-gray mb-2">Select Date</label>
          <div className="bg-reddit-bg rounded-lg p-3">
            <div className="text-center mb-2">
              <h4 className="font-semibold text-reddit-dark">January 2025</h4>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="p-1 font-medium text-reddit-gray">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const date = i - 5; // Adjust for calendar alignment
                const isCurrentMonth = date > 0 && date <= 31;
                const isToday = date === 15;
                const isSelected = date === 18;
                
                return (
                  <button
                    key={i}
                    className={`p-1 text-xs rounded ${
                      !isCurrentMonth 
                        ? 'text-reddit-gray/50' 
                        : isSelected
                        ? 'bg-reddit-primary text-white'
                        : isToday
                        ? 'bg-reddit-accent text-white'
                        : 'hover:bg-reddit-bg text-reddit-dark'
                    }`}
                  >
                    {isCurrentMonth ? date : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-reddit-gray mb-2">Time</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full border border-reddit-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-reddit-primary"
          />
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700 text-sm">
              <span className="mr-2">✨</span>
              <div>
                <div className="font-medium">Optimal Time</div>
                <div className="text-xs">Peak engagement at 2:30 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-reddit-gray mb-2">Post Tone</label>
          <select
            value={postTone}
            onChange={(e) => setPostTone(e.target.value)}
            className="w-full border border-reddit-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-reddit-primary"
          >
            <option value="friendly">😊 Friendly</option>
            <option value="expert">🎓 Expert</option>
            <option value="casual">😎 Casual</option>
            <option value="humorous">😄 Humorous</option>
            <option value="professional">💼 Professional</option>
          </select>
        </div>

        {/* Quick Post Preview */}
        <div className="mb-4 p-3 bg-reddit-bg rounded-lg">
          <div className="text-xs text-reddit-gray mb-1">Preview</div>
          <div className="text-sm text-reddit-dark">
            "Ready to share some productivity tips with r/productivity 🚀"
          </div>
        </div>

        {/* Schedule Button */}
        <button className="w-full bg-reddit-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-reddit-primary/90 transition-colors">
          Schedule Post
        </button>
      </div>

      {/* Follow-up Reminder Box */}
      <div className="bg-white rounded-lg border border-reddit-border p-4 mb-4">
        <h3 className="font-semibold text-reddit-dark mb-4 flex items-center">
          <span className="mr-2">🔔</span>
          Follow-up Reminders
          <span className="ml-auto bg-reddit-primary text-white text-xs px-2 py-1 rounded-full">3</span>
        </h3>

        <div className="space-y-3">
          {/* Reminder Item */}
          <div className="border border-reddit-border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-reddit-dark">
                  "5 productivity hacks..."
                </h4>
                <p className="text-xs text-reddit-gray mt-1">
                  r/productivity • Posted 4 hours ago
                </p>
                <div className="flex items-center mt-2 text-xs">
                  <span className="text-green-600">↑ 47</span>
                  <span className="mx-2">•</span>
                  <span className="text-blue-600">💬 12</span>
                  <span className="mx-2">•</span>
                  <span className="text-reddit-gray">🕐 Reply due</span>
                </div>
              </div>
              <div className="ml-3">
                <button className="bg-reddit-accent text-white px-3 py-1 rounded text-xs font-medium hover:bg-reddit-accent/90">
                  Reply Now
                </button>
              </div>
            </div>
          </div>

          {/* Reminder Item */}
          <div className="border border-reddit-border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-reddit-dark">
                  "Best tools for entrepreneurs"
                </h4>
                <p className="text-xs text-reddit-gray mt-1">
                  r/entrepreneur • Posted 6 hours ago
                </p>
                <div className="flex items-center mt-2 text-xs">
                  <span className="text-green-600">↑ 23</span>
                  <span className="mx-2">•</span>
                  <span className="text-blue-600">💬 8</span>
                  <span className="mx-2">•</span>
                  <span className="text-reddit-gray">🕐 Follow up</span>
                </div>
              </div>
              <div className="ml-3">
                <button className="bg-reddit-accent text-white px-3 py-1 rounded text-xs font-medium hover:bg-reddit-accent/90">
                  Reply Now
                </button>
              </div>
            </div>
          </div>

          {/* Reminder Item */}
          <div className="border border-reddit-border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-reddit-dark">
                  "Morning routine that changed..."
                </h4>
                <p className="text-xs text-reddit-gray mt-1">
                  r/selfimprovement • Posted 8 hours ago
                </p>
                <div className="flex items-center mt-2 text-xs">
                  <span className="text-green-600">↑ 89</span>
                  <span className="mx-2">•</span>
                  <span className="text-blue-600">💬 31</span>
                  <span className="mx-2">•</span>
                  <span className="text-reddit-gray">🕐 Thank users</span>
                </div>
              </div>
              <div className="ml-3">
                <button className="bg-reddit-accent text-white px-3 py-1 rounded text-xs font-medium hover:bg-reddit-accent/90">
                  Reply Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-3 text-reddit-primary text-sm font-medium hover:bg-reddit-bg py-2 rounded">
          View All Reminders
        </button>
      </div>

      {/* Engagement Nudge */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-600 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-yellow-800">Engagement Tip</h4>
            <p className="text-xs text-yellow-700 mt-1">
              You've posted twice today but commented only once. Engage more to keep trust levels high.
            </p>
            <button className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-yellow-700">
              Find Comments to Reply
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg border border-reddit-border p-4">
        <h3 className="font-semibold text-reddit-dark mb-3">Today's Activity</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-reddit-gray">Posts scheduled</span>
            <span className="font-medium text-reddit-dark">3</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-reddit-gray">Comments made</span>
            <span className="font-medium text-reddit-dark">7</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-reddit-gray">Upvotes given</span>
            <span className="font-medium text-reddit-dark">24</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-reddit-gray">Karma gained</span>
            <span className="font-medium text-green-600">+18</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;