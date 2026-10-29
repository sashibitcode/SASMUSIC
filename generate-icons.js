import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * Lightweight pure-Node PNG generator
 * Generates valid PNG files with SAS Music branding colors (deep obsidian & purple)
 * without needing heavy native bindings.
 */
function createSolidColorPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filter bytes (0 = None)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Create a subtle circular gradient and music note / SAS mark
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      let pr = r;
      let pg = g;
      let pb = b;

      if (dist < 0.7) {
        // Violet glow toward center
        const factor = 1 - dist / 0.7;
        pr = Math.min(255, Math.floor(r + 80 * factor));
        pg = Math.min(255, Math.floor(g + 50 * factor));
        pb = Math.min(255, Math.floor(b + 110 * factor));
      }

      // Draw stylized musical note elements in center
      // Stems and note heads
      const inLeftStem = Math.abs(x - width * 0.42) < width * 0.03 && y > height * 0.28 && y < height * 0.65;
      const inRightStem = Math.abs(x - width * 0.62) < width * 0.03 && y > height * 0.22 && y < height * 0.60;
      const inBeam = x >= width * 0.40 && x <= width * 0.64 && Math.abs(y - (height * 0.28 - (x - width * 0.40) * 0.25)) < height * 0.04;
      
      const leftHeadDist = Math.hypot(x - width * 0.38, (y - height * 0.66) * 1.3);
      const rightHeadDist = Math.hypot(x - width * 0.58, (y - height * 0.61) * 1.3);
      const inNoteHead = leftHeadDist < width * 0.08 || rightHeadDist < width * 0.08;

      if (inLeftStem || inRightStem || inBeam || inNoteHead) {
        pr = 196;
        pg = 181;
        pb = 253; // soft glowing violet/white
      }

      rawData[pixelOffset] = pr;
      rawData[pixelOffset + 1] = pg;
      rawData[pixelOffset + 2] = pb;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

// Simple CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons: base dark violet color (15, 7, 40)
const icon192 = createSolidColorPng(192, 192, 15, 7, 40);
const icon512 = createSolidColorPng(512, 512, 15, 7, 40);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'maskable-icon.png'), icon512);

console.log('Successfully generated PWA PNG icons!');

