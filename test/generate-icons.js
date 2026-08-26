/**
 * Generate standard clean PNG icons for the Chrome extension
 */

import fs from 'fs';
import path from 'path';

// Minimal 1x1 base PNG generation or clean buffer generator
function createSolidColorPng(width, height, r, g, b, a = 255) {
  // Let's create an uncompressed PNG or use basic raw PNG structure
  // Using pure JS zlib via Node.js
  import('zlib').then(({ deflateSync, crc32 }) => {
    function createPng(w, h) {
      // Signature
      const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

      // IHDR
      const ihdrData = Buffer.alloc(13);
      ihdrData.writeUInt32BE(w, 0);
      ihdrData.writeUInt32BE(h, 4);
      ihdrData.writeUInt8(8, 8); // 8-bit depth
      ihdrData.writeUInt8(6, 9); // RGBA color type
      ihdrData.writeUInt8(0, 10); // compression
      ihdrData.writeUInt8(0, 11); // filter
      ihdrData.writeUInt8(0, 12); // interlace
      const ihdrChunk = makeChunk('IHDR', ihdrData);

      // Raw image data with filter byte 0 at start of each line
      const rowSize = 1 + w * 4;
      const rawData = Buffer.alloc(h * rowSize);

      for (let y = 0; y < h; y++) {
        const rowOffset = y * rowSize;
        rawData[rowOffset] = 0; // Filter: None
        for (let x = 0; x < w; x++) {
          const pixelOffset = rowOffset + 1 + x * 4;
          // Gradient from indigo #6366f1 (99, 102, 241) to violet #4f46e5 (79, 70, 229)
          const factor = (x + y) / (w + h);
          const pr = Math.round(99 * (1 - factor) + 79 * factor);
          const pg = Math.round(102 * (1 - factor) + 70 * factor);
          const pb = Math.round(241 * (1 - factor) + 229 * factor);

          // Draw rounded corner mask
          const cx = w / 2;
          const cy = h / 2;
          const radius = w * 0.45;
          const dx = Math.abs(x - cx);
          const dy = Math.abs(y - cy);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= radius) {
            rawData[pixelOffset] = pr;
            rawData[pixelOffset + 1] = pg;
            rawData[pixelOffset + 2] = pb;
            rawData[pixelOffset + 3] = 255;
          } else {
            rawData[pixelOffset] = 0;
            rawData[pixelOffset + 1] = 0;
            rawData[pixelOffset + 2] = 0;
            rawData[pixelOffset + 3] = 0;
          }
        }
      }

      const compressed = deflateSync(rawData);
      const idatChunk = makeChunk('IDAT', compressed);
      const iendChunk = makeChunk('IEND', Buffer.alloc(0));

      return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
    }

    function makeChunk(type, data) {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length, 0);

      const typeBuf = Buffer.from(type, 'ascii');
      const payload = Buffer.concat([typeBuf, data]);

      // Calculate CRC32 using standard table
      const crcVal = calcCrc32(payload);
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE(crcVal >>> 0, 0);

      return Buffer.concat([len, payload, crcBuf]);
    }

    // CRC32 implementation
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }

    function calcCrc32(buf) {
      let crc = 0 ^ -1;
      for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
      }
      return (crc ^ -1) >>> 0;
    }

    const iconsDir = path.resolve('c:/Projects/GFAF/icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    [16, 48, 128].forEach((size) => {
      const pngBuf = createPng(size, size);
      const outPath = path.join(iconsDir, `icon${size}.png`);
      fs.writeFileSync(outPath, pngBuf);
      console.log(`Generated ${outPath} (${size}x${size})`);
    });
  });
}

createSolidColorPng();
