/**
 * EventHandler - Handles event-related messages in the background script.
 */

import type { IBrowserAPI } from '@/services/browser';
import type { DataLayerEvent } from '@/types';

export interface EventHandlerOptions {
  browserAPI: IBrowserAPI;
  maxEventsPerTab?: number;
}

export interface IEventHandler {
  /** Add an event for a specific tab */
  addEvent(tabId: number, event: DataLayerEvent): void;
  /** Get all events for a specific tab */
  getEvents(tabId: number): DataLayerEvent[];
  /** Clear all events for a specific tab */
  clearEvents(tabId: number): void;
  /** Clear events for all tabs */
  clearAllEvents(): void;
  /** Remove events for a closed tab */
  removeTab(tabId: number): void;
  /** Get the count of events for a tab */
  getEventCount(tabId: number): number;
}

const DEFAULT_MAX_EVENTS = 1000;

/**
 * Handles per-tab event storage for the background script.
 */
export class EventHandler implements IEventHandler {
  private browserAPI: IBrowserAPI;
  private maxEventsPerTab: number;
  private tabEvents: Map<number, DataLayerEvent[]> = new Map();

  constructor(options: EventHandlerOptions) {
    this.browserAPI = options.browserAPI;
    this.maxEventsPerTab = options.maxEventsPerTab ?? DEFAULT_MAX_EVENTS;
  }

  addEvent(tabId: number, event: DataLayerEvent): void {
    const events = this.tabEvents.get(tabId) || [];
    events.unshift(event);

    // Limit storage
    if (events.length > this.maxEventsPerTab) {
      events.length = this.maxEventsPerTab;
    }

    this.tabEvents.set(tabId, events);

    // Notify listeners (devtools, popup)
    this.browserAPI.runtime.sendMessage({
      type: 'EVENT_ADDED',
      payload: event,
      tabId,
    }).catch(() => {
      // No listeners - this is expected
    });
  }

  getEvents(tabId: number): DataLayerEvent[] {
    return this.tabEvents.get(tabId) || [];
  }

  clearEvents(tabId: number): void {
    this.tabEvents.delete(tabId);
  }

  clearAllEvents(): void {
    this.tabEvents.clear();
  }

  removeTab(tabId: number): void {
    this.tabEvents.delete(tabId);
  }

  getEventCount(tabId: number): number {
    return this.tabEvents.get(tabId)?.length ?? 0;
  }
}

/**
 * Factory function to create an EventHandler instance.
 */
export function createEventHandler(options: EventHandlerOptions): IEventHandler {
  return new EventHandler(options);
}
