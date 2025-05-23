// Background script for Image Editor Pro Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for images
  chrome.contextMenus.create({
    id: 'edit-image',
    title: 'Edit with Image Editor Pro',
    contexts: ['image']
  });

  // Create context menu for page
  chrome.contextMenus.create({
    id: 'capture-page',
    title: 'Capture & Edit Screenshot',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'edit-image' && info.srcUrl) {
    // Store the image URL and open editor
    chrome.storage.local.set({ currentImage: info.srcUrl }, () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('editor.html')
      });
    });
  } else if (info.menuItemId === 'capture-page' && tab?.id) {
    // Capture screenshot and open editor
    chrome.tabs.captureVisibleTab(undefined, { format: 'png' }, (dataUrl) => {
      chrome.storage.local.set({ currentImage: dataUrl }, () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('editor.html')
        });
      });
    });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openEditor') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('editor.html')
    });
    sendResponse({ success: true });
  }
}); 