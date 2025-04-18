import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function convertSvgToPng(svgPath, pngPath, width, height) {
  // Create a canvas with the specified dimensions
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill with blue background
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(0, 0, width, height);
  
  // Draw a rounded rectangle (approximation)
  const radius = width * 0.15;
  ctx.fillStyle = '#0066cc';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Draw sauna symbol
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const centerX = width / 2;
  const centerY = height / 2 - height * 0.1;
  const innerRadius = width * 0.3;
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw inner circle
  ctx.fillStyle = '#0066cc';
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${width * 0.1}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BEAR SAUNA', centerX, height * 0.75);
  
  // Save the PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(pngPath, buffer);
  
  console.log(`Converted ${svgPath} to ${pngPath}`);
}

// Convert icons
(async () => {
  try {
    await convertSvgToPng('client/public/icon-192x192.svg', 'client/public/icon-192x192.png', 192, 192);
    await convertSvgToPng('client/public/icon-512x512.svg', 'client/public/icon-512x512.png', 512, 512);
    console.log('All icons converted successfully!');
  } catch (err) {
    console.error('Error converting icons:', err);
  }
})();