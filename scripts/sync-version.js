#!/usr/bin/env node

/**
 * Syncs the version from package.json to both Chrome and Firefox manifest files.
 * Run automatically via npm version hook.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Read package.json version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Syncing version ${version} to manifests...`);

// Update Chrome manifest
const chromeManifestPath = join(rootDir, 'public/manifest.chrome.json');
const chromeManifest = JSON.parse(readFileSync(chromeManifestPath, 'utf8'));
chromeManifest.version = version;
writeFileSync(chromeManifestPath, JSON.stringify(chromeManifest, null, 2) + '\n');
console.log(`  ✓ Updated manifest.chrome.json`);

// Update Firefox manifest
const firefoxManifestPath = join(rootDir, 'public/manifest.firefox.json');
const firefoxManifest = JSON.parse(readFileSync(firefoxManifestPath, 'utf8'));
firefoxManifest.version = version;
writeFileSync(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2) + '\n');
console.log(`  ✓ Updated manifest.firefox.json`);

console.log(`Version sync complete!`);
