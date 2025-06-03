// Background script for Image Editor Pro Chrome Extension

interface StoredImage {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
  size: number;
  starred: boolean;
}

// Function to download image and convert to data URL
async function downloadImageAsDataURL(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Function to add image to gallery and set as current
async function addImageToGalleryAndSetCurrent(dataUrl: string, imageName: string): Promise<void> {
  const imageId = `context_${Date.now()}`;
  const storedImage: StoredImage = {
    id: imageId,
    name: imageName,
    dataUrl: dataUrl,
    timestamp: Date.now(),
    size: Math.round(dataUrl.length * 0.75),
    starred: false
  };

  // Get existing images and add the new one
  const result = await chrome.storage.local.get(['images']);
  const existingImages: StoredImage[] = result.images || [];
  const updatedImages = [storedImage, ...existingImages];
  
  // Save back to storage and set as current image
  await chrome.storage.local.set({ 
    images: updatedImages,
    currentImageId: imageId
  });
}

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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'edit-image' && info.srcUrl) {
    try {
      // Download the image and convert to data URL
      const dataUrl = await downloadImageAsDataURL(info.srcUrl);
      
      // Extract filename from URL or use default
      const url = new URL(info.srcUrl);
      const pathname = url.pathname;
      const filename = pathname.split('/').pop() || 'image';
      const imageName = filename.includes('.') ? filename : `${filename}.jpg`;
      
      // Add to gallery and set as current
      await addImageToGalleryAndSetCurrent(dataUrl, imageName);
      
      // Open editor
      chrome.tabs.create({
        url: chrome.runtime.getURL('editor.html')
      });
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback: just open editor without image
      chrome.tabs.create({
        url: chrome.runtime.getURL('editor.html')
      });
    }
  } else if (info.menuItemId === 'capture-page' && tab?.id) {
    // Capture screenshot and open editor
    chrome.tabs.captureVisibleTab(undefined, { format: 'png' }, async (dataUrl) => {
      try {
        const imageName = `Screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        await addImageToGalleryAndSetCurrent(dataUrl, imageName);
        
        chrome.tabs.create({
          url: chrome.runtime.getURL('editor.html')
        });
      } catch (error) {
        console.error('Error processing screenshot:', error);
        // Fallback: store old way
        chrome.storage.local.set({ currentImage: dataUrl }, () => {
          chrome.tabs.create({
            url: chrome.runtime.getURL('editor.html')
          });
        });
      }
    });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'openEditor') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('editor.html')
    });
    sendResponse({ success: true });
  }
}); 