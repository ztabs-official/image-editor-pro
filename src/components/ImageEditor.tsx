import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { 
  Download, 
  RotateCcw, 
  RotateCw, 
  Crop, 
  Type, 
  Brush, 
  Circle as CircleIcon,
  Square,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  FlipVertical,
  FileType,
  Trash2,
  Triangle,
  Star,
  ArrowRight,
  MousePointer
} from 'lucide-react';
import Konva from 'konva';

interface ImageEditorProps {
  imageSrc: string;
  onSave?: (dataURL: string) => void;
}

interface FilterValues {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hue: number;
  sepia: number;
  vintage: number;
  grayscale: number;
  invert: number;
  opacity: number;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState('filters');
  const [tool, setTool] = useState<'select' | 'brush' | 'text' | 'rect' | 'circle' | 'crop'>('select');
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [jpegQuality, setJpegQuality] = useState(0.8);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  
  const [filters, setFilters] = useState<FilterValues>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    hue: 0,
    sepia: 0,
    vintage: 0,
    grayscale: 0,
    invert: 0,
    opacity: 100
  });

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const currentPath = useRef<Konva.Line | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      const aspectRatio = img.width / img.height;
      const maxWidth = 800;
      const maxHeight = 600;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      setStageSize({ width, height });
      
      // Set initial resize values to current display size
      setResizeWidth(Math.round(width));
      setResizeHeight(Math.round(height));
    };
  }, [imageSrc]);

  // Apply filters to image
  useEffect(() => {
    if (imageRef.current) {
      // Clear cache first to avoid lifecycle issues
      imageRef.current.clearCache();
      
      // Build filters array based on active filters
      const activeFilters = [];
      
      if (filters.brightness !== 0) activeFilters.push(Konva.Filters.Brighten);
      if (filters.contrast !== 0) activeFilters.push(Konva.Filters.Contrast);
      if (filters.saturation !== 0) activeFilters.push(Konva.Filters.HSV);
      if (filters.blur > 0) activeFilters.push(Konva.Filters.Blur);
      if (filters.sepia > 0) activeFilters.push(Konva.Filters.Sepia);
      if (filters.grayscale > 0) activeFilters.push(Konva.Filters.Grayscale);
      if (filters.invert > 0) activeFilters.push(Konva.Filters.Invert);
      
      imageRef.current.filters(activeFilters);
      
      // Apply filter values
      imageRef.current.brightness(filters.brightness / 100);
      imageRef.current.contrast(filters.contrast / 100);
      imageRef.current.saturation(filters.saturation / 100 + 1);
      imageRef.current.hue(filters.hue);
      imageRef.current.blurRadius(filters.blur);
      
      // Apply vintage effect as combination of filters
      if (filters.vintage > 0) {
        const vintageAmount = filters.vintage / 100;
        imageRef.current.brightness(vintageAmount * 0.2);
        imageRef.current.contrast(vintageAmount * 0.3);
        imageRef.current.saturation(1 - vintageAmount * 0.3);
      }
      
      imageRef.current.opacity(filters.opacity / 100);
      
      // Only cache if we have active filters
      if (activeFilters.length > 0) {
        imageRef.current.cache();
      }
      
      layerRef.current?.batchDraw();
    }
  }, [filters]);

  // Center and position image when loaded
  useEffect(() => {
    if (imageRef.current && image) {
      // Set up image for proper transforms
      imageRef.current.offsetX(imageRef.current.width() / 2);
      imageRef.current.offsetY(imageRef.current.height() / 2);
      imageRef.current.x(stageSize.width / 2);
      imageRef.current.y(stageSize.height / 2);
      layerRef.current?.batchDraw();
    }
  }, [image, stageSize]);

  const handleFilterChange = (filterName: keyof FilterValues, value: number[]) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value[0]
    }));
  };

  const resetFilters = () => {
    setFilters({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
      hue: 0,
      sepia: 0,
      vintage: 0,
      grayscale: 0,
      invert: 0,
      opacity: 100
    });
  };

  const rotateImage = (direction: 'left' | 'right') => {
    if (imageRef.current) {
      const currentRotation = imageRef.current.rotation();
      const newRotation = currentRotation + (direction === 'right' ? 90 : -90);
      
      // Set rotation around center
      imageRef.current.rotation(newRotation);
      imageRef.current.offsetX(imageRef.current.width() / 2);
      imageRef.current.offsetY(imageRef.current.height() / 2);
      imageRef.current.x(stageSize.width / 2);
      imageRef.current.y(stageSize.height / 2);
      
      layerRef.current?.batchDraw();
    }
  };

  const flipImage = (direction: 'horizontal' | 'vertical') => {
    if (imageRef.current) {
      if (direction === 'horizontal') {
        const currentScaleX = imageRef.current.scaleX();
        imageRef.current.scaleX(currentScaleX * -1);
        // Adjust position to keep image centered
        imageRef.current.offsetX(imageRef.current.width() / 2);
        imageRef.current.x(stageSize.width / 2);
      } else {
        const currentScaleY = imageRef.current.scaleY();
        imageRef.current.scaleY(currentScaleY * -1);
        // Adjust position to keep image centered
        imageRef.current.offsetY(imageRef.current.height() / 2);
        imageRef.current.y(stageSize.height / 2);
      }
      layerRef.current?.batchDraw();
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'brush') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      const newLine = new Konva.Line({
        stroke: brushColor,
        strokeWidth: brushSize,
        globalCompositeOperation: 'source-over',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y, pos.x, pos.y],
        id: `line-${Date.now()}`
      });
      
      layerRef.current?.add(newLine);
      currentPath.current = newLine;
    } else if (tool === 'crop') {
      setIsCropping(true);
      const pos = e.target.getStage().getPointerPosition();
      const newCropRect = {
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0
      };
      setCropRect(newCropRect);
    } else {
      // Selection mode
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
        return;
      }
      setSelectedId(e.target.id());
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (tool === 'brush' && isDrawing && currentPath.current) {
      const newPoints = currentPath.current.points().concat([point.x, point.y]);
      currentPath.current.points(newPoints);
      layerRef.current?.batchDraw();
    } else if (tool === 'crop' && isCropping && cropRect) {
      // Update crop rectangle size
      const newCropRect = {
        x: cropRect.x,
        y: cropRect.y,
        width: point.x - cropRect.x,
        height: point.y - cropRect.y
      };
      setCropRect(newCropRect);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsCropping(false);
    currentPath.current = null;
  };

  const getCanvasPosition = () => {
    if (canvasContainerRef.current && stageRef.current) {
      const container = canvasContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      return {
        x: containerRect.left + (container.offsetWidth - stageSize.width * scale) / 2,
        y: containerRect.top + (container.offsetHeight - stageSize.height * scale) / 2
      };
    }
    return { x: 0, y: 0 };
  };

  const addText = () => {
    if (layerRef.current) {
      const textNode = new Konva.Text({
        x: 50,
        y: 50,
        text: 'Double click to edit',
        fontSize: 20,
        fill: brushColor,
        draggable: true,
        id: `text-${Date.now()}`
      });
      
      // Enable text editing on double click
      textNode.on('dblclick', () => {
        // Get canvas position and text position
        const canvasPos = getCanvasPosition();
        const textPosition = textNode.position();
        
        // Calculate absolute position with proper scaling
        const areaPosition = {
          x: canvasPos.x + (textPosition.x * scale),
          y: canvasPos.y + (textPosition.y * scale)
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = (textNode.width() * scale) + 'px';
        textarea.style.height = (textNode.height() * scale) + 'px';
        textarea.style.fontSize = (textNode.fontSize() * scale) + 'px';
        textarea.style.border = '2px solid #3b82f6';
        textarea.style.padding = '2px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'white';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = 'Arial, sans-serif';
        textarea.style.color = textNode.fill() as string;
        textarea.style.zIndex = '10000';
        
        textarea.focus();
        textarea.select();
        
        const cleanup = () => {
          if (document.body.contains(textarea)) {
            textNode.text(textarea.value);
            document.body.removeChild(textarea);
            layerRef.current?.batchDraw();
          }
        };
        
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            cleanup();
          }
          if (e.key === 'Escape') {
            cleanup();
          }
        });
        
        textarea.addEventListener('blur', cleanup);
        
        // Auto-remove after 30 seconds as fallback
        setTimeout(cleanup, 30000);
      });
      
      layerRef.current.add(textNode);
      layerRef.current.batchDraw();
    }
  };

  const addRectangle = () => {
    if (layerRef.current) {
      const rect = new Konva.Rect({
        x: 50,
        y: 50,
        width: 100,
        height: 60,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: brushSize,
        draggable: true,
        id: `rect-${Date.now()}`
      });
      
      layerRef.current.add(rect);
      layerRef.current.batchDraw();
    }
  };

  const addCircle = () => {
    if (layerRef.current) {
      const circle = new Konva.Circle({
        x: 100,
        y: 100,
        radius: 50,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: brushSize,
        draggable: true,
        id: `circle-${Date.now()}`
      });
      
      layerRef.current.add(circle);
      layerRef.current.batchDraw();
    }
  };

  const addTriangle = () => {
    if (layerRef.current) {
      const triangle = new Konva.RegularPolygon({
        x: 100,
        y: 100,
        sides: 3,
        radius: 50,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: brushSize,
        draggable: true,
        id: `triangle-${Date.now()}`
      });
      
      layerRef.current.add(triangle);
      layerRef.current.batchDraw();
    }
  };

  const addStar = () => {
    if (layerRef.current) {
      const star = new Konva.Star({
        x: 100,
        y: 100,
        numPoints: 5,
        innerRadius: 30,
        outerRadius: 50,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: brushSize,
        draggable: true,
        id: `star-${Date.now()}`
      });
      
      layerRef.current.add(star);
      layerRef.current.batchDraw();
    }
  };

  const addArrow = () => {
    if (layerRef.current) {
      const arrow = new Konva.Arrow({
        x: 50,
        y: 100,
        points: [0, 0, 100, 0],
        pointerLength: 20,
        pointerWidth: 20,
        fill: brushColor,
        stroke: brushColor,
        strokeWidth: brushSize,
        draggable: true,
        id: `arrow-${Date.now()}`
      });
      
      layerRef.current.add(arrow);
      layerRef.current.batchDraw();
    }
  };

  const addIcon = (iconType: string) => {
    if (layerRef.current) {
      let iconText = '';
      switch (iconType) {
        case 'smile': iconText = '😊'; break;
        case 'heart': iconText = '❤️'; break;
        case 'star': iconText = '⭐'; break;
        case 'sun': iconText = '☀️'; break;
        case 'camera': iconText = '📷'; break;
        case 'music': iconText = '🎵'; break;
        case 'fire': iconText = '🔥'; break;
        case 'crown': iconText = '👑'; break;
        default: iconText = '😊';
      }
      
      const icon = new Konva.Text({
        x: 100,
        y: 100,
        text: iconText,
        fontSize: 40,
        draggable: true,
        id: `icon-${Date.now()}`
      });
      
      layerRef.current.add(icon);
      layerRef.current.batchDraw();
    }
  };

  const applyCrop = () => {
    if (cropRect && stageRef.current && imageRef.current && image && cropRect.width > 0 && cropRect.height > 0) {
      // Ensure positive dimensions
      const x = cropRect.width < 0 ? cropRect.x + cropRect.width : cropRect.x;
      const y = cropRect.height < 0 ? cropRect.y + cropRect.height : cropRect.y;
      const width = Math.abs(cropRect.width);
      const height = Math.abs(cropRect.height);
      
      // Detach transformer
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      setSelectedId(null);
      
      const stage = stageRef.current;
      const layer = layerRef.current;
      
      if (!layer) return;
      
      // Find and temporarily hide overlay elements
      const overlays = layer.children?.filter(child => 
        child.attrs.name === 'crop-overlay' ||
        child.className === 'Transformer' ||
        (child.className === 'Rect' && child.attrs.globalCompositeOperation === 'destination-out')
      ) || [];
      
      // Hide overlays
      overlays.forEach(overlay => overlay.visible(false));
      layer.batchDraw();
      
      // Wait for render, then capture
      setTimeout(() => {
        try {
          // Try stage.toCanvas() 
          const stageCanvas = stage.toCanvas();
          
          // Create crop canvas
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = width;
          cropCanvas.height = height;
          const ctx = cropCanvas.getContext('2d');
          
          if (!ctx) return;
          
          // Draw cropped area
          ctx.drawImage(stageCanvas, x, y, width, height, 0, 0, width, height);
          
          // Check if we got any pixels
          const imageData = ctx.getImageData(0, 0, width, height);
          const hasPixels = imageData.data.some(pixel => pixel !== 0);
          
          if (!hasPixels) {
            // Alternative: Get image data directly from image node
            const scaleX = image.width / stageSize.width;
            const scaleY = image.height / stageSize.height;
            
            // Draw original image with crop
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(image, x * scaleX, y * scaleY, width * scaleX, height * scaleY, 0, 0, width, height);
          }
          
          const dataURL = cropCanvas.toDataURL('image/png');
          
          if (dataURL.length < 100) {
            // Restore overlays
            overlays.forEach(overlay => overlay.visible(true));
            layer.batchDraw();
            return;
          }
          
          // Create new image
          const newImg = new Image();
          newImg.onload = () => {
            setImage(newImg);
            setStageSize({ width, height });
            setCropMode(false);
            setCropRect(null);
            setTool('select');
            
            // Clear shapes
            const shapesToRemove = layer.children?.filter(child => 
              child !== imageRef.current && child.className !== 'Transformer'
            ) || [];
            
            shapesToRemove.forEach(shape => shape.remove());
            layer.batchDraw();
          };
          
          newImg.onerror = () => {
            // Restore overlays
            overlays.forEach(overlay => overlay.visible(true));
            layer.batchDraw();
          };
          
          newImg.src = dataURL;
          
        } catch (error) {
          // Restore overlays
          overlays.forEach(overlay => overlay.visible(true));
          layer.batchDraw();
        }
      }, 100);
    }
  };

  const applyResize = () => {
    if (!image || !stageRef.current || !imageRef.current) return;
    
    // Detach transformer
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
    setSelectedId(null);
    
    // Create a canvas to resize the image
    const canvas = document.createElement('canvas');
    canvas.width = resizeWidth;
    canvas.height = resizeHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Get current stage content
    const stage = stageRef.current;
    const stageCanvas = stage.toCanvas();
    
    // Draw resized image
    ctx.drawImage(stageCanvas, 0, 0, stageSize.width, stageSize.height, 0, 0, resizeWidth, resizeHeight);
    
    // Create new image from resized canvas
    const dataURL = canvas.toDataURL('image/png');
    const newImg = new Image();
    
    newImg.onload = () => {
      setImage(newImg);
      setStageSize({ width: resizeWidth, height: resizeHeight });
      
      // Clear shapes since they need to be repositioned
      const layer = layerRef.current;
      if (layer) {
        const shapesToRemove = layer.children?.filter(child => 
          child !== imageRef.current && child.className !== 'Transformer'
        ) || [];
        
        shapesToRemove.forEach(shape => shape.remove());
        layer.batchDraw();
      }
    };
    
    newImg.src = dataURL;
  };

  const handleResizeWidthChange = (value: string) => {
    const width = parseInt(value) || 0;
    setResizeWidth(width);
    
    if (maintainAspectRatio && image) {
      const aspectRatio = image.width / image.height;
      const newHeight = Math.round(width / aspectRatio);
      setResizeHeight(newHeight);
    }
  };

  const handleResizeHeightChange = (value: string) => {
    const height = parseInt(value) || 0;
    setResizeHeight(height);
    
    if (maintainAspectRatio && image) {
      const aspectRatio = image.width / image.height;
      const newWidth = Math.round(height * aspectRatio);
      setResizeWidth(newWidth);
    }
  };

  const resetToOriginalSize = () => {
    if (image) {
      const aspectRatio = image.width / image.height;
      const maxWidth = 800;
      const maxHeight = 600;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      setResizeWidth(Math.round(width));
      setResizeHeight(Math.round(height));
    }
  };

  const deleteSelected = () => {
    if (selectedId) {
      const node = stageRef.current?.findOne(`#${selectedId}`);
      if (node) {
        // First detach transformer to avoid lifecycle issues
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
          transformerRef.current.getLayer()?.batchDraw();
        }
        
        // Remove the node
        node.remove();
        setSelectedId(null);
        layerRef.current?.batchDraw();
      }
    }
  };

  const downloadEditedImage = () => {
    if (stageRef.current) {
      // Helper function to get actual format from dataURL
      const getActualFormat = (dataURL: string): string => {
        if (dataURL.startsWith('data:image/webp')) return 'webp';
        if (dataURL.startsWith('data:image/jpeg')) return 'jpeg';
        if (dataURL.startsWith('data:image/jpg')) return 'jpg';
        return 'png'; // default fallback
      };

      // Helper function to download file with correct extension
      const downloadFile = (dataURL: string, requestedFormat: string) => {
        const actualFormat = getActualFormat(dataURL);
        const fileExtension = actualFormat === 'jpeg' ? 'jpg' : actualFormat;
        
        if (onSave) {
          // Create a custom download with correct extension even when onSave is provided
          const link = document.createElement('a');
          link.download = `edited-image.${fileExtension}`;
          link.href = dataURL;
          link.click();
          
          // Also call the onSave callback for gallery storage
          onSave(dataURL);
        } else {
          const link = document.createElement('a');
          link.download = `edited-image.${fileExtension}`;
          link.href = dataURL;
          link.click();
        }

        // Notify user if format was changed (but not for jpeg/jpg equivalence)
        if (requestedFormat !== actualFormat && !(requestedFormat === 'jpeg' && actualFormat === 'jpeg')) {
          alert(`${requestedFormat.toUpperCase()} format not fully supported. Downloaded as ${actualFormat.toUpperCase()} instead.`);
        }
      };

      // Enhanced WebP support detection - multiple methods
      const testWebPSupport = (): Promise<boolean> => {
        return new Promise((resolve) => {
          // Method 1: Feature detection
          const hasWebPSupport = () => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            
            // Draw something
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 1, 1);
            
            try {
              const webpData = canvas.toDataURL('image/webp', 0.8);
              return webpData.startsWith('data:image/webp') && webpData.length > 50;
            } catch (e) {
              return false;
            }
          };
          
          // Method 2: More comprehensive test with real image data
          const testWithRealData = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 10;
            canvas.height = 10;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            
            // Create a more complex pattern
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 5, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(5, 0, 5, 5);
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(0, 5, 5, 5);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(5, 5, 5, 5);
            
            try {
              const webpData = canvas.toDataURL('image/webp', 0.9);
              const pngData = canvas.toDataURL('image/png');
              
              // Check if WebP is actually different from PNG and has proper header
              const isWebP = webpData.startsWith('data:image/webp') && 
                            webpData.length > 100 && 
                            webpData !== pngData;
              
              return isWebP;
            } catch (e) {
              return false;
            }
          };
          
          const basicSupport = hasWebPSupport();
          const advancedSupport = testWithRealData();
          
          const finalSupport = basicSupport && advancedSupport;
          
          resolve(finalSupport);
        });
      };

      // Canvas-based export function for reliable format conversion
      const exportViaCanvas = (targetFormat: string) => {
        try {
          // Get high-quality PNG data from Konva first
          const pngDataURL = stageRef.current!.toDataURL({
            pixelRatio: 2
          });
          
          // Create image from Konva data
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              downloadFile(pngDataURL, targetFormat);
              return;
            }
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            try {
              let convertedDataURL;
              
              if (targetFormat === 'jpeg') {
                convertedDataURL = canvas.toDataURL('image/jpeg', jpegQuality);
              } else if (targetFormat === 'webp') {
                // Try WebP conversion with multiple quality levels
                convertedDataURL = canvas.toDataURL('image/webp', jpegQuality);
                
                // Verify WebP conversion actually worked
                if (!convertedDataURL.startsWith('data:image/webp')) {
                  convertedDataURL = canvas.toDataURL('image/webp', 0.8);
                  
                  if (!convertedDataURL.startsWith('data:image/webp')) {
                    downloadFile(pngDataURL, targetFormat);
                    return;
                  }
                }
              } else {
                convertedDataURL = canvas.toDataURL('image/png');
              }
              
              const actualFormat = getActualFormat(convertedDataURL);
              if (actualFormat === targetFormat || (targetFormat === 'jpeg' && actualFormat === 'jpeg')) {
                downloadFile(convertedDataURL, targetFormat);
              } else {
                downloadFile(pngDataURL, targetFormat);
              }
            } catch (canvasError) {
              downloadFile(pngDataURL, targetFormat);
            }
          };
          
          img.onerror = () => {
            const fallbackDataURL = stageRef.current!.toDataURL({
              pixelRatio: 2
            });
            downloadFile(fallbackDataURL, targetFormat);
          };
          
          img.src = pngDataURL;
        } catch (error) {
          const fallbackDataURL = stageRef.current!.toDataURL({
            pixelRatio: 2
          });
          downloadFile(fallbackDataURL, targetFormat);
        }
      };

      if (exportFormat === 'png') {
        // PNG is always supported via Konva directly
        const dataURL = stageRef.current.toDataURL({
          pixelRatio: 2
        });
        downloadFile(dataURL, 'png');
        
      } else if (exportFormat === 'jpeg') {
        // Use canvas method for reliable JPEG conversion
        exportViaCanvas('jpeg');
        
      } else if (exportFormat === 'webp') {
        // Enhanced WebP support testing
        testWebPSupport().then((supported) => {
          if (supported) {
            exportViaCanvas('webp');
          } else {
            const dataURL = stageRef.current!.toDataURL({
              pixelRatio: 2
            });
            downloadFile(dataURL, 'webp');
          }
        });
      }
    }
  };

  // Handle transformer
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        // Clear previous nodes first
        transformerRef.current.nodes([]);
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Image Editor Pro</h1>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            
            <span className="text-sm text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-6" />
            
            {selectedId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={deleteSelected}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Selected</TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={downloadEditedImage}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Image</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r bg-muted/50 p-4 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="transform">Transform</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Brightness</label>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={(value) => handleFilterChange('brightness', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.brightness}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Contrast</label>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={(value) => handleFilterChange('contrast', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.contrast}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Saturation</label>
                    <Slider
                      value={[filters.saturation]}
                      onValueChange={(value) => handleFilterChange('saturation', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.saturation}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Blur</label>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={(value) => handleFilterChange('blur', value)}
                      min={0}
                      max={20}
                      step={0.1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.blur}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Hue</label>
                    <Slider
                      value={[filters.hue]}
                      onValueChange={(value) => handleFilterChange('hue', value)}
                      min={-180}
                      max={180}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.hue}°</span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium">Sepia</label>
                    <Slider
                      value={[filters.sepia]}
                      onValueChange={(value) => handleFilterChange('sepia', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.sepia}%</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Vintage</label>
                    <Slider
                      value={[filters.vintage]}
                      onValueChange={(value) => handleFilterChange('vintage', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.vintage}%</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Grayscale</label>
                    <Slider
                      value={[filters.grayscale]}
                      onValueChange={(value) => handleFilterChange('grayscale', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.grayscale}%</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Invert</label>
                    <Slider
                      value={[filters.invert]}
                      onValueChange={(value) => handleFilterChange('invert', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.invert}%</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Opacity</label>
                    <Slider
                      value={[filters.opacity]}
                      onValueChange={(value) => handleFilterChange('opacity', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{filters.opacity}%</span>
                  </div>
                  
                  <Button onClick={resetFilters} variant="outline" className="w-full">
                    Reset All Filters
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="tools" className="space-y-4">
                <div className="text-xs text-muted-foreground mb-3 p-2 bg-blue-50 rounded border">
                  <p className="font-medium text-blue-700 mb-1">💡 Tool Guide:</p>
                  <p><strong>Select:</strong> Click shapes to select, resize, move, or delete them</p>
                  <p><strong>Brush:</strong> Draw freehand lines and drawings</p>
                  <p><strong>Text:</strong> Add text (double-click to edit after placing)</p>
                  <p><strong>Crop:</strong> Select an area to crop the image</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tool === 'select' ? 'default' : 'outline'}
                    onClick={() => setTool('select')}
                    className="h-12"
                  >
                    <MousePointer className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                  
                  <Button
                    variant={tool === 'brush' ? 'default' : 'outline'}
                    onClick={() => setTool('brush')}
                    className="h-12"
                  >
                    <Brush className="h-4 w-4 mr-2" />
                    Brush
                  </Button>
                  
                  <Button
                    variant={tool === 'text' ? 'default' : 'outline'}
                    onClick={() => { setTool('text'); addText(); }}
                    className="h-12"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  
                  <Button
                    variant={tool === 'rect' ? 'default' : 'outline'}
                    onClick={() => { setTool('rect'); addRectangle(); }}
                    className="h-12"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Rectangle
                  </Button>
                  
                  <Button
                    variant={tool === 'circle' ? 'default' : 'outline'}
                    onClick={() => { setTool('circle'); addCircle(); }}
                    className="h-12"
                  >
                    <CircleIcon className="h-4 w-4 mr-2" />
                    Circle
                  </Button>
                  
                  <Button
                    onClick={() => addTriangle()}
                    variant="outline"
                    className="h-12"
                  >
                    <Triangle className="h-4 w-4 mr-2" />
                    Triangle
                  </Button>
                  
                  <Button
                    onClick={() => addStar()}
                    variant="outline"
                    className="h-12"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Star
                  </Button>
                  
                  <Button
                    onClick={() => addArrow()}
                    variant="outline"
                    className="h-12"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Arrow
                  </Button>
                  
                  <Button
                    variant={tool === 'crop' ? 'default' : 'outline'}
                    onClick={() => { setTool('crop'); setCropMode(true); }}
                    className="h-12"
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Crop
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium mb-3 block">Icons & Emojis</label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      onClick={() => addIcon('smile')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      😊
                    </Button>
                    <Button
                      onClick={() => addIcon('heart')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      ❤️
                    </Button>
                    <Button
                      onClick={() => addIcon('star')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      ⭐
                    </Button>
                    <Button
                      onClick={() => addIcon('sun')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      ☀️
                    </Button>
                    <Button
                      onClick={() => addIcon('camera')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      📷
                    </Button>
                    <Button
                      onClick={() => addIcon('music')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      🎵
                    </Button>
                    <Button
                      onClick={() => addIcon('fire')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      🔥
                    </Button>
                    <Button
                      onClick={() => addIcon('crown')}
                      variant="outline"
                      className="h-12 text-lg"
                    >
                      👑
                    </Button>
                  </div>
                </div>
                
                {cropMode && (
                  <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
                    <p className="text-sm text-blue-700 font-medium">Crop Mode Active</p>
                    <p className="text-xs text-blue-600">Click and drag to select crop area</p>
                    <div className="space-y-2">
                      <Button onClick={applyCrop} variant="default" className="w-full" disabled={!cropRect || Math.abs(cropRect.width) < 5 || Math.abs(cropRect.height) < 5}>
                        Apply Crop
                      </Button>
                      <Button 
                        onClick={() => { setCropMode(false); setCropRect(null); setTool('select'); }} 
                        variant="outline" 
                        className="w-full"
                      >
                        Cancel Crop
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Brush Size</label>
                    <Slider
                      value={[brushSize]}
                      onValueChange={(value) => setBrushSize(value[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{brushSize}px</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-full h-10 rounded border mt-2"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="transform" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => rotateImage('left')} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rotate Left
                  </Button>
                  
                  <Button onClick={() => rotateImage('right')} variant="outline">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Rotate Right
                  </Button>
                  
                  <Button onClick={() => flipImage('horizontal')} variant="outline">
                    <FlipHorizontal className="h-4 w-4 mr-2" />
                    Flip H
                  </Button>
                  
                  <Button onClick={() => flipImage('vertical')} variant="outline">
                    <FlipVertical className="h-4 w-4 mr-2" />
                    Flip V
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Resize Image</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Width</label>
                      <input
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => handleResizeWidthChange(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="1"
                        max="5000"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Height</label>
                      <input
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => handleResizeHeightChange(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="1"
                        max="5000"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="aspect-ratio"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="aspect-ratio" className="text-xs text-muted-foreground">
                      Maintain aspect ratio
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={applyResize} 
                      variant="default" 
                      className="text-xs"
                      disabled={resizeWidth < 1 || resizeHeight < 1}
                    >
                      Apply Resize
                    </Button>
                    <Button 
                      onClick={resetToOriginalSize} 
                      variant="outline" 
                      className="text-xs"
                    >
                      Reset Size
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Current: {Math.round(stageSize.width)} × {Math.round(stageSize.height)}px
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="export" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Format</label>
                  <select 
                    className="w-full mt-2 px-3 py-2 border rounded-lg bg-background"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                  >
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpeg">JPEG (Smaller file)</option>
                    <option value="webp">WebP (Best compression)</option>
                  </select>
                </div>
                
                {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
                  <div>
                    <label className="text-sm font-medium">Quality</label>
                    <Slider
                      value={[jpegQuality * 100]}
                      onValueChange={(value) => setJpegQuality(value[0] / 100)}
                      min={10}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{Math.round(jpegQuality * 100)}%</span>
                  </div>
                )}
                
                <Button onClick={downloadEditedImage} variant="default" className="w-full">
                  <FileType className="h-4 w-4 mr-2" />
                  Export as {exportFormat.toUpperCase()}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div 
            ref={canvasContainerRef}
            className="flex-1 flex items-center justify-center bg-slate-50 overflow-hidden"
          >
            <div 
              className="border border-gray-300 shadow-lg bg-white"
              style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'center'
              }}
            >
              <Stage
                width={stageSize.width}
                height={stageSize.height}
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Layer ref={layerRef}>
                  {image && (
                    <KonvaImage
                      ref={imageRef}
                      image={image}
                      width={stageSize.width}
                      height={stageSize.height}
                    />
                  )}
                  
                  {/* Crop rectangle overlay */}
                  {cropMode && cropRect && (
                    <>
                      {/* Semi-transparent overlay for non-cropped area */}
                      <Rect
                        x={0}
                        y={0}
                        width={stageSize.width}
                        height={stageSize.height}
                        fill="rgba(0, 0, 0, 0.5)"
                        name="crop-overlay"
                      />
                      
                      {/* Clear crop area */}
                      <Rect
                        x={cropRect.width < 0 ? cropRect.x + cropRect.width : cropRect.x}
                        y={cropRect.height < 0 ? cropRect.y + cropRect.height : cropRect.y}
                        width={Math.abs(cropRect.width)}
                        height={Math.abs(cropRect.height)}
                        globalCompositeOperation="destination-out"
                        name="crop-overlay"
                      />
                      
                      {/* Crop boundary */}
                      <Rect
                        x={cropRect.width < 0 ? cropRect.x + cropRect.width : cropRect.x}
                        y={cropRect.height < 0 ? cropRect.y + cropRect.height : cropRect.y}
                        width={Math.abs(cropRect.width)}
                        height={Math.abs(cropRect.height)}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dash={[5, 5]}
                        name="crop-overlay"
                      />
                    </>
                  )}
                  
                  <Transformer ref={transformerRef} />
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ImageEditor; 