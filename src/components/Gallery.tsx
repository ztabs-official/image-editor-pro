import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { 
  Edit3, 
  Trash2, 
  Download, 
  Star, 
  Search,
  Upload,
  Grid,
  List,
  SortAsc,
  Calendar
} from 'lucide-react';

interface StoredImage {
  id: string;
  name: string;
  dataUrl: string;
  timestamp: number;
  size: number;
  starred: boolean;
}

interface GalleryProps {
  onUploadClick: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ onUploadClick }) => {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const result = await chrome.storage.local.get(['images']);
    setImages(result.images || []);
  };

  const filteredAndSortedImages = images
    .filter(img => 
      img.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.timestamp - a.timestamp; // Most recent first
    });

  const editImage = (imageId: string) => {
    chrome.storage.local.set({ currentImageId: imageId }, () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('editor.html')
      });
    });
  };

  const downloadImage = (image: StoredImage) => {
    const link = document.createElement('a');
    link.download = image.name;
    link.href = image.dataUrl;
    link.click();
  };

  const deleteImage = async (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      const updatedImages = images.filter(img => img.id !== imageId);
      await chrome.storage.local.set({ images: updatedImages });
      setImages(updatedImages);
    }
  };

  const toggleStar = async (imageId: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, starred: !img.starred } : img
    );
    await chrome.storage.local.set({ images: updatedImages });
    setImages(updatedImages);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Your Gallery</h2>
          <p className="text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        
        <Button onClick={onUploadClick} size="lg">
          <Upload className="h-4 w-4 mr-2" />
          Upload New Image
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('date')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Date
          </Button>
          
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            <SortAsc className="h-4 w-4 mr-2" />
            Name
          </Button>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedImages.length === 0 && (
        <div className="text-center py-12">
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'No images found' : 'No images yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? `No images match "${searchTerm}"`
              : 'Upload your first image to get started'
            }
          </p>
          {!searchTerm && (
            <Button onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {viewMode === 'grid' && filteredAndSortedImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedImages.map((image) => (
            <Card key={image.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant={image.starred ? 'default' : 'secondary'}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleStar(image.id)}
                    >
                      <Star className={`h-4 w-4 ${image.starred ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium truncate mb-1">{image.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {formatDate(image.timestamp)} • {formatFileSize(image.size)}
                  </p>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => editImage(image.id)}
                      className="flex-1"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadImage(image)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteImage(image.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Gallery List */}
      {viewMode === 'list' && filteredAndSortedImages.length > 0 && (
        <div className="space-y-2">
          {filteredAndSortedImages.map((image) => (
            <Card key={image.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <img
                  src={image.dataUrl}
                  alt={image.name}
                  className="w-16 h-16 object-cover rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{image.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(image.timestamp)} • {formatFileSize(image.size)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={image.starred ? 'default' : 'outline'}
                    onClick={() => toggleStar(image.id)}
                  >
                    <Star className={`h-4 w-4 ${image.starred ? 'fill-current' : ''}`} />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => editImage(image.id)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadImage(image)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteImage(image.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery; 