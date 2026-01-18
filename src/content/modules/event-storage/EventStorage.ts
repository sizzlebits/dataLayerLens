/**
 * EventStorage module - manages the in-memory storage of captured dataLayer events.
 * Handles adding events, limiting the number of stored events, and accessing events.
 */

import type { DataLayerEvent } from '@/types';

export interface EventStorageOptions {
  /** Maximum number of events to store */
  maxEvents: number;
  /** Callback when events change */
  onEventsChange?: (events: DataLayerEvent[]) => void;
}

export interface IEventStorage {
  /** Add a new event to storage */
  addEvent(event: DataLayerEvent): void;
  /** Get all stored events */
  getEvents(): DataLayerEvent[];
  /** Get event by ID */
  getEventById(id: string): DataLayerEvent | undefined;
  /** Clear all events */
  clearEvents(): void;
  /** Set events directly (used for loading persisted events) */
  setEvents(events: DataLayerEvent[]): void;
  /** Get current max events limit */
  getMaxEvents(): number;
  /** Update max events limit */
  setMaxEvents(maxEvents: number): void;
  /** Get event count */
  getEventCount(): number;
}

/**
 * Manages in-memory storage of dataLayer events.
 * Events are stored in reverse chronological order (newest first).
 */
export class EventStorage implements IEventStorage {
  private events: DataLayerEvent[] = [];
  private maxEvents: number;
  private onEventsChange?: (events: DataLayerEvent[]) => void;

  constructor(options: EventStorageOptions) {
    this.maxEvents = options.maxEvents;
    this.onEventsChange = options.onEventsChange;
  }

  /**
   * Add a new event to storage.
   * Events are added at the beginning (newest first).
   * Older events are removed if max limit is exceeded.
   */
  addEvent(event: DataLayerEvent): void {
    // Add new event at the beginning
    this.events.unshift(event);

    // Remove oldest events if over limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    this.notifyChange();
  }

  /**
   * Get all stored events.
   * Returns a copy to prevent external mutation.
   */
  getEvents(): DataLayerEvent[] {
    return [...this.events];
  }

  /**
   * Get event by ID.
   */
  getEventById(id: string): DataLayerEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  /**
   * Clear all events.
   */
  clearEvents(): void {
    this.events = [];
    this.notifyChange();
  }

  /**
   * Set events directly (used for loading persisted events).
   * Events are expected to be in chronological order and will be reversed if needed.
   */
  setEvents(events: DataLayerEvent[]): void {
    this.events = events.slice(0, this.maxEvents);
    this.notifyChange();
  }

  /**
   * Get current max events limit.
   */
  getMaxEvents(): number {
    return this.maxEvents;
  }

  /**
   * Update max events limit.
   * Will trim events if current count exceeds new limit.
   */
  setMaxEvents(maxEvents: number): void {
    this.maxEvents = maxEvents;

    if (this.events.length > maxEvents) {
      this.events = this.events.slice(0, maxEvents);
      this.notifyChange();
    }
  }

  /**
   * Get event count.
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Notify listeners of event change.
   */
  private notifyChange(): void {
    if (this.onEventsChange) {
      this.onEventsChange(this.getEvents());
    }
  }
}

/**
 * Factory function to create an EventStorage instance.
 */
export function createEventStorage(options: EventStorageOptions): IEventStorage {
  return new EventStorage(options);
}
