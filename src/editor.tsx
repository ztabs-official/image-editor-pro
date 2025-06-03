import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ImageEditor from './components/ImageEditor';
import { Button } from './components/ui/button';
import { ImageIcon, Upload, ArrowLeft } from 'lucide-react';
import './globals.css';

interface StoredImage {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
  size: number;
  starred: boolean;
}

const EditorApp: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the image ID from Chrome storage and load the image
    chrome.storage.local.get(['currentImageId', 'currentImage'], async (result) => {
      if (result.currentImageId) {
        // Load the image from the gallery (new flow)
        const imagesResult = await chrome.storage.local.get(['images']);
        const images: StoredImage[] = imagesResult.images || [];
        const currentImage = images.find(img => img.id === result.currentImageId);
        
        if (currentImage) {
          setImageSrc(currentImage.dataUrl);
          setImageName(currentImage.name);
        }
      } else if (result.currentImage) {
        // Handle legacy format (fallback)
        const imageUrl = result.currentImage;
        
        if (imageUrl.startsWith('data:')) {
          // It's already a data URL
          setImageSrc(imageUrl);
          setImageName('External_Image.jpg');
        } else {
          // It's a URL, we need to download it
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setImageSrc(dataUrl);
              
              // Extract filename from URL
              try {
                const url = new URL(imageUrl);
                const pathname = url.pathname;
                const filename = pathname.split('/').pop() || 'image';
                const imageName = filename.includes('.') ? filename : `${filename}.jpg`;
                setImageName(imageName);
              } catch {
                setImageName('External_Image.jpg');
              }
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            console.error('Error loading external image:', error);
            setImageName('External_Image.jpg');
          }
        }
        
        // Clear the legacy currentImage after loading
        chrome.storage.local.set({ currentImage: undefined });
      }
      setIsLoading(false);
    });
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageSrc(result);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (dataURL: string) => {
    try {
      // Save the edited image to gallery
      const imageId = `edited_${Date.now()}`;
      const storedImage: StoredImage = {
        id: imageId,
        name: `Edited_${imageName}`,
        dataUrl: dataURL,
        timestamp: Date.now(),
        size: Math.round(dataURL.length * 0.75),
        starred: false
      };

      // Get existing images and add the new one
      const result = await chrome.storage.local.get(['images']);
      const existingImages: StoredImage[] = result.images || [];
      const updatedImages = [storedImage, ...existingImages];
      
      // Save back to storage
      await chrome.storage.local.set({ images: updatedImages });
      
      // Also download the file
      const link = document.createElement('a');
      link.download = `edited-${imageName}`;
      link.href = dataURL;
      link.click();
      
      // Show success message
      alert('Image saved to gallery and downloaded!');
    } catch (error) {
      console.error('Error saving image:', error);
      // Fallback to just downloading
      const link = document.createElement('a');
      link.download = `edited-${imageName}`;
      link.href = dataURL;
      link.click();
    }
  };

  const goBack = () => {
    // Go back to the gallery/dashboard
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard.html')
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <ImageIcon className="h-24 w-24 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">No Image Selected</h1>
          <p className="text-muted-foreground mb-6">
            Please select an image to start editing
          </p>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </label>
              </Button>
            </div>
            
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ImageEditor imageSrc={imageSrc} onSave={handleSave} />
    </div>
  );
};

// Initialize the editor
const container = document.getElementById('editor-root');
if (container) {
  const root = createRoot(container);
  root.render(<EditorApp />);
} 