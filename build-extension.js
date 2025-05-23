import fs from 'fs';
import path from 'path';

// Copy manifest.json to dist
fs.copyFileSync('manifest.json', 'dist/manifest.json');

// Create icons directory if it doesn't exist
if (!fs.existsSync('dist/icons')) {
  fs.mkdirSync('dist/icons', { recursive: true });
}

// Copy icons if they exist
const iconSizes = [16, 32, 48, 128];
iconSizes.forEach(size => {
  const iconPath = `icons/icon${size}.png`;
  const distIconPath = `dist/icons/icon${size}.png`;
  
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, distIconPath);
    console.log(`✓ Copied ${iconPath}`);
  } else {
    console.log(`⚠ Missing ${iconPath} - please add this icon`);
  }
});

// Create content.css in dist if it doesn't exist
if (!fs.existsSync('dist/content.css')) {
  fs.writeFileSync('dist/content.css', `
/* Content script styles for Image Editor Pro */
.image-editor-overlay {
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
  transition: opacity 0.2s ease;
}

.image-editor-highlight {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
  `.trim());
  console.log('✓ Created content.css');
}

console.log('\n🎉 Extension build complete!');
console.log('📁 Load the "dist" folder in Chrome Extensions (Developer mode)');
console.log('🔗 Go to chrome://extensions/ and click "Load unpacked"');

// Check if all required files exist
const requiredFiles = [
  'dist/manifest.json',
  'dist/popup.html',
  'dist/editor.html',
  'dist/background.js',
  'dist/content.js',
  'dist/content.css'
];

console.log('\n📋 Required files check:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - MISSING`);
  }
});

console.log('\n🎨 Icon files check:');
iconSizes.forEach(size => {
  const iconPath = `dist/icons/icon${size}.png`;
  if (fs.existsSync(iconPath)) {
    console.log(`✓ icon${size}.png`);
  } else {
    console.log(`⚠ icon${size}.png - Please add this icon for best results`);
  }
}); 