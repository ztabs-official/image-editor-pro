import fs from 'fs';
import path from 'path';

async function buildExtension() {
  console.log('🚀 Building Image Editor Pro Extension for Production...\n');

  try {
    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      console.log('❌ dist directory not found. Please run "npm run build" first.');
      process.exit(1);
    }

    // Copy manifest.json
    fs.copyFileSync('manifest.json', 'dist/manifest.json');
    console.log('✅ Copied manifest.json');

    // Copy icons directory (SVG icons work fine for Chrome extensions)
    if (fs.existsSync('icons')) {
      if (!fs.existsSync('dist/icons')) {
        fs.mkdirSync('dist/icons', { recursive: true });
      }
      fs.cpSync('icons', 'dist/icons', { recursive: true });
      console.log('✅ Copied icons directory');
    }

    // Copy content.css if it exists
    if (fs.existsSync('src/content.css')) {
      fs.copyFileSync('src/content.css', 'dist/content.css');
      console.log('✅ Copied content.css');
    }

    // Create production README
    const productionReadme = `# Image Editor Pro - Chrome Extension

## Installation
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. The extension will be installed and ready to use

## Features
- Professional image editing with 10+ filters
- Drawing tools (brush, shapes, text, icons)
- Crop and resize functionality
- Transform tools (rotate, flip, zoom)
- Export in multiple formats (PNG, JPEG, WebP)
- Local storage gallery (~5MB capacity)
- Context menu integration

## Usage
Click the extension icon to open the image editor dashboard.
Right-click on any image on a webpage to edit it directly.

## Technical Details
- Built with React 18, TypeScript, Konva.js
- UI components from shadcn/ui with Tailwind CSS
- Chrome Extension Manifest V3
- Local storage for image gallery
- Professional-grade image editing capabilities

## Version: 1.0.0
Ready for Chrome Web Store submission.
`;

    fs.writeFileSync('dist/README.md', productionReadme);
    console.log('✅ Created production README');

    // Calculate bundle size and file count
    const files = fs.readdirSync('dist', { recursive: true });
    let totalSize = 0;
    let fileCount = 0;
    
    files.forEach(file => {
      const filePath = path.join('dist', file);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
        fileCount++;
      }
    });

    // Check if all required files exist
    const requiredFiles = [
      'dist/manifest.json',
      'dist/popup.html',
      'dist/dashboard.html',
      'dist/editor.html',
      'dist/background.js',
      'dist/content.js',
      'dist/content.css'
    ];

    console.log('\n📋 Required files check:');
    let allFilesPresent = true;
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesPresent = false;
      }
    });

    // Check icons
    console.log('\n🎨 Icon files check:');
    const iconSizes = [16, 32, 48, 128];
    iconSizes.forEach(size => {
      const iconPath = `dist/icons/icon${size}.svg`;
      if (fs.existsSync(iconPath)) {
        console.log(`✅ icon${size}.svg`);
      } else {
        console.log(`⚠️  icon${size}.svg - Missing`);
      }
    });

    console.log(`\n📦 Build Summary:`);
    console.log(`   Total files: ${fileCount}`);
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Output directory: dist/`);
    
    if (allFilesPresent) {
      console.log('\n🎉 Extension ready for production!');
      console.log('📁 Load the "dist" folder as an unpacked extension in Chrome');
      console.log('🔗 Go to chrome://extensions/ and enable Developer mode');
      console.log('📤 Ready for Chrome Web Store submission');
    } else {
      console.log('\n❌ Build incomplete - missing required files');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildExtension(); 