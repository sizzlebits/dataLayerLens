import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
  test: {
    // Define multiple test projects using test.projects
    projects: [
      // Unit/integration tests project
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'src'),
          },
        },
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/*.visual.test.{js,ts,jsx,tsx}'],
        },
      },
      // Storybook browser tests project
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'src'),
          },
          dedupe: ['react', 'react-dom'],
        },
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'framer-motion',
            '@testing-library/dom',
            '@testing-library/user-event',
          ],
          force: true,
        },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              screenshot: 'only-on-failure',
            }),
            instances: [{ browser: 'chromium' }],
            screenshotDirectory: './test-results/screenshots',
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
          // Don't specify include - Storybook plugin uses the stories field from .storybook/main.ts
        },
      },
      // Visual regression tests project
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'src'),
          },
          dedupe: ['react', 'react-dom'],
        },
        optimizeDeps: {
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'framer-motion',
            '@testing-library/dom',
            '@testing-library/user-event',
          ],
          force: true,
        },
        test: {
          name: 'visual',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              screenshot: 'on',
            }),
            instances: [{ browser: 'chromium' }],
            screenshotDirectory: './test-results/screenshots',
            expect: {
              toMatchScreenshot: {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                  threshold: 0.2,
                  allowedMismatchedPixelRatio: 0.04, // Allow 4% difference for cross-platform rendering
                },
                resolveScreenshotPath: ({ testFileDirectory, testFileName, arg, browserName, ext }) => {
                  const filename = path.basename(testFileName);
                  return `${testFileDirectory}/__snapshots__/${filename}/${arg}-${browserName}${ext}`;
                },
              },
            },
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
          include: ['src/**/*.visual.test.{js,ts,jsx,tsx}'],
        },
      },
    ],
    // Shared test configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'cobertura'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'dist/**',
        'scripts/**',
        'datalayer-monitor-dev/**',
        'packages/**',
      ],
    },
    reporters: ['default', 'junit', 'tree'],
    outputFile: {
      junit: './coverage/junit.xml',
    },
  },
});
