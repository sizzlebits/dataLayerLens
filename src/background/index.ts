/**
 * Background service worker for the DataLayer Monitor extension.
 * Handles cross-tab communication and persistent state.
 */

import { chromeBrowserAPI } from '@/services/browser';
import { createBackgroundService } from './BackgroundService';

// Get the browser API (Chrome or Firefox)
const browserAPI = typeof browser !== 'undefined' ? browser : chromeBrowserAPI;

// Create and start the background service
const service = createBackgroundService({
  browserAPI,
  maxEventsPerTab: 1000,
  globalSettingsKey: 'datalayer_monitor_settings',
  domainSettingsKey: 'datalayer_monitor_domain_settings',
});

service.start();

// Re-export for external use
export { createBackgroundService, BackgroundService } from './BackgroundService';
export type { BackgroundServiceOptions, IBackgroundService } from './BackgroundService';
export * from './handlers';
