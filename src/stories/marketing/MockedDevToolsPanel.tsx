/**
 * MockedDevToolsPanel - Wrapper for DevToolsPanel in Storybook
 * Mocks the Chrome browser API to provide controlled data for stories
 */

import { useEffect, useState, useRef } from 'react';
import { DevToolsPanel } from '@/devtools/DevToolsPanel';
import type { DataLayerEvent, Settings } from '@/types';
import type { IBrowserAPI, IBrowserTabs } from '@/services/browser/BrowserAPI';

interface MockedDevToolsPanelProps {
  forceTheme?: 'light' | 'dark';
  mockEvents?: DataLayerEvent[];
  mockSettings?: Settings;
  mockExpandedEvents?: string[];
  /** Click the grouping toggle button after mount (for side-by-side stories) */
  clickGroupToggle?: boolean;
}

// Sample events for non-mocked stories (same as .storybook/mocks/browserAPI.ts)
const now = Date.now();
const defaultSampleEvents: DataLayerEvent[] = [
  { id: 'e1', timestamp: now - 1000, event: 'gtm.js', data: { 'gtm.start': now - 5000 }, source: 'dataLayer', raw: {}, dataLayerIndex: 0 },
  { id: 'e2', timestamp: now - 800, event: 'gtm.dom', data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 1 },
  { id: 'e3', timestamp: now - 600, event: 'page_view', data: { page_title: 'Home', page_location: 'https://example.com/' }, source: 'dataLayer', raw: {}, dataLayerIndex: 2 },
  { id: 'e4', timestamp: now - 400, event: 'view_item', data: { item_id: 'SKU123', item_name: 'Blue T-Shirt', price: 29.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 3 },
  { id: 'e5', timestamp: now - 200, event: 'add_to_cart', data: { item_id: 'SKU123', quantity: 1, value: 29.99 }, source: 'dataLayer', raw: {}, dataLayerIndex: 4 },
  { id: 'e6', timestamp: now - 100, event: 'gtm.click', data: { 'gtm.element': 'button.add-cart' }, source: 'dataLayer', raw: {}, dataLayerIndex: 5 },
];

// Global registry of mock data per tabId to support multiple instances
const mockRegistry = new Map<number, {
  events: DataLayerEvent[];
  settings: Settings | null;
  expandedEvents: string[];
}>();

let nextTabId = 1;
let mocksInitialized = false;

export function MockedDevToolsPanel({
  forceTheme,
  mockEvents = [],
  mockSettings,
  mockExpandedEvents = [],
  clickGroupToggle = false,
}: MockedDevToolsPanelProps) {
  const [isReady, setIsReady] = useState(false);
  const tabIdRef = useRef<number>(nextTabId++);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabId = tabIdRef.current;
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    // Register this instance's mock data
    mockRegistry.set(tabId, {
      events: mockEvents,
      settings: mockSettings || null,
      expandedEvents: mockExpandedEvents,
    });

    // Initialize global mocks once
    if (!mocksInitialized) {
      mocksInitialized = true;

      // Define extended browser API type with devtools
      type BrowserAPIWithDevtools = IBrowserAPI & {
        devtools: {
          inspectedWindow: {
            tabId?: number;
          };
        };
      };

      // Mock devtools API
      if (!browserAPI.devtools) {
        (browserAPI as BrowserAPIWithDevtools).devtools = {
          inspectedWindow: {},
        };
      }
      if (!browserAPI.devtools.inspectedWindow) {
        (browserAPI as BrowserAPIWithDevtools).devtools.inspectedWindow = {};
      }

      // Mock storage.local.get to return mock settings from registry OR default (empty)
      if (browserAPI.storage?.local) {
        type MockableStorage = {
          get: (keys: string | string[] | null) => Promise<Record<string, unknown>>;
        };

        const storageLocal = browserAPI.storage.local as unknown as MockableStorage;
        storageLocal.get = async (keys: string | string[] | null) => {
          // Get the current tabId from devtools.inspectedWindow
          const currentTabId = browserAPI.devtools?.inspectedWindow?.tabId;

          // Only intercept if this tabId is in our registry (meaning it's a MockedDevToolsPanel)
          if (currentTabId && mockRegistry.has(currentTabId)) {
            const mockData = mockRegistry.get(currentTabId)!;
            if (mockData.settings && (keys === 'datalayer_monitor_settings' || (Array.isArray(keys) && keys.includes('datalayer_monitor_settings')))) {
              return { datalayer_monitor_settings: mockData.settings };
            }
            return {};
          }

          // Not a mocked instance - return empty (same behavior as global mock)
          return {};
        };
      }

      // Mock tabs.sendMessage to return mock events from registry OR default sample events
      if (browserAPI.tabs) {
        browserAPI.tabs.sendMessage = async (requestTabId: number, message: unknown) => {
          const msg = message as { type?: string };

          // Only intercept if this tabId is in our registry (meaning it's a MockedDevToolsPanel)
          if (mockRegistry.has(requestTabId)) {
            const mockData = mockRegistry.get(requestTabId)!;
            if (msg.type === 'GET_EVENTS') {
              return { events: mockData.events };
            }
            return {};
          }

          // Not a mocked instance - return default sample events (same behavior as global mock)
          if (msg && msg.type === 'GET_EVENTS') {
            return { success: true, events: defaultSampleEvents };
          }
          return { success: true, events: [] };
        };
      }

      // Mock tabs.onUpdated listener (no-op for stories)
      type BrowserAPIWithTabsOnUpdated = IBrowserAPI & {
        tabs: IBrowserTabs & {
          onUpdated: {
            addListener: (callback: (tabId: number, changeInfo: unknown) => void) => void;
            removeListener: (callback: (tabId: number, changeInfo: unknown) => void) => void;
          };
        };
      };

      if (browserAPI.tabs && !(browserAPI as BrowserAPIWithTabsOnUpdated).tabs.onUpdated) {
        (browserAPI as BrowserAPIWithTabsOnUpdated).tabs.onUpdated = {
          addListener: () => {},
          removeListener: () => {},
        };
      }

      // Mock runtime.onMessage already exists in IBrowserRuntime, no need to add
    }

    // Set this instance's tabId
    type BrowserAPIWithDevtools = IBrowserAPI & {
      devtools: {
        inspectedWindow: {
          tabId?: number;
        };
      };
    };
    (browserAPI as BrowserAPIWithDevtools).devtools.inspectedWindow.tabId = tabId;

    setIsReady(true);

    // After component mounts, perform UI interactions
    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      // Click the grouping toggle button if requested
      if (clickGroupToggle) {
        // Find the Grid button (grouping toggle) - it has a Grid icon and title "Toggle grouping"
        const groupButton = container.querySelector('button[title="Toggle grouping"]') as HTMLElement;
        if (groupButton) {
          groupButton.click();
        }
      }

      // Expand specified events
      if (mockExpandedEvents.length > 0) {
        mockExpandedEvents.forEach(eventId => {
          const eventRow = container.querySelector(`[data-event-id="${eventId}"]`);
          if (eventRow) {
            (eventRow as HTMLElement).click();
          }
        });
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      mockRegistry.delete(tabId);
    };
  }, [mockEvents, mockSettings, mockExpandedEvents, clickGroupToggle]);

  if (!isReady) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <DevToolsPanel forceTheme={forceTheme} />
    </div>
  );
}
