import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../docs/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Add path alias support
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
    };

    return config;
  },
  // Load mocks before preview
  previewHead: (head) => `
    <script>
      // Browser extension API mocks for Storybook
      const createEventMock = () => ({
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
      });

      // Sample events for Storybook demos
      const now = Date.now();
      const sampleEvents = [
        { id: 'e1', timestamp: now - 1000, event: 'gtm.js', data: { 'gtm.start': now - 5000 }, source: 'dataLayer', raw: {}, dataLayerIndex: 0 },
        { id: 'e2', timestamp: now - 800, event: 'gtm.dom', data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 1 },
        { id: 'e3', timestamp: now - 600, event: 'page_view', data: { page_title: 'Home', page_location: 'https://example.com/' }, source: 'dataLayer', raw: {}, dataLayerIndex: 2 },
        { id: 'e4', timestamp: now - 400, event: 'view_item', data: { item_id: 'SKU123', item_name: 'Blue T-Shirt', price: 29.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 3 },
        { id: 'e5', timestamp: now - 200, event: 'add_to_cart', data: { item_id: 'SKU123', quantity: 1, value: 29.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 4 },
        { id: 'e6', timestamp: now - 100, event: 'gtm.click', data: { 'gtm.element': 'button.add-cart' }, source: 'dataLayer', raw: {}, dataLayerIndex: 5 },
      ];

      const mockBrowserAPI = {
        runtime: {
          sendMessage: async () => ({ success: true }),
          onMessage: createEventMock(),
          onConnect: createEventMock(),
          onInstalled: createEventMock(),
          id: 'mock-extension-id',
          getURL: (path) => 'chrome-extension://mock-extension-id/' + path,
        },
        storage: {
          local: {
            get: async () => ({}),
            set: async () => {},
            remove: async () => {},
            clear: async () => {},
          },
          sync: {
            get: async () => ({}),
            set: async () => {},
            remove: async () => {},
            clear: async () => {},
          },
          onChanged: createEventMock(),
        },
        tabs: {
          query: async () => [{ id: 1, url: 'https://example.com', active: true }],
          sendMessage: async (tabId, message) => {
            if (message && message.type === 'GET_EVENTS') {
              return { success: true, events: sampleEvents };
            }
            return { success: true, events: [] };
          },
          get: async () => ({ id: 1, url: 'https://example.com' }),
          onUpdated: createEventMock(),
          onRemoved: createEventMock(),
          onActivated: createEventMock(),
        },
        devtools: {
          inspectedWindow: {
            tabId: 1,
            eval: (expression, callback) => { if (callback) callback(null, null); },
          },
          panels: {
            create: () => {},
          },
        },
        action: {
          onClicked: createEventMock(),
          setBadgeText: async () => {},
          setBadgeBackgroundColor: async () => {},
        },
        scripting: {
          executeScript: async () => [{ result: null }],
        },
      };

      window.chrome = mockBrowserAPI;
      window.browser = mockBrowserAPI;
    </script>
    ${head}
  `,
};

export default config;
