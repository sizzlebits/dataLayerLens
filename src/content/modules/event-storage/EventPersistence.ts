/**
 * EventPersistence module - handles persisting events to browser storage.
 * Allows events to survive page refreshes.
 */

import type { IBrowserAPI } from '@/services/browser';
import type { DataLayerEvent } from '@/types';
import { createDebugLogger, type DebugLogger } from '@/utils/debug';

export interface EventPersistenceOptions {
  /** Browser API instance for storage */
  browserAPI: IBrowserAPI;
  /** Current domain for storage key */
  domain: string;
  /** Maximum age of persisted events in milliseconds (0 = no limit) */
  maxAge: number;
  /** Maximum number of events to persist */
  maxEvents: number;
  /** Debug logging enabled */
  debugLogging?: boolean;
}

export interface PersistedEventsData {
  events: DataLayerEvent[];
  lastUpdated: number;
}

export interface IEventPersistence {
  /** Load persisted events from storage */
  loadEvents(): Promise<DataLayerEvent[]>;
  /** Save events to storage */
  saveEvents(events: DataLayerEvent[]): Promise<void>;
  /** Clear persisted events */
  clearEvents(): Promise<void>;
  /** Update persistence settings */
  updateSettings(maxAge: number, maxEvents: number): void;
  /** Update debug logging setting */
  updateDebugLogging(enabled: boolean): void;
}

/**
 * Manages persisting dataLayer events to browser storage.
 */
export class EventPersistence implements IEventPersistence {
  private browserAPI: IBrowserAPI;
  private domain: string;
  private maxAge: number;
  private maxEvents: number;
  private logger: DebugLogger;

  constructor(options: EventPersistenceOptions) {
    this.browserAPI = options.browserAPI;
    this.domain = options.domain;
    this.maxAge = options.maxAge;
    this.maxEvents = options.maxEvents;
    this.logger = createDebugLogger(options.debugLogging ?? false);
  }

  updateDebugLogging(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }

  private getStorageKey(): string {
    return `persisted_events_${this.domain}`;
  }

  /**
   * Load persisted events from storage.
   * Filters out expired events based on maxAge setting.
   * Marks loaded events with "(persisted)" in their source.
   */
  async loadEvents(): Promise<DataLayerEvent[]> {
    try {
      const key = this.getStorageKey();
      this.logger.debug('EventPersistence.loadEvents key:', key);
      const result = await this.browserAPI.storage.local.get<Record<string, PersistedEventsData>>(key);
      const persisted = result[key];
      this.logger.debug('EventPersistence.loadEvents found:', persisted?.events?.length ?? 0, 'events');

      if (!persisted?.events?.length) {
        return [];
      }

      const now = Date.now();

      // Filter out expired events
      const validEvents =
        this.maxAge > 0
          ? persisted.events.filter((e: DataLayerEvent) => now - e.timestamp < this.maxAge)
          : persisted.events;

      if (validEvents.length === 0) {
        return [];
      }

      // Mark persisted events
      this.logger.debug('Marking', validEvents.length, 'events as persisted');
      validEvents.forEach((e: DataLayerEvent) => {
        if (!e.source.includes('(persisted)')) {
          e.source = `${e.source} (persisted)`;
        }
      });

      return validEvents;
    } catch (error) {
      this.logger.error('Failed to load persisted events:', error);
      return [];
    }
  }

  /**
   * Save events to storage.
   * Saves all events, stripping the "(persisted)" marker to avoid double-marking on load.
   */
  async saveEvents(events: DataLayerEvent[]): Promise<void> {
    try {
      const key = this.getStorageKey();
      this.logger.debug('EventPersistence.saveEvents key:', key, 'count:', events.length);

      // Save all events, but strip "(persisted)" marker to avoid double-marking on next load
      const eventsToSave = events.map((e) => ({
        ...e,
        source: e.source.replace(' (persisted)', '').replace('(persisted)', ''),
      }));

      await this.browserAPI.storage.local.set({
        [key]: {
          events: eventsToSave.slice(0, this.maxEvents),
          lastUpdated: Date.now(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to save persisted events:', error);
    }
  }

  /**
   * Clear persisted events from storage.
   */
  async clearEvents(): Promise<void> {
    try {
      const key = this.getStorageKey();
      await this.browserAPI.storage.local.remove(key);
    } catch (error) {
      this.logger.error('Failed to clear persisted events:', error);
    }
  }

  /**
   * Update persistence settings.
   */
  updateSettings(maxAge: number, maxEvents: number): void {
    this.maxAge = maxAge;
    this.maxEvents = maxEvents;
  }
}

/**
 * Factory function to create an EventPersistence instance.
 */
export function createEventPersistence(options: EventPersistenceOptions): IEventPersistence {
  return new EventPersistence(options);
}
