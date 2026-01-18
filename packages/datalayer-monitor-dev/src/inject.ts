/**
 * Auto-inject script - import this file to automatically initialise the monitor.
 *
 * @example
 * // In your app entry point
 * if (process.env.NODE_ENV === 'development') {
 *   import('datalayerlens/inject');
 * }
 */

import { initDataLayerMonitor } from './index';

// Auto-initialise with defaults
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initDataLayerMonitor();
    });
  } else {
    initDataLayerMonitor();
  }
}
