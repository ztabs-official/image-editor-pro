import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import ImageEditor from './components/ImageEditor';
import Gallery from './components/Gallery';
import { 
  ImageIcon, 
  Upload, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import './globals.css';

interface StoredImage {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
  size: number;
  starred: boolean;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success';
  progress: number;
  imageName?: string;
  imageId?: string;
}

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'editor'>('dashboard');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentImageName, setCurrentImageName] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image from URL parameter or storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageId = urlParams.get('imageId');
    
    if (imageId) {
      // Load specific image for editing
      loadImageForEditing(imageId);
    }
  }, []);

  const loadImageForEditing = async (imageId: string) => {
    try {
      const result = await chrome.storage.local.get(['images']);
      const images: StoredImage[] = result.images || [];
      const image = images.find(img => img.id === imageId);
      
      if (image) {
        setCurrentImage(image.dataUrl);
        setCurrentImageName(image.name);
        setCurrentView('editor');
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const saveImageToGallery = async (imageData: string, name: string) => {
    const imageId = `img_${Date.now()}`;
    const storedImage: StoredImage = {
      id: imageId,
      name: name,
      dataUrl: imageData,
      timestamp: Date.now(),
      size: Math.round(imageData.length * 0.75), // Rough size estimate
      starred: false
    };

    // Get existing images
    const result = await chrome.storage.local.get(['images']);
    const existingImages = result.images || [];
    
    // Add new image to the beginning
    const updatedImages = [storedImage, ...existingImages];
    
    // Save back to storage
    await chrome.storage.local.set({ images: updatedImages });
    
    return imageId;
  };

  const simulateProgress = (callback: () => void) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          callback();
          // Auto-redirect back to gallery after upload
          setTimeout(() => {
            setCurrentView('dashboard');
          }, 1500); // Give user 1.5 seconds to see success
        }, 500);
      }
      setUploadState(prev => ({ ...prev, progress }));
    }, 200);
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadState({ status: 'uploading', progress: 0 });
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        
        setUploadState({ status: 'processing', progress: 0 });
        
        simulateProgress(async () => {
          try {
            const imageId = await saveImageToGallery(result, file.name);
            setUploadState({ 
              status: 'success', 
              progress: 100, 
              imageName: file.name,
              imageId 
            });
          } catch (error) {
            console.error('Error saving image:', error);
            setUploadState({ status: 'idle', progress: 0 });
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadState({ status: 'uploading', progress: 0 });
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        
        setUploadState({ status: 'processing', progress: 0 });
        
        simulateProgress(async () => {
          try {
            const imageId = await saveImageToGallery(result, file.name);
            setUploadState({ 
              status: 'success', 
              progress: 100, 
              imageName: file.name,
              imageId 
            });
          } catch (error) {
            console.error('Error saving image:', error);
            setUploadState({ status: 'idle', progress: 0 });
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleSave = async (dataURL: string) => {
    try {
      // Save the edited image to gallery
      const imageId = `edited_${Date.now()}`;
      const storedImage: StoredImage = {
        id: imageId,
        name: `Edited_${currentImageName}`,
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
      link.download = `edited-${currentImageName}`;
      link.href = dataURL;
      link.click();
      
      // Show success message and return to gallery
      alert('Image saved to gallery and downloaded!');
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error saving image:', error);
      // Fallback to just downloading
      const link = document.createElement('a');
      link.download = `edited-${currentImageName}`;
      link.href = dataURL;
      link.click();
    }
  };

  const showUploadView = () => {
    setCurrentView('upload');
    setUploadState({ status: 'idle', progress: 0 });
    setSelectedImage(null);
  };

  // Render upload view
  if (currentView === 'upload') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Upload Image</h1>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* PRIMARY UPLOAD */}
            {uploadState.status === 'idle' && (
              <div className="space-y-6">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold mb-2">Drop image here or click to browse</h2>
                  <p className="text-muted-foreground mb-4">
                    Supports PNG, JPG, JPEG, GIF, WebP
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: 10MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* PROGRESS STATE */}
            {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
              <div className="space-y-8 text-center">
                <Upload className="h-20 w-20 mx-auto text-primary animate-pulse" />
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {uploadState.status === 'uploading' ? 'Uploading Image...' : 'Processing Image...'}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {uploadState.status === 'uploading' ? 'Reading your image file' : 'Optimizing and saving to gallery'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Progress value={uploadState.progress} className="w-full h-3" />
                  <p className="text-muted-foreground">
                    {Math.round(uploadState.progress)}% complete
                  </p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {uploadState.status === 'success' && (
              <div className="space-y-8 text-center">
                <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Image Ready!</h2>
                  <p className="text-muted-foreground mb-2">
                    {uploadState.imageName} has been saved to your gallery
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Returning to gallery in 1.5 seconds...
                  </p>
                </div>
                
                {selectedImage && (
                  <div className="border rounded-lg overflow-hidden max-w-md mx-auto">
                    <img
                      src={selectedImage}
                      alt="Uploaded"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <Button onClick={() => setCurrentView('dashboard')} size="lg">
                  View in Gallery Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render editor view
  if (currentView === 'editor' && currentImage) {
    return (
      <div className="h-screen">
        <ImageEditor imageSrc={currentImage} onSave={handleSave} />
      </div>
    );
  }

  // Render main dashboard/gallery view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-8">
          <ImageIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Image Editor Pro</h1>
        </div>

        <Gallery onUploadClick={showUploadView} />
      </div>
    </div>
  );
};

// Initialize the dashboard
const container = document.getElementById('dashboard-root');
if (container) {
  const root = createRoot(container);
  root.render(<Dashboard />);
} 