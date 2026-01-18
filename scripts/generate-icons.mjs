#!/usr/bin/env node
/**
 * Generate PNG icons from the SVG source.
 * Requires: npm install --save-dev sharp
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const iconsDir = join(rootDir, 'public', 'icons');
const svgPath = join(iconsDir, 'icon.svg');

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  console.log('Generating PNG icons from SVG...\n');

  // Ensure icons directory exists
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  // Read SVG file
  const svgBuffer = readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Created icon-${size}.png`);
  }

  console.log('\nDone! Icons generated in public/icons/');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
