/**
 * MessageRouter module - handles message passing between content script,
 * background script, popup, devtools, and sidepanel.
 */

import type { DataLayerEvent, Settings } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Track if extension context is still valid
let extensionContextValid = true;

/**
 * Check if extension context is still valid.
 */
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
function safeSendMessage(message: unknown): Promise<unknown> {
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

export interface MessageRouterCallbacks {
  /** Get all captured events */
  onGetEvents: () => DataLayerEvent[];
  /** Clear all events */
  onClearEvents: () => void;
  /** Toggle overlay visibility */
  onToggleOverlay: (enabled?: boolean) => boolean;
  /** Update settings */
  onUpdateSettings: (settings: Partial<Settings>) => void;
  /** Get current settings */
  onGetSettings: () => Settings;
}

export interface IMessageRouter {
  /** Start listening for messages */
  start(): void;
  /** Stop listening for messages */
  stop(): void;
  /** Check if extension context is valid */
  isContextValid(): boolean;
  /** Send settings changed notification */
  notifySettingsChanged(settings: Settings): void;
  /** Send events updated notification */
  notifyEventsUpdated(events: DataLayerEvent[]): void;
  /** Send a dataLayer event to background */
  sendDataLayerEvent(event: DataLayerEvent): void;
  /** Send settings update broadcast */
  broadcastSettingsUpdate(settings: Partial<Settings>): void;
  /** Request settings from background for a specific domain */
  requestSettings(domain: string): Promise<Settings | null>;
  /** Save domain-specific overlay enabled state */
  saveDomainOverlayEnabled(domain: string, enabled: boolean): Promise<void>;
}

/**
 * Handles message routing between content script and extension components.
 */
export class MessageRouter implements IMessageRouter {
  private callbacks: MessageRouterCallbacks;
  private listener: ((
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | void) | null = null;
  private isListening = false;

  constructor(callbacks: MessageRouterCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start listening for messages from popup/background.
   */
  start(): void {
    if (this.isListening) return;

    this.listener = (message, _sender, sendResponse) => {
      const msg = message as { type: string; payload?: unknown; domain?: string };

      if (!msg || typeof msg.type !== 'string') {
        return;
      }

      this.handleMessage(msg, sendResponse);
      return true; // Keep channel open for async response
    };

    browserAPI.runtime.onMessage.addListener(this.listener);
    this.isListening = true;
  }

  /**
   * Stop listening for messages.
   */
  stop(): void {
    if (this.listener) {
      browserAPI.runtime.onMessage.removeListener(this.listener);
      this.listener = null;
    }
    this.isListening = false;
  }

  /**
   * Check if extension context is valid.
   */
  isContextValid(): boolean {
    return isExtensionContextValid();
  }

  /**
   * Send settings changed notification.
   */
  notifySettingsChanged(settings: Settings): void {
    safeSendMessage({
      type: 'SETTINGS_CHANGED',
      payload: settings,
    });
  }

  /**
   * Send events updated notification.
   */
  notifyEventsUpdated(events: DataLayerEvent[]): void {
    safeSendMessage({
      type: 'EVENTS_UPDATED',
      payload: events,
    });
  }

  /**
   * Send a dataLayer event to background.
   */
  sendDataLayerEvent(event: DataLayerEvent): void {
    safeSendMessage({
      type: 'DATALAYER_EVENT',
      payload: event,
    });
  }

  /**
   * Send settings update broadcast.
   */
  broadcastSettingsUpdate(settings: Partial<Settings>): void {
    safeSendMessage({
      type: 'SETTINGS_UPDATED',
      payload: settings,
    });
  }

  /**
   * Request settings from background for a specific domain.
   */
  async requestSettings(domain: string): Promise<Settings | null> {
    if (!isExtensionContextValid()) {
      return null;
    }

    try {
      const response = await browserAPI.runtime.sendMessage({
        type: 'GET_SETTINGS',
        domain,
      }) as { settings?: Settings };

      return response?.settings ?? null;
    } catch (error) {
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        extensionContextValid = false;
      }
      return null;
    }
  }

  /**
   * Save domain-specific overlay enabled state.
   */
  async saveDomainOverlayEnabled(domain: string, enabled: boolean): Promise<void> {
    try {
      await browserAPI.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        domain,
        saveGlobal: false,
        payload: { overlayEnabled: enabled },
      });
    } catch {
      // Fallback handled by caller
    }
  }

  /**
   * Handle incoming message.
   */
  private handleMessage(
    message: { type: string; payload?: unknown },
    sendResponse: (response?: unknown) => void
  ): void {
    switch (message.type) {
      case 'GET_EVENTS':
        sendResponse({ events: this.callbacks.onGetEvents() });
        break;

      case 'CLEAR_EVENTS':
        this.callbacks.onClearEvents();
        sendResponse({ success: true });
        break;

      case 'TOGGLE_OVERLAY': {
        const payload = message.payload as { enabled?: boolean } | undefined;
        const enabled = this.callbacks.onToggleOverlay(payload?.enabled);
        sendResponse({ enabled });
        break;
      }

      case 'UPDATE_SETTINGS': {
        const settingsPayload = message.payload as Partial<Settings>;
        this.callbacks.onUpdateSettings(settingsPayload);
        sendResponse({ success: true });
        break;
      }

      case 'GET_SETTINGS':
        sendResponse({ settings: this.callbacks.onGetSettings() });
        break;

      default:
        sendResponse({ success: false });
    }
  }
}

/**
 * Factory function to create a MessageRouter instance.
 */
export function createMessageRouter(callbacks: MessageRouterCallbacks): IMessageRouter {
  return new MessageRouter(callbacks);
}
