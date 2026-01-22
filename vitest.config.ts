import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

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
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
          // Don't specify include - Storybook plugin uses the stories field from .storybook/main.ts
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
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './coverage/junit.xml',
    },
  },
});
