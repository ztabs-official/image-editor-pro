# 🎨 Image Editor Pro - Chrome Extension

A beautiful and powerful Chrome extension for professional image editing with advanced capabilities, built with React, TypeScript, shadcn/ui, and Konva.js.

## ✨ Features

### 🖼️ **Comprehensive Dashboard**
- **Full-screen interface** with all editing tools and options
- **Image gallery** with grid/list view modes
- **Search and filter** capabilities (all, recent, starred images)
- **Image management** (star, delete, download, organize)
- **Persistent storage** using Chrome's local storage API

### 📤 **Multiple Image Sources**
- **File Upload**: Drag & drop or browse local files
- **Screenshot Capture**: Capture current tab screenshots
- **Web Image Extraction**: Extract images from any webpage
- **Gallery Management**: Access all stored images instantly

### 🎨 **Advanced Editing Tools**
- **Filters**: Brightness, Contrast, Saturation, Blur, Hue (-100 to +100)
- **Drawing Tools**: Brush with customizable color and size
- **Text Overlay**: Add text with color picker and font sizing
- **Shape Tools**: Rectangle and circle drawing
- **Transform Tools**: Rotate left/right, flip horizontal/vertical
- **Zoom Controls**: Pan and zoom for precise editing

### 💾 **Image Storage System**

#### **Where Images Are Stored**
- **Chrome Local Storage**: All images stored using `chrome.storage.local` API
- **Base64 Format**: Images converted to data URLs for reliable storage
- **Metadata Tracking**: Stores name, dimensions, file size, timestamp, star status
- **Persistent**: Images remain available until manually deleted
- **Cross-session**: Access images across browser restarts

#### **Storage Capacity**
- **Chrome Limit**: ~5MB per extension (chrome.storage.local)
- **Efficient**: Automatic base64 encoding optimization
- **Management**: Built-in tools to delete images when storage fills up

#### **Data Structure**
```typescript
interface StoredImage {
  id: string;              // Unique identifier
  name: string;            // Original filename
  dataUrl: string;         // Base64 image data
  timestamp: number;       // Creation date
  size: {
    width: number;         // Image dimensions
    height: number;
    fileSize: number;      // Approximate file size
  };
  isStarred?: boolean;     // User favorite status
  tags?: string[];         // Future: categorization
}
```

## 🏗️ **Architecture Overview**

### **Extension Components**

1. **Popup Interface** (`popup.html`)
   - Quick access from browser toolbar
   - Basic upload/capture/extract functionality
   - **"Open Full Dashboard"** button for comprehensive features

2. **Dashboard Page** (`dashboard.html`)
   - **Main interface** with full-screen real estate
   - Complete image gallery and management
   - All editing tools and options in one place
   - Search, filter, and organization features

3. **Editor Page** (`editor.html`)
   - Dedicated editing interface with Konva.js canvas
   - Advanced editing tools and filters
   - Real-time preview and export capabilities

4. **Background Service** (`background.js`)
   - Context menu integration
   - Extension lifecycle management
   - Cross-tab communication

5. **Content Script** (`content.js`)
   - Webpage image detection
   - Image extraction capabilities
   - DOM interaction for web images

### **User Flow Options**

#### **Option 1: Popup → Quick Edit**
```
Click Extension Icon → Upload/Capture → Quick Edit → Download
```

#### **Option 2: Dashboard → Full Experience** (⭐ Recommended)
```
Click Extension Icon → "Open Full Dashboard" → Gallery/Upload/Edit → Save to Gallery
```

#### **Option 3: Context Menu**
```
Right-click Image → "Edit with Image Editor Pro" → Direct to Editor
```

## 🚀 **Installation**

1. **Download the extension**:
   ```bash
   git clone [repository-url]
   cd image-editor-extension
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Start editing**:
   - Click the extension icon in toolbar
   - Choose "Open Full Dashboard" for best experience
   - Or use popup for quick edits

## 📋 **Usage Guide**

### **Dashboard Interface**

#### **Upload Tab**
- Drag & drop images directly
- Browse and select multiple files
- Automatic storage to gallery
- Support for PNG, JPG, JPEG, GIF, WebP

#### **Capture Tab**
- One-click screenshot capture
- Automatic save to gallery
- Current tab visibility capture
- High-quality PNG output

#### **Extract Tab**
- Scan current webpage for images
- Filter by minimum size (100x100px)
- Bulk extraction (up to 10 images)
- Automatic naming and storage

#### **Gallery Tab**
- **Grid/List Views**: Toggle between visual layouts
- **Search**: Find images by filename
- **Filter**: All images, recent (24h), or starred
- **Actions**: Edit, star, download, delete per image
- **Metadata**: Dimensions, file size, date created

### **Image Management**

#### **Starring System**
- ⭐ Star important images for easy access
- Filter gallery to show only starred images
- Persistent across sessions

#### **Search & Filter**
- 🔍 Search by filename or keywords
- 📅 Recent filter for last 24 hours
- ⭐ Starred filter for favorites
- Real-time filtering as you type

#### **Storage Management**
- Monitor storage usage in header
- Delete unwanted images to free space
- Bulk selection for management (future feature)
- Export/import gallery (future feature)

## 🎯 **Technical Details**

### **Built With**
- **Frontend**: React 18 + TypeScript
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Canvas**: Konva.js for advanced image manipulation
- **Build Tool**: Vite with Chrome extension configuration
- **Extension API**: Chrome Manifest V3

### **Performance**
- ⚡ Fast loading with code splitting
- 🎨 Smooth canvas operations with Konva.js
- 💾 Efficient base64 storage compression
- 🔄 Real-time preview updates
- 📱 Responsive design for all screen sizes

### **Browser Compatibility**
- ✅ Chrome (Primary)
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ❌ Firefox (different extension API)
- ❌ Safari (different extension system)

## 🔧 **Development**

### **Setup**
```bash
npm install          # Install dependencies
npm run dev         # Development mode
npm run build       # Production build
npm run type-check  # TypeScript validation
```

### **File Structure**
```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   └── ImageEditor.tsx
├── popup.tsx        # Extension popup
├── dashboard.tsx    # Main dashboard
├── editor.tsx       # Dedicated editor
├── background.ts    # Service worker
├── content.ts       # Content script
└── globals.css      # Tailwind styles

dist/                # Built extension
├── manifest.json
├── popup.html
├── dashboard.html
├── editor.html
└── *.js            # Compiled scripts
```

## 🔒 **Privacy & Security**

- **Local Storage Only**: All images stored locally in browser
- **No Cloud Upload**: Images never leave your device
- **No Analytics**: No tracking or data collection
- **Permissions**: Only requests necessary permissions
- **Open Source**: Full transparency of code

## 🎨 **UI/UX Design**

### **Design System**
- **Colors**: CSS variables with light/dark mode support
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent 4px grid system
- **Components**: Accessible shadcn/ui components
- **Icons**: Lucide React icons throughout

### **User Experience**
- **Progressive Disclosure**: Simple popup → Full dashboard
- **Contextual Actions**: Right-click menu integration
- **Visual Feedback**: Loading states and tooltips
- **Keyboard Navigation**: Full accessibility support
- **Responsive Layout**: Works on all screen sizes

## 📞 **Support**

For issues, feature requests, or contributions:
- 🐛 **Bug Reports**: [Issue Tracker]
- 💡 **Feature Requests**: [Feature Board]
- 📖 **Documentation**: [Wiki]
- 💬 **Community**: [Discussions]

---

**Built with ❤️ using React, TypeScript, and shadcn/ui** 