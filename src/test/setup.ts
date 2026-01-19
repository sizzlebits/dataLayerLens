import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Framer Motion to avoid DOM warnings about whileHover, whileTap, etc.
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get: (_, tag: string) => {
          // Return a simple component that filters out Framer Motion specific props
          return React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref) => {
            // Filter out Framer Motion props that cause React warnings
            const filteredProps = Object.fromEntries(
              Object.entries(props).filter(
                ([key]) =>
                  ![
                    'whileHover',
                    'whileTap',
                    'whileFocus',
                    'whileDrag',
                    'whileInView',
                    'animate',
                    'initial',
                    'exit',
                    'variants',
                    'transition',
                    'layout',
                    'layoutId',
                    'drag',
                    'dragConstraints',
                    'dragElastic',
                    'dragMomentum',
                    'onDragStart',
                    'onDrag',
                    'onDragEnd',
                  ].includes(key)
              )
            );
            return React.createElement(tag, { ...filteredProps, ref }, children);
          });
        },
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

// Mock Chrome API
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://test-extension-id/${path}`),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn(),
  },
  devtools: {
    panels: {
      create: vi.fn(),
    },
    inspectedWindow: {
      tabId: 1,
      eval: vi.fn(),
    },
  },
};

// @ts-expect-error - Mocking global chrome object
globalThis.chrome = mockChrome;

// @ts-expect-error - Also mock browser for Firefox
globalThis.browser = mockChrome;
