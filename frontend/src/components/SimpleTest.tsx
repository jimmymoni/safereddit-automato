import React from 'react';

const SimpleTest: React.FC = () => {
  console.log('SimpleTest component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#ff4500', marginBottom: '1rem' }}>
          ✅ React App Working
        </h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          This is a simple component with no external dependencies. 
          If this loads fast, the issue is with heavy components.
        </p>
        <div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              backgroundColor: '#ff4500',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              margin: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/test'}
            style={{
              backgroundColor: '#0079d3',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              margin: '0.25rem',
              cursor: 'pointer'
            }}
          >
            TestPage
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;