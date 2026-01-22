/**
 * Browser API service module.
 * Re-exports the interface, implementations, and factory functions.
 */

export type {
  IBrowserAPI,
  IBrowserRuntime,
  IBrowserStorage,
  IBrowserStorageArea,
  IBrowserTabs,
  IBrowserScripting,
  IBrowserAction,
  MessageSender,
  StorageAreaName,
  StorageChange,
  StorageChanges,
  Tab,
  TabQueryInfo,
  ScriptInjectionTarget,
} from './BrowserAPI';

export { ChromeBrowserAPI, getBrowserAPI } from './ChromeBrowserAPI';

// Default instance for runtime use
import { getBrowserAPI } from './ChromeBrowserAPI';
export const chromeBrowserAPI = getBrowserAPI();

// MockBrowserAPI exports are intentionally not re-exported here
// to avoid pulling vitest into production bundles.
// Import directly from './MockBrowserAPI' in test files.
