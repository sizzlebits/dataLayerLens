/**
 * ContentScriptCore - Main orchestrator for the content script.
 * Coordinates script injection, event management, message routing, and overlay.
 */

import type { DataLayerEvent, Settings } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_GROUPING, getCurrentDomain } from '@/types';
import { createScriptInjector, type IScriptInjector } from './ScriptInjector';
import { createEventManager, type IEventManager } from './EventManager';
import { createMessageRouter, type IMessageRouter } from './MessageRouter';
import { createOverlayController, type IOverlayController } from './OverlayController';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export interface ContentScriptCoreOptions {
  /** Enable overlay feature (can be disabled for sidepanel-only mode) */
  overlayEnabled?: boolean;
}

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
  private overlayController: IOverlayController | null = null;
  private currentSettings: Settings = DEFAULT_SETTINGS;
  private currentDomain: string;
  private overlayFeatureEnabled: boolean;
  private hasDataLayerActivity = false;
  private overlayInteractionTime = 0;

  private static readonly INTERACTION_DEBOUNCE_MS = 100;

  constructor(options: ContentScriptCoreOptions = {}) {
    this.overlayFeatureEnabled = options.overlayEnabled ?? true;
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
      onToggleOverlay: (enabled) => this.handleToggleOverlay(enabled),
      onUpdateSettings: (settings) => this.handleUpdateSettings(settings),
      onGetSettings: () => this.currentSettings,
    });
  }

  /**
   * Initialize the content script.
   */
  async initialize(): Promise<void> {
    console.debug('[DataLayer Lens] Initializing content script...');

    // Set up event blocking early
    this.setupEventBlocking();

    // Load settings
    await this.loadSettings();
    console.debug('[DataLayer Lens] Settings loaded:', {
      overlayEnabled: this.currentSettings.overlayEnabled,
      overlayFeatureEnabled: this.overlayFeatureEnabled,
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

    // Check if we have events (indicates dataLayer activity)
    if (this.eventManager.getEventCount() > 0) {
      this.hasDataLayerActivity = true;
    }

    // Create overlay if enabled
    if (this.overlayFeatureEnabled && this.currentSettings.overlayEnabled) {
      console.debug('[DataLayer Lens] Creating overlay...');
      this.createOverlay();
    } else {
      console.debug('[DataLayer Lens] Overlay not enabled, skipping creation');
    }
  }

  /**
   * Load settings from storage or background script.
   */
  private async loadSettings(): Promise<void> {
    // Try to get settings from background script (includes domain-specific settings)
    const settings = await this.messageRouter.requestSettings(this.currentDomain);
    console.debug('[DataLayer Lens] Settings from background:', settings ? { persistEvents: settings.persistEvents } : 'null');

    if (settings) {
      this.currentSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
        grouping: { ...DEFAULT_GROUPING, ...settings.grouping },
        overlayAnchor: {
          ...DEFAULT_SETTINGS.overlayAnchor,
          ...settings.overlayAnchor,
        },
      };
    } else {
      // Fallback to direct storage access
      try {
        const result = await browserAPI.storage.local.get('datalayer_monitor_settings');
        const savedSettings = result.datalayer_monitor_settings || {};

        this.currentSettings = {
          ...DEFAULT_SETTINGS,
          ...savedSettings,
          grouping: { ...DEFAULT_GROUPING, ...savedSettings.grouping },
          overlayAnchor: {
            ...DEFAULT_SETTINGS.overlayAnchor,
            ...savedSettings.overlayAnchor,
          },
        };
      } catch {
        // Use defaults
      }
    }

    // Update event manager with loaded settings
    this.eventManager.updateSettings({
      maxEvents: this.currentSettings.maxEvents,
      persistEvents: this.currentSettings.persistEvents,
      persistEventsMaxAge: this.currentSettings.persistEventsMaxAge,
      grouping: this.currentSettings.grouping,
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
   * Set up event blocking to prevent tracking scripts from receiving our overlay events.
   */
  private setupEventBlocking(): void {
    const eventsToBlock = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'];

    eventsToBlock.forEach(eventType => {
      document.addEventListener(eventType, (e: Event) => {
        const path = e.composedPath();
        const isFromOverlay = path.some(
          (el) => el instanceof Element && el.id === 'datalayer-monitor-root'
        );

        if (isFromOverlay) {
          e.stopImmediatePropagation();
          this.overlayInteractionTime = Date.now();

          if ((eventType === 'click' || eventType === 'mousedown') && this.overlayController) {
            const target = path[0] as HTMLElement;
            if (target) {
              const customEventName = eventType === 'click' ? 'overlay-click' : 'overlay-mousedown';
              const mouseEvent = e as MouseEvent;
              const customEvent = new CustomEvent(customEventName, {
                bubbles: true,
                detail: {
                  originalTarget: target,
                  clientX: mouseEvent.clientX,
                  clientY: mouseEvent.clientY
                }
              });
              target.dispatchEvent(customEvent);
            }
          }
        }
      }, true);
    });
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
    this.hasDataLayerActivity = true;

    // Filter out events triggered by overlay interaction
    const isClickEvent = payload.event?.includes('click') ||
                        payload.event?.includes('intent.gtm') ||
                        payload.data?.event_type === 'click';
    const isFromOverlayInteraction =
      Date.now() - this.overlayInteractionTime < ContentScriptCore.INTERACTION_DEBOUNCE_MS;

    if (isClickEvent && isFromOverlayInteraction) {
      return;
    }

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

    // Update overlay
    this.updateOverlay();
  }

  /**
   * Handle groups change from event manager.
   */
  private handleGroupsChange(): void {
    this.updateOverlay();
  }

  /**
   * Handle clear events request.
   */
  private handleClearEvents(): void {
    this.eventManager.clearEvents();
    this.messageRouter.notifyEventsUpdated([]);
  }

  /**
   * Handle toggle overlay request.
   */
  private handleToggleOverlay(enabled?: boolean): boolean {
    console.debug('[DataLayer Lens] Toggle overlay requested:', { enabled, current: this.currentSettings.overlayEnabled });
    this.currentSettings.overlayEnabled = enabled ?? !this.currentSettings.overlayEnabled;

    // Save to domain-specific settings
    this.messageRouter.saveDomainOverlayEnabled(
      this.currentDomain,
      this.currentSettings.overlayEnabled
    );

    if (this.currentSettings.overlayEnabled) {
      console.debug('[DataLayer Lens] Creating overlay...');
      this.createOverlay();
    } else {
      console.debug('[DataLayer Lens] Destroying overlay...');
      this.destroyOverlay();
    }

    return this.currentSettings.overlayEnabled;
  }

  /**
   * Handle settings update request.
   */
  private handleUpdateSettings(settings: Partial<Settings>): void {
    // Update settings
    this.currentSettings = { ...this.currentSettings, ...settings };

    // Merge grouping settings properly
    if (settings.grouping) {
      this.currentSettings.grouping = {
        ...this.currentSettings.grouping,
        ...settings.grouping,
      };
    }

    // Merge anchor settings properly
    if (settings.overlayAnchor) {
      this.currentSettings.overlayAnchor = {
        ...this.currentSettings.overlayAnchor,
        ...settings.overlayAnchor,
      };
      this.overlayController?.applyPositionAnchor(this.currentSettings);
    }

    // Save settings
    this.saveSettings();

    // Update monitoring config
    this.scriptInjector.updateConfig({
      dataLayerNames: this.currentSettings.dataLayerNames,
      consoleLogging: this.currentSettings.consoleLogging,
    });

    // Update event manager
    this.eventManager.updateSettings({
      maxEvents: this.currentSettings.maxEvents,
      persistEvents: this.currentSettings.persistEvents,
      persistEventsMaxAge: this.currentSettings.persistEventsMaxAge,
      grouping: this.currentSettings.grouping,
    });

    // Rebuild groups if grouping setting changed
    if (settings.grouping?.enabled !== undefined) {
      this.eventManager.rebuildGroups();
    }

    // Update overlay
    this.overlayController?.updateSettings(this.currentSettings);
    this.updateOverlay();

    // Handle persist toggle
    if (settings.persistEvents !== undefined && settings.persistEvents) {
      this.eventManager.savePersistedEvents();
    }

    // Broadcast settings change
    this.messageRouter.broadcastSettingsUpdate(settings);
  }

  /**
   * Create the overlay.
   */
  private createOverlay(): void {
    if (this.overlayController?.exists()) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => this.createOverlay());
      return;
    }

    this.overlayController = createOverlayController({
      onClose: () => {
        console.debug('[DataLayer Lens] onClose callback triggered');
        this.currentSettings.overlayEnabled = false;
        this.saveSettings();
        this.destroyOverlay();
      },
      onClearEvents: () => this.handleClearEvents(),
      onCollapseToggle: (collapsed) => {
        this.currentSettings.overlayCollapsed = collapsed;
        this.saveSettings();
        this.overlayController?.updateCollapseState(collapsed);
      },
      onGroupingToggle: (enabled) => {
        this.currentSettings.grouping.enabled = enabled;
        this.saveSettings();
        this.eventManager.updateSettings({ grouping: this.currentSettings.grouping });
        if (enabled) {
          this.eventManager.rebuildGroups();
        }
        this.overlayController?.updateSettings(this.currentSettings);
        this.updateOverlay();
      },
      onPersistToggle: async (enabled) => {
        this.currentSettings.persistEvents = enabled;
        await this.saveSettings();
        this.eventManager.updateSettings({ persistEvents: enabled });
        if (enabled) {
          await this.eventManager.savePersistedEvents();
        }
        this.overlayController?.updateSettings(this.currentSettings);
        // Broadcast so background and other views are updated
        this.messageRouter.broadcastSettingsUpdate({ persistEvents: enabled });
      },
      onResize: (height) => {
        this.currentSettings.overlayHeight = height;
        this.saveSettings();
      },
      onFilterAdd: (filter, mode) => {
        if (this.currentSettings.filterMode !== mode) {
          this.currentSettings.eventFilters = [];
          this.currentSettings.filterMode = mode;
        }
        if (!this.currentSettings.eventFilters.includes(filter)) {
          this.currentSettings.eventFilters.push(filter);
        }
        this.saveSettings();
        this.updateOverlay();
        this.messageRouter.notifySettingsChanged(this.currentSettings);
      },
      onFilterRemove: (filter) => {
        this.currentSettings.eventFilters = this.currentSettings.eventFilters.filter(f => f !== filter);
        this.saveSettings();
        this.updateOverlay();
        this.messageRouter.notifySettingsChanged(this.currentSettings);
      },
      onFilterModeChange: (mode, clearFilters) => {
        this.currentSettings.filterMode = mode;
        if (clearFilters) {
          this.currentSettings.eventFilters = [];
        }
        this.saveSettings();
        this.updateOverlay();
        this.messageRouter.notifySettingsChanged(this.currentSettings);
      },
      onCopyEvent: (event) => {
        const eventData = {
          event: event.event,
          ...event.data,
        };
        navigator.clipboard.writeText(JSON.stringify(eventData, null, 2)).catch(() => {
          // Ignore clipboard errors
        });
      },
      getEventById: (id) => this.eventManager.getEventById(id),
      getExpandedEventIds: () => this.eventManager.getExpandedEventIds(),
      toggleEventExpanded: (id) => this.eventManager.toggleEventExpanded(id),
      toggleGroupCollapsed: (id) => this.eventManager.toggleGroupCollapsed(id),
      isGroupCollapsed: (id) => this.eventManager.isGroupCollapsed(id),
      debugLogging: this.currentSettings.debugLogging,
    });

    this.overlayController.create(this.currentSettings);
    this.updateOverlay();

    // Check for dataLayer activity after a delay
    setTimeout(() => this.checkDataLayerActivity(), 1500);
  }

  /**
   * Destroy the overlay.
   */
  private destroyOverlay(): void {
    console.debug('[DataLayer Lens] ContentScriptCore.destroyOverlay called');
    this.overlayController?.destroy();
    this.overlayController = null;
  }

  /**
   * Update the overlay with current events.
   */
  private updateOverlay(): void {
    if (!this.overlayController?.exists()) return;

    this.overlayController.updateEvents(
      this.eventManager.getEvents(),
      this.eventManager.getGroups(),
      this.currentSettings
    );
  }

  /**
   * Check if dataLayer exists and collapse overlay if not.
   */
  private checkDataLayerActivity(): void {
    if (this.hasDataLayerActivity || this.eventManager.getEventCount() > 0) {
      return;
    }

    // Check if any configured dataLayer arrays exist
    const dataLayerExists = this.currentSettings.dataLayerNames.some(name => {
      const dl = (window as unknown as Record<string, unknown>)[name];
      return Array.isArray(dl) && dl.length > 0;
    });

    if (dataLayerExists) {
      this.hasDataLayerActivity = true;
      return;
    }

    // No dataLayer - collapse to minimized state
    if (this.overlayController?.exists()) {
      this.currentSettings.overlayCollapsed = true;
      this.overlayController.updateCollapseState(true);
    }
  }
}

/**
 * Factory function to create a ContentScriptCore instance.
 */
export function createContentScriptCore(options?: ContentScriptCoreOptions): IContentScriptCore {
  return new ContentScriptCore(options);
}
