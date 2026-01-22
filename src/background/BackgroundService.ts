/**
 * BackgroundService - Main service orchestrating background script functionality.
 * Handles message routing, event tracking, and settings management.
 */

import type { IBrowserAPI, MessageSender } from '@/services/browser';
import type { DataLayerEvent, Settings, DomainSettings } from '@/types';
import { createSettingsHandler, createEventHandler } from './handlers';
import type { ISettingsHandler, IEventHandler } from './handlers';

export interface BackgroundServiceOptions {
  browserAPI: IBrowserAPI;
  maxEventsPerTab?: number;
  globalSettingsKey?: string;
  domainSettingsKey?: string;
}

export interface IBackgroundService {
  /** Start listening for messages and tab events */
  start(): void;
  /** Stop listening */
  stop(): void;
  /** Get the settings handler */
  getSettingsHandler(): ISettingsHandler;
  /** Get the event handler */
  getEventHandler(): IEventHandler;
}

interface Message {
  type: string;
  payload?: unknown;
  domain?: string;
  saveGlobal?: boolean;
}

/**
 * Main background service that coordinates all background script functionality.
 */
export class BackgroundService implements IBackgroundService {
  private browserAPI: IBrowserAPI;
  private settingsHandler: ISettingsHandler;
  private eventHandler: IEventHandler;
  private messageListener: ((message: unknown, sender: MessageSender, sendResponse: (response?: unknown) => void) => boolean | void) | null = null;
  private tabRemovedListener: ((tabId: number) => void) | null = null;

  constructor(options: BackgroundServiceOptions) {
    this.browserAPI = options.browserAPI;

    this.settingsHandler = createSettingsHandler({
      browserAPI: options.browserAPI,
      globalSettingsKey: options.globalSettingsKey,
      domainSettingsKey: options.domainSettingsKey,
    });

    this.eventHandler = createEventHandler({
      browserAPI: options.browserAPI,
      maxEventsPerTab: options.maxEventsPerTab,
    });
  }

  start(): void {
    this.setupMessageListener();
    this.setupTabRemovedListener();
  }

  stop(): void {
    if (this.messageListener) {
      this.browserAPI.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }

    if (this.tabRemovedListener) {
      this.browserAPI.tabs.onRemoved.removeListener(this.tabRemovedListener);
      this.tabRemovedListener = null;
    }
  }

  getSettingsHandler(): ISettingsHandler {
    return this.settingsHandler;
  }

  getEventHandler(): IEventHandler {
    return this.eventHandler;
  }

  private setupMessageListener(): void {
    this.messageListener = (
      message: unknown,
      sender: MessageSender,
      sendResponse: (response?: unknown) => void
    ): boolean | void => {
      const msg = message as Message;
      const tabId = sender.tab?.id;
      const tabUrl = sender.tab?.url;
      const domain = tabUrl ? this.extractDomain(tabUrl) : undefined;

      switch (msg.type) {
        case 'DATALAYER_EVENT':
          if (tabId && msg.payload) {
            this.eventHandler.addEvent(tabId, msg.payload as DataLayerEvent);
          }
          break;

        case 'GET_TAB_EVENTS':
          if (tabId) {
            sendResponse({ events: this.eventHandler.getEvents(tabId) });
          }
          break;

        case 'CLEAR_TAB_EVENTS':
          if (tabId) {
            this.eventHandler.clearEvents(tabId);
            sendResponse({ success: true });
          }
          break;

        case 'GET_SETTINGS':
          this.settingsHandler
            .getSettingsForDomain(msg.domain || domain)
            .then((settings) => {
              sendResponse({ settings, domain: msg.domain || domain });
            });
          return true; // Async response

        case 'UPDATE_SETTINGS': {
          const targetDomain = msg.domain || domain;
          const saveGlobal = msg.saveGlobal !== false;

          if (targetDomain && !saveGlobal) {
            this.settingsHandler
              .saveDomainSettings(targetDomain, msg.payload as Partial<Settings>)
              .then(() => {
                sendResponse({ success: true, domain: targetDomain });
              });
          } else {
            this.settingsHandler
              .saveGlobalSettings(msg.payload as Partial<Settings>)
              .then(() => {
                sendResponse({ success: true });
              });
          }
          return true; // Async response
        }

        case 'GET_DOMAIN_SETTINGS':
          this.settingsHandler.getAllDomainSettings().then((domainSettings) => {
            sendResponse({ domainSettings });
          });
          return true;

        case 'DELETE_DOMAIN_SETTINGS':
          if (msg.domain) {
            this.settingsHandler.deleteDomainSettings(msg.domain).then(() => {
              sendResponse({ success: true });
            });
          } else {
            sendResponse({ success: false, error: 'No domain specified' });
          }
          return true;

        case 'EXPORT_ALL_SETTINGS':
          this.settingsHandler.exportAllSettings().then((data) => {
            sendResponse(data);
          });
          return true;

        case 'IMPORT_ALL_SETTINGS':
          if (msg.payload) {
            const data = msg.payload as {
              globalSettings?: Settings;
              domainSettings?: Record<string, DomainSettings>;
            };
            this.settingsHandler
              .importAllSettings(data)
              .then(() => {
                sendResponse({ success: true });
              })
              .catch((error) => {
                sendResponse({ success: false, error: error.message });
              });
          } else {
            sendResponse({ success: false, error: 'No settings data provided' });
          }
          return true;

        case 'SETTINGS_UPDATED':
          // Relay settings updates to all extension views (sidepanel, devtools, popup)
          // The message from content script includes tabId, add it if not present
          if (tabId) {
            this.browserAPI.runtime.sendMessage({
              type: 'SETTINGS_UPDATED',
              payload: msg.payload,
              tabId,
            }).catch(() => {}); // Ignore if no listeners
          }
          break;
      }

      return false;
    };

    this.browserAPI.runtime.onMessage.addListener(this.messageListener);
  }

  private setupTabRemovedListener(): void {
    this.tabRemovedListener = (tabId: number) => {
      this.eventHandler.removeTab(tabId);
    };

    this.browserAPI.tabs.onRemoved.addListener(this.tabRemovedListener);
  }

  private extractDomain(url: string): string | undefined {
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  }
}

/**
 * Factory function to create a BackgroundService instance.
 */
export function createBackgroundService(
  options: BackgroundServiceOptions
): IBackgroundService {
  return new BackgroundService(options);
}
