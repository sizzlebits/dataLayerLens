/**
 * EventManager module - coordinates event storage, grouping, and persistence.
 * Uses the existing EventStorage, EventGrouping, and EventPersistence modules.
 */

import type { DataLayerEvent, EventGroup, GroupingConfig } from '@/types';
import { DEFAULT_GROUPING, getCurrentDomain } from '@/types';
import {
  createEventStorage,
  type IEventStorage,
} from '../modules/event-storage/EventStorage';
import {
  createEventGrouping,
  type IEventGrouping,
} from '../modules/event-storage/EventGrouping';
import {
  createEventPersistence,
  type IEventPersistence,
} from '../modules/event-storage/EventPersistence';
import { chromeBrowserAPI } from '@/services/browser';
import { createDebugLogger, type DebugLogger } from '@/utils/debug';

export interface EventManagerOptions {
  /** Maximum number of events to store */
  maxEvents: number;
  /** Whether to persist events across page loads */
  persistEvents: boolean;
  /** Maximum age of persisted events in milliseconds */
  persistEventsMaxAge: number;
  /** Initial grouping configuration */
  grouping: GroupingConfig;
  /** Debug logging enabled */
  debugLogging?: boolean;
  /** Callback when events change */
  onEventsChange?: (events: DataLayerEvent[]) => void;
  /** Callback when groups change */
  onGroupsChange?: (groups: EventGroup[]) => void;
}

export interface IEventManager {
  /** Add a new event */
  addEvent(event: DataLayerEvent): void;
  /** Get all events */
  getEvents(): DataLayerEvent[];
  /** Get event by ID */
  getEventById(id: string): DataLayerEvent | undefined;
  /** Get all event groups */
  getGroups(): EventGroup[];
  /** Clear all events and groups */
  clearEvents(): Promise<void>;
  /** Load persisted events from storage */
  loadPersistedEvents(): Promise<void>;
  /** Save current events to storage */
  savePersistedEvents(): Promise<void>;
  /** Update settings (maxEvents, persist, grouping) */
  updateSettings(settings: Partial<EventManagerOptions>): void;
  /** Rebuild event groups (e.g., when grouping is enabled) */
  rebuildGroups(): void;
  /** Toggle group collapsed state */
  toggleGroupCollapsed(groupId: string): void;
  /** Check if group is collapsed */
  isGroupCollapsed(groupId: string): boolean;
  /** Get expanded event IDs */
  getExpandedEventIds(): Set<string>;
  /** Toggle event expanded state */
  toggleEventExpanded(eventId: string): void;
  /** Check if event is expanded */
  isEventExpanded(eventId: string): boolean;
  /** Get event count */
  getEventCount(): number;
}

/**
 * Coordinates event storage, grouping, and persistence.
 */
export class EventManager implements IEventManager {
  private storage: IEventStorage;
  private grouping: IEventGrouping;
  private persistence: IEventPersistence;
  private expandedEventIds = new Set<string>();
  private persistEnabled: boolean;
  private logger: DebugLogger;
  private onEventsChange?: (events: DataLayerEvent[]) => void;

  constructor(options: EventManagerOptions) {
    this.persistEnabled = options.persistEvents;
    this.logger = createDebugLogger(options.debugLogging ?? false);
    this.onEventsChange = options.onEventsChange;

    // Initialize event storage
    this.storage = createEventStorage({
      maxEvents: options.maxEvents,
      onEventsChange: (events) => {
        if (this.onEventsChange) {
          this.onEventsChange(events);
        }
      },
    });

    // Initialize event grouping
    this.grouping = createEventGrouping({
      settings: options.grouping || DEFAULT_GROUPING,
      onGroupsChange: options.onGroupsChange,
    });

    // Initialize event persistence
    this.persistence = createEventPersistence({
      browserAPI: chromeBrowserAPI,
      domain: getCurrentDomain(),
      maxAge: options.persistEventsMaxAge,
      maxEvents: options.maxEvents,
      debugLogging: options.debugLogging,
    });
  }

  /**
   * Add a new event.
   * Also adds the event to the appropriate group if grouping is enabled.
   */
  addEvent(event: DataLayerEvent): void {
    this.storage.addEvent(event);
    this.grouping.addEventToGroup(event);

    // Auto-save if persistence is enabled
    if (this.persistEnabled) {
      this.savePersistedEvents();
    }
  }

  /**
   * Get all events.
   */
  getEvents(): DataLayerEvent[] {
    return this.storage.getEvents();
  }

  /**
   * Get event by ID.
   */
  getEventById(id: string): DataLayerEvent | undefined {
    return this.storage.getEventById(id);
  }

  /**
   * Get all event groups.
   */
  getGroups(): EventGroup[] {
    return this.grouping.getGroups();
  }

  /**
   * Clear all events and groups.
   */
  async clearEvents(): Promise<void> {
    this.storage.clearEvents();
    this.grouping.clearGroups();
    this.expandedEventIds.clear();
    await this.persistence.clearEvents();
  }

  /**
   * Load persisted events from storage.
   */
  async loadPersistedEvents(): Promise<void> {
    this.logger.debug('loadPersistedEvents called, persistEnabled:', this.persistEnabled);
    if (!this.persistEnabled) {
      this.logger.debug('Persist disabled, skipping load');
      return;
    }

    const events = await this.persistence.loadEvents();
    this.logger.debug('Loaded persisted events:', events.length);
    if (events.length > 0) {
      this.storage.setEvents(events);

      // Rebuild groups if grouping is enabled
      if (this.grouping.getSettings().enabled) {
        this.grouping.rebuildGroups(events);
      }
    }
  }

  /**
   * Save current events to storage.
   */
  async savePersistedEvents(): Promise<void> {
    if (!this.persistEnabled) return;
    await this.persistence.saveEvents(this.storage.getEvents());
  }

  /**
   * Update settings.
   */
  updateSettings(settings: Partial<EventManagerOptions>): void {
    if (settings.maxEvents !== undefined) {
      this.storage.setMaxEvents(settings.maxEvents);
      this.persistence.updateSettings(
        settings.persistEventsMaxAge ?? 0,
        settings.maxEvents
      );
    }

    if (settings.persistEvents !== undefined) {
      this.logger.debug('EventManager.updateSettings persistEvents:', settings.persistEvents);
      this.persistEnabled = settings.persistEvents;
      // Don't auto-save here - events are saved automatically in addEvent() when persist is enabled
      // Auto-saving here would wipe persisted events on page load (before events are loaded)
    }

    if (settings.persistEventsMaxAge !== undefined) {
      this.persistence.updateSettings(
        settings.persistEventsMaxAge,
        this.storage.getMaxEvents()
      );
    }

    if (settings.grouping !== undefined) {
      this.grouping.updateSettings(settings.grouping);
    }

    if (settings.debugLogging !== undefined) {
      this.logger.setEnabled(settings.debugLogging);
      this.persistence.updateDebugLogging(settings.debugLogging);
    }
  }

  /**
   * Rebuild event groups.
   */
  rebuildGroups(): void {
    this.grouping.rebuildGroups(this.storage.getEvents());
  }

  /**
   * Toggle group collapsed state.
   */
  toggleGroupCollapsed(groupId: string): void {
    this.grouping.toggleGroupCollapsed(groupId);
  }

  /**
   * Check if group is collapsed.
   */
  isGroupCollapsed(groupId: string): boolean {
    return this.grouping.isGroupCollapsed(groupId);
  }

  /**
   * Get expanded event IDs.
   */
  getExpandedEventIds(): Set<string> {
    return new Set(this.expandedEventIds);
  }

  /**
   * Toggle event expanded state.
   */
  toggleEventExpanded(eventId: string): void {
    if (this.expandedEventIds.has(eventId)) {
      this.expandedEventIds.delete(eventId);
    } else {
      this.expandedEventIds.add(eventId);
    }
  }

  /**
   * Check if event is expanded.
   */
  isEventExpanded(eventId: string): boolean {
    return this.expandedEventIds.has(eventId);
  }

  /**
   * Get event count.
   */
  getEventCount(): number {
    return this.storage.getEventCount();
  }
}

/**
 * Factory function to create an EventManager instance.
 */
export function createEventManager(options: EventManagerOptions): IEventManager {
  return new EventManager(options);
}
