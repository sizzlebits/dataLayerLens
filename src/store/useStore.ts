/**
 * Default store instance using the native browser API.
 * For testing, use createStore() directly with a mock browser API.
 */

import { chromeBrowserAPI } from '@/services/browser';
import { createStore } from './createStore';

// Get the browser API (Chrome or Firefox)
const browserAPI = typeof browser !== 'undefined' ? browser : chromeBrowserAPI;

// Create the default store instance
const { useStore, setupStorageListener, setupMessageListener } = createStore({
  browserAPI,
  maxEvents: 500,
  settingsKey: 'datalayer_monitor_settings',
});

// Set up listeners for the default store
setupStorageListener();
setupMessageListener();

// Export the store hook
export { useStore };

// Re-export types and factory for testing
export { createStore } from './createStore';
export type { StoreState, StoreOptions } from './createStore';
