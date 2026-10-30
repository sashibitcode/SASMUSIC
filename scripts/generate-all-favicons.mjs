import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Builds a multi-resolution Windows ICO container containing
 * standard 16x16, 32x32, and 48x48 PNG-compressed images.
 */
function buildIcoBuffer(pngEntries) {
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

  // Scale logo to fill 84% width (430px on 512px canvas)
  const targetWidth = 430;
  const targetHeight = Math.round(targetWidth * (logoMeta.height / logoMeta.width));

  const scaledLogo = await sharp(trimmedLogoBuffer)
    .resize(targetWidth, targetHeight, { fit: 'inside' })
    .toBuffer();

  // 2. SVG Luxury Dark Badge Background for PWA splash with "from SASHIBITCODE"
  const splashBackgroundSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="badgeGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#A31C1B" stop-opacity="0.45"/>
          <stop offset="65%" stop-color="#06110c" stop-opacity="1"/>
          <stop offset="100%" stop-color="#020805" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <!-- Rounded badge squircle -->
      <rect width="512" height="512" rx="112" fill="url(#badgeGlow)"/>
      <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#A31C1B" stroke-width="8" stroke-opacity="0.85"/>
      
      <!-- Studio Brand Signature (Elevated inside safe zone) -->
      <text x="256" y="390" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" letter-spacing="4" text-anchor="middle">FROM</text>
      <text x="256" y="422" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="5" text-anchor="middle">SASHIBITCODE</text>
    </svg>
  `;

  // Standard pure badge for desktop browser tabs (no text)
  const pureBackgroundSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="badgeGlowPure" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#A31C1B" stop-opacity="0.4"/>
          <stop offset="65%" stop-color="#06110c" stop-opacity="1"/>
          <stop offset="100%" stop-color="#020805" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#badgeGlowPure)"/>
      <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#A31C1B" stroke-width="8" stroke-opacity="0.85"/>
    </svg>
  `;

  // 3. Compose Master PWA 512x512 High-DPI PNG (with Studio Signature)
  // Position logo centered slightly above middle (y ~ 210) to balance with bottom text
  const logoTop = Math.round(210 - (targetHeight / 2));
  const logoLeft = Math.round(256 - (targetWidth / 2));

  const pwaMaster512 = await sharp(Buffer.from(splashBackgroundSvg))
    .composite([
      {
        input: scaledLogo,
        top: logoTop,
        left: logoLeft
      }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Pure icon for crisp tab favicons (logo centered at y=256)
  const pureMaster512 = await sharp(Buffer.from(pureBackgroundSvg))
    .composite([
      {
        input: scaledLogo,
        gravity: 'center'
      }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Save Master 512x512 icons (PWA splash & home screen)
  await sharp(pwaMaster512).toFile('public/pwa-512x512.png');
  await sharp(pwaMaster512).toFile('public/maskable-icon.png');
  await sharp(pwaMaster512).toFile('public/favicon.png');
  console.log('✓ Created: public/pwa-512x512.png, public/maskable-icon.png, public/favicon.png (with "from SASHIBITCODE")');

  // 4. Generate 192x192 icons (Android Homescreen & High-DPI)
  const icon192 = await sharp(pwaMaster512).resize(192, 192).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon192).toFile('public/pwa-192x192.png');
  await sharp(icon192).toFile('public/favicon-192x192.png');
  console.log('✓ Created: public/pwa-192x192.png, public/favicon-192x192.png');

  // 5. Generate 180x180 Apple Touch Icon
  const icon180 = await sharp(pwaMaster512).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon180).toFile('public/apple-touch-icon.png');
  console.log('✓ Created: public/apple-touch-icon.png (180x180)');

  // 6. Generate crisp tab icons (from pureMaster512 for max clarity at tiny pixel sizes)
  const icon48 = await sharp(pureMaster512).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon48).toFile('public/favicon-48x48.png');
  console.log('✓ Created: public/favicon-48x48.png (48x48 Googlebot)');

  const icon32 = await sharp(pureMaster512).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon32).toFile('public/favicon-32x32.png');
  console.log('✓ Created: public/favicon-32x32.png (32x32 Tab Icon)');

  const icon16 = await sharp(pureMaster512).resize(16, 16).png({ compressionLevel: 9 }).toBuffer();
  await sharp(icon16).toFile('public/favicon-16x16.png');
  console.log('✓ Created: public/favicon-16x16.png (16x16 Classic)');

  // 7. Generate multi-resolution favicon.ico (16, 32, 48)
  const icoBuffer = buildIcoBuffer([
    { width: 16, height: 16, buffer: icon16 },
    { width: 32, height: 32, buffer: icon32 },
    { width: 48, height: 48, buffer: icon48 }
  ]);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  console.log('✓ Created: public/favicon.ico (Multi-layer 16x16, 32x32, 48x48)');

  // 8. Generate favicon.svg for modern browsers
  const base64Png = pureMaster512.toString('base64');
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" xlink:href="data:image/png;base64,${base64Png}"/>
</svg>`;
  fs.writeFileSync('public/favicon.svg', faviconSvg, 'utf8');
  console.log('✓ Created: public/favicon.svg (SVG Favicon)');

  // 9. Generate ultra-compressed WebP logos for instant LCP
  await sharp('public/sas-music-logo-red.png')
    .webp({ quality: 90 })
    .toFile('public/sas-music-logo-red.webp');
  console.log('✓ Created: public/sas-music-logo-red.webp (Optimized WebP Splash Logo)');

  await sharp('public/sas-music-logo.png')
    .webp({ quality: 90 })
    .toFile('public/sas-music-logo.webp');
  console.log('✓ Created: public/sas-music-logo.webp (Optimized WebP Header Logo)');

  console.log('\n🎉 ALL FAVICON AND BRAND ICON ASSETS SUCCESSFULLY GENERATED!');
}

generateFavicons().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
