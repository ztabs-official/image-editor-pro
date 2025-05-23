// Production Icon Generator for Chrome Extension
// Generates optimized PNG icons from SVG

const fs = require('fs');
const path = require('path');

// Create production-ready PNG icons
function createProductionIcons() {
  // SVG icon template with professional image editor design
  const createSVG = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="icon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#bg)" stroke="none"/>
  
  <!-- Photo frame -->
  <rect x="${size * 0.2}" y="${size * 0.25}" width="${size * 0.6}" height="${size * 0.45}" rx="2" fill="url(#icon)" stroke="none"/>
  
  <!-- Image mountains -->
  <polygon points="${size * 0.25},${size * 0.55} ${size * 0.35},${size * 0.4} ${size * 0.45},${size * 0.5} ${size * 0.55},${size * 0.35} ${size * 0.75},${size * 0.55}" fill="#3b82f6" opacity="0.8"/>
  
  <!-- Sun -->
  <circle cx="${size * 0.65}" cy="${size * 0.35}" r="${size * 0.05}" fill="#fbbf24"/>
  
  <!-- Edit tools indicator -->
  <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.08}" fill="#ef4444"/>
  <rect x="${size * 0.72}" y="${size * 0.72}" width="${size * 0.06}" height="${size * 0.06}" fill="white" rx="1"/>
</svg>`;

  const sizes = [16, 32, 48, 128];
  const iconsDir = path.join(__dirname, 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
  }

  // Generate SVG files (for development/fallback)
  sizes.forEach(size => {
    const svgContent = createSVG(size);
    fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svgContent);
    console.log(`Generated icon${size}.svg`);
  });

  // Create a simple HTML page to help convert SVG to PNG manually
  const conversionHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Icon Converter</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-container { margin: 20px 0; }
        canvas { border: 1px solid #ccc; margin: 10px; }
        .download-btn { 
            background: #3b82f6; 
            color: white; 
            padding: 5px 10px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            margin: 5px;
        }
    </style>
</head>
<body>
    <h1>Convert SVG Icons to PNG</h1>
    <p>Click the download buttons to save PNG versions of the icons:</p>
    
    ${sizes.map(size => `
    <div class="icon-container">
        <h3>Icon ${size}x${size}</h3>
        <canvas id="canvas${size}" width="${size}" height="${size}"></canvas>
        <button class="download-btn" onclick="downloadPNG(${size})">Download ${size}x${size} PNG</button>
    </div>
    `).join('')}

    <script>
        ${sizes.map(size => `
        // Load and convert ${size}x${size} icon
        const img${size} = new Image();
        img${size}.onload = function() {
            const canvas = document.getElementById('canvas${size}');
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img${size}, 0, 0, ${size}, ${size});
        };
        img${size}.src = 'data:image/svg+xml;base64,' + btoa(\`${createSVG(size).replace(/`/g, '\\`')}\`);
        `).join('')}

        function downloadPNG(size) {
            const canvas = document.getElementById('canvas' + size);
            const link = document.createElement('a');
            link.download = 'icon' + size + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'convert-icons.html'), conversionHTML);
  console.log('Created convert-icons.html - Open this file in a browser and click download buttons to get PNG files');
}

// Run the generator
createProductionIcons(); 