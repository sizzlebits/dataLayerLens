/**
 * Background service worker for the DataLayer Monitor extension.
 * Handles cross-tab communication and persistent state.
 */

import { DataLayerEvent, Settings, DEFAULT_SETTINGS, DEFAULT_GROUPING, DomainSettings } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Store events per tab
const tabEvents: Map<number, DataLayerEvent[]> = new Map();

// Storage keys
const GLOBAL_SETTINGS_KEY = 'datalayer_monitor_settings';
const DOMAIN_SETTINGS_KEY = 'datalayer_monitor_domain_settings';

// Get settings for a specific domain (merges global with domain-specific)
async function getSettingsForDomain(domain?: string): Promise<Settings> {
  const result = await browserAPI.storage.local.get([GLOBAL_SETTINGS_KEY, DOMAIN_SETTINGS_KEY]);
  const globalSettings: Settings = {
    ...DEFAULT_SETTINGS,
    ...result[GLOBAL_SETTINGS_KEY],
    grouping: { ...DEFAULT_GROUPING, ...result[GLOBAL_SETTINGS_KEY]?.grouping },
  };

  if (!domain) return globalSettings;

  const domainSettings: Record<string, DomainSettings> = result[DOMAIN_SETTINGS_KEY] || {};
  const domainOverride = domainSettings[domain];

  // IMPORTANT: overlayEnabled is per-domain only - never inherit from global
  // If no domain-specific setting exists, overlay is disabled for this domain
  const domainOverlayEnabled = domainOverride?.settings?.overlayEnabled ?? false;

  if (!domainOverride) {
    // No domain settings - use global but with overlay disabled
    return {
      ...globalSettings,
      overlayEnabled: false,
    };
  }

  // Merge domain-specific settings with global
  return {
    ...globalSettings,
    ...domainOverride.settings,
    overlayEnabled: domainOverlayEnabled, // Always use domain-specific value
    grouping: { ...globalSettings.grouping, ...domainOverride.settings?.grouping },
  };
}

// Save domain-specific settings
async function saveDomainSettings(domain: string, settings: Partial<Settings>): Promise<void> {
  const result = await browserAPI.storage.local.get(DOMAIN_SETTINGS_KEY);
  const allDomainSettings: Record<string, DomainSettings> = result[DOMAIN_SETTINGS_KEY] || {};

  const existing = allDomainSettings[domain];
  allDomainSettings[domain] = {
    domain,
    settings: { ...existing?.settings, ...settings },
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  await browserAPI.storage.local.set({ [DOMAIN_SETTINGS_KEY]: allDomainSettings });
}

// Delete domain-specific settings
async function deleteDomainSettings(domain: string): Promise<void> {
  const result = await browserAPI.storage.local.get(DOMAIN_SETTINGS_KEY);
  const allDomainSettings: Record<string, DomainSettings> = result[DOMAIN_SETTINGS_KEY] || {};

  delete allDomainSettings[domain];

  await browserAPI.storage.local.set({ [DOMAIN_SETTINGS_KEY]: allDomainSettings });
}

// Get all domain settings
async function getAllDomainSettings(): Promise<Record<string, DomainSettings>> {
  const result = await browserAPI.storage.local.get(DOMAIN_SETTINGS_KEY);
  return result[DOMAIN_SETTINGS_KEY] || {};
}

// Handle messages
browserAPI.runtime.onMessage.addListener((message: { type: string; payload?: unknown; domain?: string; saveGlobal?: boolean }, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
  const tabId = sender.tab?.id;
  const tabUrl = sender.tab?.url;
  const domain = tabUrl ? new URL(tabUrl).hostname : undefined;

  switch (message.type) {
    case 'DATALAYER_EVENT':
      if (tabId) {
        const events = tabEvents.get(tabId) || [];
        events.unshift(message.payload as DataLayerEvent);
        if (events.length > 1000) events.length = 1000; // Limit storage
        tabEvents.set(tabId, events);

        // Notify any listeners (devtools)
        browserAPI.runtime.sendMessage({
          type: 'EVENT_ADDED',
          payload: message.payload,
          tabId,
        }).catch(() => {
          // No listeners
        });
      }
      break;

    case 'GET_TAB_EVENTS':
      if (tabId) {
        sendResponse({ events: tabEvents.get(tabId) || [] });
      }
      break;

    case 'CLEAR_TAB_EVENTS':
      if (tabId) {
        tabEvents.delete(tabId);
        sendResponse({ success: true });
      }
      break;

    case 'GET_SETTINGS':
      // Support domain-specific settings
      getSettingsForDomain(message.domain || domain).then((settings) => {
        sendResponse({ settings, domain: message.domain || domain });
      });
      return true; // Async response

    case 'UPDATE_SETTINGS': {
      const targetDomain = message.domain || domain;
      const saveGlobal = message.saveGlobal !== false;

      if (targetDomain && !saveGlobal) {
        // Save to domain-specific settings
        saveDomainSettings(targetDomain, message.payload as Partial<Settings>).then(() => {
          sendResponse({ success: true, domain: targetDomain });
        });
      } else {
        // Save to global settings
        browserAPI.storage.local.get(GLOBAL_SETTINGS_KEY).then((result: { [key: string]: unknown }) => {
          const stored = result[GLOBAL_SETTINGS_KEY] as Partial<Settings> | undefined;
          const current: Settings = { ...DEFAULT_SETTINGS, ...stored };
          const updated = { ...current, ...(message.payload as Partial<Settings>) };
          return browserAPI.storage.local.set({ [GLOBAL_SETTINGS_KEY]: updated });
        }).then(() => {
          sendResponse({ success: true });
        });
      }
      return true; // Async response
    }

    case 'GET_DOMAIN_SETTINGS':
      getAllDomainSettings().then((domainSettings) => {
        sendResponse({ domainSettings });
      });
      return true;

    case 'DELETE_DOMAIN_SETTINGS':
      if (message.domain) {
        deleteDomainSettings(message.domain).then(() => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'No domain specified' });
      }
      return true;

    case 'EXPORT_ALL_SETTINGS':
      Promise.all([
        browserAPI.storage.local.get(GLOBAL_SETTINGS_KEY),
        getAllDomainSettings(),
      ]).then(([globalResult, domainSettings]) => {
        sendResponse({
          globalSettings: { ...DEFAULT_SETTINGS, ...globalResult[GLOBAL_SETTINGS_KEY] },
          domainSettings,
          exportedAt: Date.now(),
          version: '1.0',
        });
      });
      return true;

    case 'IMPORT_ALL_SETTINGS':
      if (message.payload) {
        const { globalSettings, domainSettings } = message.payload as { globalSettings?: Settings; domainSettings?: Record<string, DomainSettings> };
        Promise.all([
          globalSettings ? browserAPI.storage.local.set({ [GLOBAL_SETTINGS_KEY]: globalSettings }) : Promise.resolve(),
          domainSettings ? browserAPI.storage.local.set({ [DOMAIN_SETTINGS_KEY]: domainSettings }) : Promise.resolve(),
        ]).then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'No settings data provided' });
      }
      return true;
  }

  return false;
});

// Clean up when tab is closed
browserAPI.tabs.onRemoved.addListener((tabId: number) => {
  tabEvents.delete(tabId);
});

// Handle extension icon click
browserAPI.action?.onClicked?.addListener(async (tab: chrome.tabs.Tab) => {
  if (!tab.id) return;

  // Toggle overlay
  try {
    await browserAPI.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_OVERLAY',
    });
  } catch {
    // Content script not loaded, inject it
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  }
});

// Firefox compatibility for browser_action
if ((browserAPI as unknown as { browserAction?: typeof chrome.action }).browserAction) {
  (browserAPI as unknown as { browserAction: typeof chrome.action }).browserAction.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
    if (!tab.id) return;

    try {
      await browserAPI.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_OVERLAY',
      });
    } catch {
      // Content script not loaded
    }
  });
}

console.log('[DataLayer Monitor] Background service worker initialized');
