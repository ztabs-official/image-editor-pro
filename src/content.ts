// Content script for Image Editor Pro Chrome Extension

// Add a subtle indicator when hovering over images
let imageOverlay: HTMLDivElement | null = null;

function createImageOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    z-index: 10000;
    display: none;
  `;
  overlay.textContent = 'Right-click to edit with Image Editor Pro';
  document.body.appendChild(overlay);
  return overlay;
}

function showImageOverlay(img: HTMLImageElement, event: MouseEvent) {
  if (!imageOverlay) {
    imageOverlay = createImageOverlay();
  }
  
  const rect = img.getBoundingClientRect();
  imageOverlay.style.left = `${rect.left + window.scrollX}px`;
  imageOverlay.style.top = `${rect.top + window.scrollY - 30}px`;
  imageOverlay.style.display = 'block';
}

function hideImageOverlay() {
  if (imageOverlay) {
    imageOverlay.style.display = 'none';
  }
}

// Add event listeners to all images
function addImageListeners() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    // Skip if already processed
    if (img.dataset.imageEditorProcessed) return;
    
    img.dataset.imageEditorProcessed = 'true';
    
    img.addEventListener('mouseenter', (e) => {
      if (img.naturalWidth > 100 && img.naturalHeight > 100) {
        showImageOverlay(img, e as MouseEvent);
      }
    });
    
    img.addEventListener('mouseleave', hideImageOverlay);
  });
}

// Initial setup
addImageListeners();

// Watch for dynamically added images
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check if the added node is an image
          if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            if (!img.dataset.imageEditorProcessed) {
              img.dataset.imageEditorProcessed = 'true';
              
              img.addEventListener('mouseenter', (e) => {
                if (img.naturalWidth > 100 && img.naturalHeight > 100) {
                  showImageOverlay(img, e as MouseEvent);
                }
              });
              
              img.addEventListener('mouseleave', hideImageOverlay);
            }
          }
          
          // Check for images within the added node
          const images = element.querySelectorAll('img');
          images.forEach(img => {
            if (!img.dataset.imageEditorProcessed) {
              img.dataset.imageEditorProcessed = 'true';
              
              img.addEventListener('mouseenter', (e) => {
                if (img.naturalWidth > 100 && img.naturalHeight > 100) {
                  showImageOverlay(img, e as MouseEvent);
                }
              });
              
              img.addEventListener('mouseleave', hideImageOverlay);
            }
          });
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageImages') {
    const images = Array.from(document.querySelectorAll('img'));
    const imageData = images
      .filter(img => img.src && img.naturalWidth > 100 && img.naturalHeight > 100)
      .map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        alt: img.alt || 'Image'
      }))
      .slice(0, 20); // Limit to first 20 images
    
    sendResponse({ images: imageData });
  }
}); 