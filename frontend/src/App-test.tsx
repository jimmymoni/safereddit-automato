import React from 'react';

// Simple test component to bypass auth issues
function AppTest() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          SafeReddit Automator - Test Mode
        </h1>
        <p className="text-gray-600 mb-4">
          Testing if React app loads without auth system
        </p>
        <button 
          onClick={() => alert('React is working!')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default AppTest;