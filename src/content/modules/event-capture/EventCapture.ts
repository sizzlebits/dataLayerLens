/**
 * EventCapture module - handles injecting the page script and receiving dataLayer events.
 * Responsible for monitoring dataLayer pushes via an injected script.
 */

import type { IBrowserAPI } from '@/services/browser';
import type { DataLayerEvent } from '@/types';
import { generateEventId } from '@/utils/id';
import { createDebugLogger, type DebugLogger } from '@/utils/debug';

export interface EventCaptureOptions {
  /** Browser API instance for dependency injection */
  browserAPI: IBrowserAPI;
  /** Callback when a new event is captured */
  onEvent: (event: DataLayerEvent) => void;
  /** Names of dataLayer arrays to monitor */
  dataLayerNames: string[];
  /** Debug logging enabled */
  debugLogging?: boolean;
  /** Console logging enabled (logs dataLayer events to browser console) */
  consoleLogging?: boolean;
}

export interface IEventCapture {
  /** Initialize the event capture (inject script, set up listeners) */
  initialize(): void;
  /** Update the dataLayer names being monitored and console logging setting */
  updateConfig(dataLayerNames: string[], consoleLogging?: boolean): void;
  /** Clean up listeners */
  destroy(): void;
}

/**
 * Captures dataLayer events by injecting a page script and listening for messages.
 */
export class EventCapture implements IEventCapture {
  private browserAPI: IBrowserAPI;
  private onEvent: (event: DataLayerEvent) => void;
  private dataLayerNames: string[];
  private consoleLogging: boolean;
  private logger: DebugLogger;
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private isInitialized = false;

  constructor(options: EventCaptureOptions) {
    this.browserAPI = options.browserAPI;
    this.onEvent = options.onEvent;
    this.dataLayerNames = options.dataLayerNames;
    this.consoleLogging = options.consoleLogging ?? false;
    this.logger = createDebugLogger(options.debugLogging ?? false);
  }

  /**
   * Initialize event capture by injecting the page script and setting up message listeners.
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.injectScript();
    this.setupMessageListener();
    this.isInitialized = true;
  }

  /**
   * Inject the page script that monitors dataLayer.
   */
  private injectScript(): void {
    try {
      const script = document.createElement('script');
      script.src = this.browserAPI.runtime.getURL('injected.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      this.logger.error('Failed to inject script:', error);
    }
  }

  /**
   * Set up the message listener to receive events from the injected script.
   */
  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Only accept messages from the same origin
      if (event.source !== window) {
        return;
      }

      const { data } = event;

      // Handle dataLayer events from injected script
      if (data?.type === 'DATALAYER_PUSH') {
        this.handleDataLayerPush(data.payload);
      }

      // Handle initialization confirmation
      if (data?.type === 'DATALAYER_MONITOR_READY') {
        this.sendInitConfig();
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Send initialization config to the injected script.
   */
  private sendInitConfig(): void {
    window.postMessage(
      {
        type: 'DATALAYER_MONITOR_INIT',
        payload: {
          dataLayerNames: this.dataLayerNames,
          consoleLogging: this.consoleLogging,
        },
      },
      '*'
    );
  }

  /**
   * Handle a dataLayer push event from the injected script.
   */
  private handleDataLayerPush(payload: {
    data: unknown;
    source: string;
    timestamp?: number;
  }): void {
    const eventData = payload.data as Record<string, unknown>;

    // Only process events with an event property
    if (!eventData || typeof eventData.event !== 'string' || !eventData.event.trim()) {
      return;
    }

    const event: DataLayerEvent = {
      id: generateEventId(),
      timestamp: payload.timestamp ?? Date.now(),
      event: eventData.event as string,
      data: eventData,
      source: payload.source,
      raw: payload.data,
      dataLayerIndex: 0, // Index not tracked in push handler
    };

    this.onEvent(event);
  }

  /**
   * Update the dataLayer names being monitored and console logging setting.
   */
  updateConfig(dataLayerNames: string[], consoleLogging?: boolean): void {
    this.dataLayerNames = dataLayerNames;
    if (consoleLogging !== undefined) {
      this.consoleLogging = consoleLogging;
    }

    window.postMessage(
      {
        type: 'DATALAYER_MONITOR_UPDATE_CONFIG',
        payload: {
          dataLayerNames: this.dataLayerNames,
          consoleLogging: this.consoleLogging,
        },
      },
      '*'
    );
  }

  /**
   * Clean up listeners.
   */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    this.isInitialized = false;
  }
}

/**
 * Factory function to create an EventCapture instance.
 */
export function createEventCapture(options: EventCaptureOptions): IEventCapture {
  return new EventCapture(options);
}
