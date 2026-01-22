/**
 * ContentMessageHandler module - handles messages from popup/background scripts.
 * Processes commands like GET_EVENTS, CLEAR_EVENTS, UPDATE_SETTINGS.
 */

import type { IBrowserAPI, MessageSender } from '@/services/browser';
import type { DataLayerEvent, Settings } from '@/types';
import { createDebugLogger, type DebugLogger } from '@/utils/debug';

export type MessageType =
  | 'GET_EVENTS'
  | 'CLEAR_EVENTS'
  | 'UPDATE_SETTINGS'
  | 'GET_SETTINGS'
  | 'PING';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

export interface MessageResponse {
  events?: DataLayerEvent[];
  settings?: Settings;
  success?: boolean;
  pong?: boolean;
}

export interface MessageHandlerCallbacks {
  /** Get all captured events */
  onGetEvents: () => DataLayerEvent[];
  /** Clear all events */
  onClearEvents: () => void;
  /** Update settings */
  onUpdateSettings: (settings: Partial<Settings>) => void;
  /** Get current settings */
  onGetSettings: () => Settings;
}

export interface ContentMessageHandlerOptions {
  /** Browser API instance */
  browserAPI: IBrowserAPI;
  /** Callbacks for handling different message types */
  callbacks: MessageHandlerCallbacks;
  /** Debug logging enabled */
  debugLogging?: boolean;
}

export interface IContentMessageHandler {
  /** Start listening for messages */
  start(): void;
  /** Stop listening for messages */
  stop(): void;
}

/**
 * Handles messages from popup and background scripts to the content script.
 */
export class ContentMessageHandler implements IContentMessageHandler {
  private browserAPI: IBrowserAPI;
  private callbacks: MessageHandlerCallbacks;
  private logger: DebugLogger;
  private listener:
    | ((
        message: unknown,
        sender: MessageSender,
        sendResponse: (response?: unknown) => void
      ) => boolean | void)
    | null = null;
  private isListening = false;

  constructor(options: ContentMessageHandlerOptions) {
    this.browserAPI = options.browserAPI;
    this.callbacks = options.callbacks;
    this.logger = createDebugLogger(options.debugLogging ?? false);
  }

  /**
   * Start listening for messages.
   */
  start(): void {
    if (this.isListening) {
      return;
    }

    this.listener = (
      message: unknown,
      _sender: MessageSender,
      sendResponse: (response?: unknown) => void
    ): boolean | void => {
      const msg = message as Message;

      if (!msg || typeof msg.type !== 'string') {
        return;
      }

      try {
        const response = this.handleMessage(msg);
        sendResponse(response);
      } catch (error) {
        this.logger.error('Error handling message:', error);
        sendResponse({ success: false });
      }

      // Return false for synchronous response
      return false;
    };

    this.browserAPI.runtime.onMessage.addListener(this.listener);
    this.isListening = true;
  }

  /**
   * Stop listening for messages.
   */
  stop(): void {
    if (this.listener) {
      this.browserAPI.runtime.onMessage.removeListener(this.listener);
      this.listener = null;
    }
    this.isListening = false;
  }

  /**
   * Handle an incoming message and return the response.
   */
  private handleMessage(message: Message): MessageResponse {
    switch (message.type) {
      case 'GET_EVENTS':
        return { events: this.callbacks.onGetEvents() };

      case 'CLEAR_EVENTS':
        this.callbacks.onClearEvents();
        return { success: true };

      case 'UPDATE_SETTINGS': {
        const settingsPayload = message.payload as Partial<Settings>;
        this.callbacks.onUpdateSettings(settingsPayload);
        return { success: true };
      }

      case 'GET_SETTINGS':
        return { settings: this.callbacks.onGetSettings() };

      case 'PING':
        return { pong: true };

      default:
        this.logger.error('Unknown message type:', message.type);
        return { success: false };
    }
  }
}

/**
 * Factory function to create a ContentMessageHandler instance.
 */
export function createContentMessageHandler(
  options: ContentMessageHandlerOptions
): IContentMessageHandler {
  return new ContentMessageHandler(options);
}
