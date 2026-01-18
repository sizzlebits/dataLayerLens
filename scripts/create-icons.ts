/**
 * Script to create placeholder PNG icons for the extension.
 *
 * For production, you should replace these with properly designed icons.
 * You can convert the SVG icon to PNGs using tools like:
 * - Inkscape: inkscape icon.svg -w 128 -h 128 -o icon-128.png
 * - ImageMagick: convert -background none icon.svg -resize 128x128 icon-128.png
 * - Online tools: https://cloudconvert.com/svg-to-png
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ICON_SIZES = [16, 32, 48, 128];
const ICONS_DIR = join(__dirname, '../public/icons');

// Create a simple 1x1 purple pixel PNG
// This is a minimal valid PNG file
function createPlaceholderPNG(size: number): Buffer {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (compressed image data)
  // Create raw image data (RGBA for each pixel)
  const rawData: number[] = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte for each row
    for (let x = 0; x < size; x++) {
      // Create a gradient purple circle
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist < radius) {
        const gradient = 1 - dist / radius;
        rawData.push(99 + Math.floor(gradient * 40));  // R (99 -> 139)
        rawData.push(102 + Math.floor(gradient * 50)); // G (102 -> 152)
        rawData.push(241);                              // B
        rawData.push(255);                              // A
      } else {
        rawData.push(0, 0, 0, 0); // Transparent
      }
    }
  }

  // Compress with zlib (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  const table = makeCrcTable();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

// Main
if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

for (const size of ICON_SIZES) {
  const png = createPlaceholderPNG(size);
  const path = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`Created ${path}`);
}

console.log('\nPlaceholder icons created!');
console.log('For production, replace these with properly designed icons.');
