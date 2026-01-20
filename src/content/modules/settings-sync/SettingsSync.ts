/**
 * Settings synchronization utilities for the DataLayer Lens overlay.
 * Handles saving/loading settings to storage and notifying DevTools.
 */

import { Settings, getCurrentDomain } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Track if extension context is still valid
let extensionContextValid = true;

// Check if extension context is still valid
function isExtensionContextValid(): boolean {
  try {
    return extensionContextValid && !!browserAPI.runtime?.id;
  } catch {
    extensionContextValid = false;
    return false;
  }
}

/**
 * Safe wrapper for runtime.sendMessage that handles invalidated context.
 */
export function safeSendMessage(message: unknown): Promise<unknown> {
  if (!isExtensionContextValid()) {
    return Promise.resolve(undefined);
  }
  return browserAPI.runtime.sendMessage(message).catch((error: Error) => {
    if (error?.message?.includes('Extension context invalidated')) {
      extensionContextValid = false;
      console.debug('[DataLayer Lens] Extension context invalidated - please reload the page');
    }
  });
}

/**
 * Save settings to chrome.storage.local.
 */
export async function saveSettingsToStorage(
  settings: Settings,
  debugLogging: boolean = false
): Promise<void> {
  try {
    await browserAPI.storage.local.set({ datalayer_monitor_settings: settings });
  } catch (error) {
    if (debugLogging) {
      console.error('[DataLayer Lens] Failed to save settings:', error);
    }
  }
}

/**
 * Save overlay enabled state to domain-specific settings.
 */
export async function saveDomainOverlayEnabled(
  enabled: boolean,
  settings: Settings,
  debugLogging: boolean = false
): Promise<void> {
  const currentDomain = getCurrentDomain();
  try {
    await browserAPI.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      domain: currentDomain,
      saveGlobal: false,
      payload: { overlayEnabled: enabled },
    });
  } catch (error) {
    if (debugLogging) {
      console.error('[DataLayer Lens] Failed to save domain overlay setting:', error);
    }
    // Fallback to global settings
    await saveSettingsToStorage(settings, debugLogging);
  }
}

/**
 * Notify DevTools panel of event changes.
 */
export function notifyDevTools(events: unknown[]): void {
  safeSendMessage({
    type: 'EVENTS_UPDATED',
    payload: events,
  });
}

/**
 * Send a dataLayer event to the background script.
 */
export function sendEventToBackground(event: unknown): void {
  safeSendMessage({
    type: 'DATALAYER_EVENT',
    payload: event,
  });
}
