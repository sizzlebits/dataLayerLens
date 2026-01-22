/**
 * ContentScriptCore - Main orchestrator for the content script.
 * Coordinates script injection, event management, and message routing.
 */

import type { DataLayerEvent, Settings } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_GROUPING, getCurrentDomain, mergeSettings, mergeSettingsUpdate } from '@/types';
import { createScriptInjector, type IScriptInjector } from './ScriptInjector';
import { createEventManager, type IEventManager } from './EventManager';
import { createMessageRouter, type IMessageRouter } from './MessageRouter';
import { createDebugLogger, type DebugLogger } from '@/utils/debug';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export interface IContentScriptCore {
  /** Initialize the content script */
  initialize(): Promise<void>;
}

/**
 * Main orchestrator for the content script.
 * Coordinates all modules and handles the event flow.
 */
export class ContentScriptCore implements IContentScriptCore {
  private scriptInjector: IScriptInjector;
  private eventManager: IEventManager;
  private messageRouter: IMessageRouter;
  private currentSettings: Settings = DEFAULT_SETTINGS;
  private currentDomain: string;
  private logger: DebugLogger;

  constructor() {
    this.logger = createDebugLogger(false);
    this.currentDomain = getCurrentDomain();

    // Initialize script injector
    this.scriptInjector = createScriptInjector();

    // Initialize event manager
    this.eventManager = createEventManager({
      maxEvents: DEFAULT_SETTINGS.maxEvents,
      persistEvents: DEFAULT_SETTINGS.persistEvents,
      persistEventsMaxAge: DEFAULT_SETTINGS.persistEventsMaxAge,
      grouping: DEFAULT_GROUPING,
      onEventsChange: () => this.handleEventsChange(),
      onGroupsChange: () => this.handleGroupsChange(),
    });

    // Initialize message router
    this.messageRouter = createMessageRouter({
      onGetEvents: () => this.eventManager.getEvents(),
      onClearEvents: () => this.handleClearEvents(),
      onUpdateSettings: (settings) => this.handleUpdateSettings(settings),
      onGetSettings: () => this.currentSettings,
    });
  }

  /**
   * Initialize the content script.
   */
  async initialize(): Promise<void> {
    this.logger.debug('Initializing content script...');

    // Load settings
    await this.loadSettings();
    this.logger.debug('Settings loaded:', {
      persistEvents: this.currentSettings.persistEvents,
    });

    // Start message router
    this.messageRouter.start();

    // Listen for events from injected script
    this.setupPageMessageListener();

    // Inject the page script
    this.scriptInjector.inject();

    // Load persisted events
    await this.eventManager.loadPersistedEvents();
  }

  /**
   * Load settings from storage or background script.
   */
  private async loadSettings(): Promise<void> {
    // Try to get settings from background script (includes domain-specific settings)
    const settings = await this.messageRouter.requestSettings(this.currentDomain);
    this.logger.debug('Settings from background:', settings ? { persistEvents: settings.persistEvents } : 'null');

    if (settings) {
      this.currentSettings = mergeSettings(DEFAULT_SETTINGS, settings);
    } else {
      // Fallback to direct storage access
      try {
        const result = await browserAPI.storage.local.get('datalayer_monitor_settings');
        const savedSettings = result.datalayer_monitor_settings || {};
        this.currentSettings = mergeSettings(DEFAULT_SETTINGS, savedSettings);
      } catch {
        // Use defaults
      }
    }

    // Update logger with loaded debug setting
    this.logger.setEnabled(this.currentSettings.debugLogging);

    // Update event manager with loaded settings
    this.eventManager.updateSettings({
      maxEvents: this.currentSettings.maxEvents,
      persistEvents: this.currentSettings.persistEvents,
      persistEventsMaxAge: this.currentSettings.persistEventsMaxAge,
      grouping: this.currentSettings.grouping,
      debugLogging: this.currentSettings.debugLogging,
    });
  }

  /**
   * Save settings to storage.
   */
  private async saveSettings(): Promise<void> {
    try {
      await browserAPI.storage.local.set({
        datalayer_monitor_settings: this.currentSettings,
      });
    } catch {
      // Ignore errors
    }
  }

  /**
   * Set up listener for messages from the injected page script.
   */
  private setupPageMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (!event.data || typeof event.data !== 'object') return;

      const { type, payload } = event.data;

      if (type === 'DATALAYER_MONITOR_EVENT') {
        this.handleDataLayerEvent(payload);
      }

      if (type === 'DATALAYER_MONITOR_READY') {
        this.scriptInjector.initializeMonitoring({
          dataLayerNames: this.currentSettings.dataLayerNames,
          consoleLogging: this.currentSettings.consoleLogging,
        });
      }
    });
  }

  /**
   * Handle a dataLayer event from the injected script.
   */
  private handleDataLayerEvent(payload: DataLayerEvent): void {
    // Add event to manager
    this.eventManager.addEvent(payload);

    // Send to background
    this.messageRouter.sendDataLayerEvent(payload);
  }

  /**
   * Handle events change from event manager.
   */
  private handleEventsChange(): void {
    // Notify devtools
    this.messageRouter.notifyEventsUpdated(this.eventManager.getEvents());
  }

  /**
   * Handle groups change from event manager.
   */
  private handleGroupsChange(): void {
    // Groups changed - could be used for future features
  }

  /**
   * Handle clear events request.
   */
  private handleClearEvents(): void {
    this.eventManager.clearEvents();
    this.messageRouter.notifyEventsUpdated([]);
  }

  /**
   * Handle settings update request.
   */
  private handleUpdateSettings(settings: Partial<Settings>): void {
    // Update settings using shared merge utility
    this.currentSettings = mergeSettingsUpdate(this.currentSettings, settings);

    // Save settings
    this.saveSettings();

    // Update monitoring config
    this.scriptInjector.updateConfig({
      dataLayerNames: this.currentSettings.dataLayerNames,
      consoleLogging: this.currentSettings.consoleLogging,
    });

    // Update logger if debug setting changed
    if (settings.debugLogging !== undefined) {
      this.logger.setEnabled(settings.debugLogging);
    }

    // Update event manager
    this.eventManager.updateSettings({
      maxEvents: this.currentSettings.maxEvents,
      persistEvents: this.currentSettings.persistEvents,
      persistEventsMaxAge: this.currentSettings.persistEventsMaxAge,
      grouping: this.currentSettings.grouping,
      debugLogging: this.currentSettings.debugLogging,
    });

    // Rebuild groups if grouping setting changed
    if (settings.grouping?.enabled !== undefined) {
      this.eventManager.rebuildGroups();
    }

    // Handle persist toggle
    if (settings.persistEvents !== undefined && settings.persistEvents) {
      this.eventManager.savePersistedEvents();
    }

    // Broadcast settings change
    this.messageRouter.broadcastSettingsUpdate(settings);
  }
}

/**
 * Factory function to create a ContentScriptCore instance.
 */
export function createContentScriptCore(): IContentScriptCore {
  return new ContentScriptCore();
}
