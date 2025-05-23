import fs from 'fs';
import { createCanvas } from 'canvas';

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Blue background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);
  
  // White border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, size / 16);
  ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, size - ctx.lineWidth, size - ctx.lineWidth);
  
  // White image icon in center
  ctx.fillStyle = 'white';
  const margin = size * 0.25;
  const rectSize = size - (margin * 2);
  
  // Outer rectangle (image frame)
  ctx.fillRect(margin, margin, rectSize, rectSize * 0.7);
  
  // Inner blue rectangle (to create frame effect)
  ctx.fillStyle = '#3b82f6';
  const innerMargin = margin + size * 0.05;
  ctx.fillRect(innerMargin, innerMargin, rectSize - (size * 0.1), rectSize * 0.5);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/icon${size}.png`, buffer);
  console.log(`✓ Created icon${size}.png`);
}

// Create all icon sizes
[16, 32, 48, 128].forEach(createIcon);
console.log('All icons created successfully!'); 