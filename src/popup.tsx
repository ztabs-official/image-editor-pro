import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';

const Popup: React.FC = () => {
  useEffect(() => {
    // Immediately open the full dashboard when extension is clicked
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
    
    // Close the popup
    window.close();
  }, []);

  // Show minimal loading while redirecting
  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Opening Image Editor...</p>
      </div>
    </div>
  );
};

// Initialize the popup
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 