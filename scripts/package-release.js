#!/usr/bin/env node

/**
 * Packages the extension builds into versioned zip files.
 * Creates: dataLayerLens-{version}-chrome.zip and dataLayerLens-{version}-firefox.zip
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Read package.json version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`\nPackaging DataLayer Lens v${version}...\n`);

// Ensure releases directory exists
const releasesDir = join(rootDir, 'releases');
if (!existsSync(releasesDir)) {
  mkdirSync(releasesDir, { recursive: true });
}

// Package Chrome
const chromeDistDir = join(rootDir, 'dist/chrome');
if (existsSync(chromeDistDir)) {
  const chromeZipName = `dataLayerLens-${version}-chrome.zip`;
  const chromeZipPath = join(releasesDir, chromeZipName);
  execSync(`cd "${chromeDistDir}" && zip -r "${chromeZipPath}" . -x '*.zip'`, { stdio: 'inherit' });
  console.log(`  ✓ Created ${chromeZipName}`);
} else {
  console.error(`  ✗ Chrome dist not found at ${chromeDistDir}`);
  process.exit(1);
}

// Package Firefox
const firefoxDistDir = join(rootDir, 'dist/firefox');
if (existsSync(firefoxDistDir)) {
  const firefoxZipName = `dataLayerLens-${version}-firefox.zip`;
  const firefoxZipPath = join(releasesDir, firefoxZipName);
  execSync(`cd "${firefoxDistDir}" && zip -r "${firefoxZipPath}" . -x '*.zip'`, { stdio: 'inherit' });
  console.log(`  ✓ Created ${firefoxZipName}`);
} else {
  console.error(`  ✗ Firefox dist not found at ${firefoxDistDir}`);
  process.exit(1);
}

console.log(`\nRelease packages ready in ./releases/`);
console.log(`  - dataLayerLens-${version}-chrome.zip`);
console.log(`  - dataLayerLens-${version}-firefox.zip\n`);
