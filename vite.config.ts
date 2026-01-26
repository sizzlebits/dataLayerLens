import { defineConfig, Plugin, PluginOption, build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const browser = process.env.BROWSER || 'chrome';
const isStorybook = process.env.STORYBOOK === 'true' || process.argv.includes('storybook');

// Read version from package.json
function getPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  return packageJson.version;
}

// Plugin to remove crossorigin attribute from HTML (breaks Firefox extensions)
function removeCrossOrigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

// Plugin to copy manifest and icons, then build standalone scripts
function copyExtensionFiles(): Plugin {
  return {
    name: 'copy-extension-files',
    async writeBundle() {
      const outDir = `dist/${browser}`;

      // Copy manifest with version from package.json
      const manifestSrc = `public/manifest.${browser}.json`;
      const manifestDest = `${outDir}/manifest.json`;
      if (existsSync(manifestSrc)) {
        const manifest = JSON.parse(readFileSync(manifestSrc, 'utf-8'));
        manifest.version = getPackageVersion();
        writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));
        console.log(`📦 Manifest version set to ${manifest.version}`);
      }

      // Copy icons
      const iconsDir = `${outDir}/icons`;
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }

      // Copy all icon files
      const iconFiles = ['icon.svg', 'icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];
      for (const iconFile of iconFiles) {
        const iconSrc = `public/icons/${iconFile}`;
        if (existsSync(iconSrc)) {
          copyFileSync(iconSrc, `${iconsDir}/${iconFile}`);
        }
      }
    },
  };
}

// Build standalone scripts (content, background, injected) as IIFE
async function buildStandaloneScripts(): Promise<Plugin> {
  return {
    name: 'build-standalone-scripts',
    async closeBundle() {
      const outDir = `dist/${browser}`;

      // Scripts that need to be built as IIFE (no ES modules)
      const standaloneScripts = [
        { name: 'content', entry: 'src/content/index.ts' },
        { name: 'background', entry: 'src/background/index.ts' },
        { name: 'injected', entry: 'src/injected/index.ts' },
      ];

      for (const script of standaloneScripts) {
        // No banner needed - we'll access customElements at runtime when DOM is ready
        const banner = '';

        await build({
          configFile: false,
          resolve: {
            alias: {
              '@': resolve(__dirname, 'src'),
            },
          },
          define: {
            'process.env.BROWSER': JSON.stringify(browser),
          },
          build: {
            outDir,
            emptyOutDir: false,
            lib: {
              entry: resolve(__dirname, script.entry),
              name: script.name,
              formats: ['iife'],
              fileName: () => `${script.name}.js`,
            },
            rollupOptions: {
              output: {
                extend: true,
                banner,
              },
            },
            minify: false,
            sourcemap: true,
          },
          logLevel: 'warn',
        });
      }
    },
  };
}

export default defineConfig(async () => {
  // Only include extension-specific plugins when NOT building Storybook
  const plugins: PluginOption[] = [react()];
  if (!isStorybook) {
    plugins.push(removeCrossOrigin());
    plugins.push(copyExtensionFiles());
    plugins.push(await buildStandaloneScripts());
  }

  return {
    plugins,
    base: '', // Use relative paths for Chrome extension compatibility
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      'process.env.BROWSER': JSON.stringify(browser),
    },
    build: {
      outDir: `dist/${browser}`,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          devtools: resolve(__dirname, 'src/devtools/index.html'),
          'devtools-panel': resolve(__dirname, 'src/devtools/panel.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      sourcemap: process.env.NODE_ENV === 'development',
    },
  };
});
