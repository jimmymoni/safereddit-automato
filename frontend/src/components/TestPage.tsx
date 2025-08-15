import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-reddit-bg flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-reddit-primary mb-4">
          🎉 App is Working!
        </h1>
        <p className="text-gray-600 mb-6">
          The frontend is loading properly. No more hanging!
        </p>
        <div className="space-y-2">
          <a 
            href="/dashboard" 
            className="block bg-reddit-primary text-white py-2 px-4 rounded hover:bg-reddit-primary/90"
          >
            Go to Dashboard
          </a>
          <a 
            href="/reddit-connect" 
            className="block bg-reddit-accent text-white py-2 px-4 rounded hover:bg-reddit-accent/90"
          >
            Reddit Connect
          </a>
          <a 
            href="/" 
            className="block bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Landing Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestPage;