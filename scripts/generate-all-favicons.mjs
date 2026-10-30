import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Builds a multi-resolution Windows ICO container containing
 * standard 16x16, 32x32, and 48x48 PNG-compressed images.
 */
function buildIcoBuffer(pngEntries) {
  // pngEntries: Array of { width, height, buffer }
  const count = pngEntries.length;
  const headerSize = 6 + (16 * count);
  let currentOffset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO icon
  header.writeUInt16LE(count, 4); // Number of images

  const directoryEntries = [];
  for (const entry of pngEntries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(entry.width >= 256 ? 0 : entry.width, 0);
    dir.writeUInt8(entry.height >= 256 ? 0 : entry.height, 1);
    dir.writeUInt8(0, 2); // Colors in palette
    dir.writeUInt8(0, 3); // Reserved
    dir.writeUInt16LE(1, 4); // Color planes
    dir.writeUInt16LE(32, 6); // Bits per pixel
    dir.writeUInt32LE(entry.buffer.length, 8); // Size of image data
    dir.writeUInt32LE(currentOffset, 12); // File offset of image data
    directoryEntries.push(dir);
    currentOffset += entry.buffer.length;
  }

  return Buffer.concat([
    header,
    ...directoryEntries,
    ...pngEntries.map((e) => e.buffer)
  ]);
}

async function generateFavicons() {
  console.log('[Favicon Generator] Reading official SAS MUSIC logo...');

  // 1. Trim transparency from the official red logo
  const trimmedLogoBuffer = await sharp('public/sas-music-logo-red.png')
    .trim()
    .toBuffer();

  const logoMeta = await sharp(trimmedLogoBuffer).metadata();
  console.log(`[Favicon Generator] Trimmed logo dimensions: ${logoMeta.width}x${logoMeta.height}`);

  // Scale logo to fill 88% of the square width (450px on 512px canvas)
  const targetWidth = 450;
  const targetHeight = Math.round(targetWidth * (logoMeta.height / logoMeta.width));

  const scaledLogo = await sharp(trimmedLogoBuffer)
    .resize(targetWidth, targetHeight, { fit: 'inside' })
    .toBuffer();

  // 2. SVG Luxury Dark Badge Background matching SAS MUSIC theme
  const backgroundSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="badgeGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#A31C1B" stop-opacity="0.4"/>
          <stop offset="65%" stop-color="#06110c" stop-opacity="1"/>
          <stop offset="100%" stop-color="#020805" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <!-- Rounded badge squircle -->
      <rect width="512" height="512" rx="112" fill="url(#badgeGlow)"/>
      <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#A31C1B" stroke-width="8" stroke-opacity="0.85"/>
    </svg>
  `;

  // 3. Compose Master 512x512 High-DPI PNG
  const master512 = await sharp(Buffer.from(backgroundSvg))
    .composite([
      {
        input: scaledLogo,
        gravity: 'center'
      }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Save Master 512x512 icons
  await sharp(master512).toFile('public/pwa-512x512.png');
  await sharp(master512).toFile('public/maskable-icon.png');
  await sharp(master512).toFile('public/favicon.png');
  console.log('✓ Created: public/pwa-512x512.png, public/maskable-icon.png, public/favicon.png');

  // 4. Generate 192x192 icons (Android Homescreen & High-DPI)
  const icon192 = await sharp(master512).resize(192, 192).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon192).toFile('public/pwa-192x192.png');
  await sharp(icon192).toFile('public/favicon-192x192.png');
  console.log('✓ Created: public/pwa-192x192.png, public/favicon-192x192.png');

  // 5. Generate 180x180 Apple Touch Icon
  const icon180 = await sharp(master512).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon180).toFile('public/apple-touch-icon.png');
  console.log('✓ Created: public/apple-touch-icon.png (180x180)');

  // 6. Generate 48x48 PNG (Googlebot-Image primary target)
  const icon48 = await sharp(master512).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon48).toFile('public/favicon-48x48.png');
  console.log('✓ Created: public/favicon-48x48.png (48x48 Googlebot)');

  // 7. Generate 32x32 PNG (Desktop Browser Tabs)
  const icon32 = await sharp(master512).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon32).toFile('public/favicon-32x32.png');
  console.log('✓ Created: public/favicon-32x32.png (32x32 Tab Icon)');

  // 8. Generate 16x16 PNG (Classic Small Icon)
  const icon16 = await sharp(master512).resize(16, 16).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon16).toFile('public/favicon-16x16.png');
  console.log('✓ Created: public/favicon-16x16.png (16x16 Classic)');

  // 9. Generate multi-resolution favicon.ico (16, 32, 48)
  const icoBuffer = buildIcoBuffer([
    { width: 16, height: 16, buffer: icon16 },
    { width: 32, height: 32, buffer: icon32 },
    { width: 48, height: 48, buffer: icon48 }
  ]);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  console.log('✓ Created: public/favicon.ico (Multi-layer 16x16, 32x32, 48x48)');

  // 10. Generate favicon.svg for modern browsers
  const base64Png = master512.toString('base64');
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" xlink:href="data:image/png;base64,${base64Png}"/>
</svg>`;
  fs.writeFileSync('public/favicon.svg', faviconSvg, 'utf8');
  console.log('✓ Created: public/favicon.svg (SVG Favicon)');

  // Clean up test files if any
  try { fs.unlinkSync('public/test-favicon-a.png'); } catch (_) {}
  try { fs.unlinkSync('public/test-favicon-b.png'); } catch (_) {}

  console.log('\n🎉 ALL FAVICON AND BRAND ICON ASSETS SUCCESSFULLY GENERATED!');
}

generateFavicons().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});

