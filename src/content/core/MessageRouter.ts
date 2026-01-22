/**
 * MessageRouter module - handles message passing between content script,
 * background script, popup, and devtools.
 */

import type { DataLayerEvent, Settings } from '@/types';
import type { IBrowserRuntime } from '@/services/browser';

/**
 * Minimal runtime interface for MessageRouter.
 * Uses a subset of IBrowserRuntime to reduce coupling.
 */
export interface IMessageRouterRuntime {
  id?: string;
  sendMessage<T = unknown>(message: unknown): Promise<T>;
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: { tab?: { id?: number; url?: string } },
        sendResponse: (response?: unknown) => void
      ) => boolean | void
    ): void;
    removeListener(
      callback: (
        message: unknown,
        sender: { tab?: { id?: number; url?: string } },
        sendResponse: (response?: unknown) => void
      ) => boolean | void
    ): void;
  };
}

export interface MessageRouterCallbacks {
  /** Get all captured events */
  onGetEvents: () => DataLayerEvent[];
  /** Clear all events */
  onClearEvents: () => void;
  /** Update settings */
  onUpdateSettings: (settings: Partial<Settings>) => void;
  /** Get current settings */
  onGetSettings: () => Settings;
}

export interface MessageRouterOptions {
  /** Browser runtime API */
  runtime: IMessageRouterRuntime;
  /** Message callbacks */
  callbacks: MessageRouterCallbacks;
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
}

/**
 * Handle a message and return the appropriate response.
 * This is a pure function that can be tested independently.
 */
export function handleMessage(
  message: { type: string; payload?: unknown },
  callbacks: MessageRouterCallbacks
): { response: unknown } {
  switch (message.type) {
    case 'GET_EVENTS':
      return { response: { events: callbacks.onGetEvents() } };

    case 'CLEAR_EVENTS':
      callbacks.onClearEvents();
      return { response: { success: true } };

    case 'UPDATE_SETTINGS': {
      const settingsPayload = message.payload as Partial<Settings>;
      callbacks.onUpdateSettings(settingsPayload);
      return { response: { success: true } };
    }

    case 'GET_SETTINGS':
      return { response: { settings: callbacks.onGetSettings() } };

    default:
      return { response: { success: false } };
  }
}

/**
 * Handles message routing between content script and extension components.
 */
export class MessageRouter implements IMessageRouter {
  private runtime: IMessageRouterRuntime;
  private callbacks: MessageRouterCallbacks;
  private listener: ((
    message: unknown,
    sender: { tab?: { id?: number; url?: string } },
    sendResponse: (response?: unknown) => void
  ) => boolean | void) | null = null;
  private isListening = false;
  private extensionContextValid = true;

  constructor(options: MessageRouterOptions) {
    this.runtime = options.runtime;
    this.callbacks = options.callbacks;
  }

  /**
   * Check if extension context is still valid.
   */
  private checkContextValid(): boolean {
    try {
      return this.extensionContextValid && !!this.runtime?.id;
    } catch {
      this.extensionContextValid = false;
      return false;
    }
  }

  /**
   * Safe wrapper for runtime.sendMessage that handles invalidated context.
   */
  private safeSendMessage(message: unknown): Promise<unknown> {
    if (!this.checkContextValid()) {
      return Promise.resolve(undefined);
    }
    return this.runtime.sendMessage(message).catch((error: Error) => {
      if (error?.message?.includes('Extension context invalidated')) {
        this.extensionContextValid = false;
        // Silent - extension context invalidated is expected on page reload
      }
    });
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

      const result = handleMessage(msg, this.callbacks);
      sendResponse(result.response);
      return true; // Keep channel open for async response
    };

    this.runtime.onMessage.addListener(this.listener);
    this.isListening = true;
  }

  /**
   * Stop listening for messages.
   */
  stop(): void {
    if (this.listener) {
      this.runtime.onMessage.removeListener(this.listener);
      this.listener = null;
    }
    this.isListening = false;
  }

  /**
   * Check if extension context is valid.
   */
  isContextValid(): boolean {
    return this.checkContextValid();
  }

  /**
   * Send settings changed notification.
   */
  notifySettingsChanged(settings: Settings): void {
    this.safeSendMessage({
      type: 'SETTINGS_CHANGED',
      payload: settings,
    });
  }

  /**
   * Send events updated notification.
   */
  notifyEventsUpdated(events: DataLayerEvent[]): void {
    this.safeSendMessage({
      type: 'EVENTS_UPDATED',
      payload: events,
    });
  }

  /**
   * Send a dataLayer event to background.
   */
  sendDataLayerEvent(event: DataLayerEvent): void {
    this.safeSendMessage({
      type: 'DATALAYER_EVENT',
      payload: event,
    });
  }

  /**
   * Send settings update broadcast.
   */
  broadcastSettingsUpdate(settings: Partial<Settings>): void {
    this.safeSendMessage({
      type: 'SETTINGS_UPDATED',
      payload: settings,
    });
  }

  /**
   * Request settings from background for a specific domain.
   */
  async requestSettings(domain: string): Promise<Settings | null> {
    if (!this.checkContextValid()) {
      return null;
    }

    try {
      const response = await this.runtime.sendMessage({
        type: 'GET_SETTINGS',
        domain,
      }) as { settings?: Settings };

      return response?.settings ?? null;
    } catch (error) {
      if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
        this.extensionContextValid = false;
      }
      return null;
    }
  }
}

/**
 * Factory function to create a MessageRouter instance with the default browser runtime.
 */
export function createMessageRouter(callbacks: MessageRouterCallbacks): IMessageRouter {
  // Default to chrome/browser API
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  return new MessageRouter({
    runtime: browserAPI.runtime as IMessageRouterRuntime,
    callbacks,
  });
}
