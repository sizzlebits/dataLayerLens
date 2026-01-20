/**
 * Event filtering utilities for the DataLayer Lens overlay.
 * Handles filtering events based on user-defined filters and search.
 */

import { DataLayerEvent, EventGroup, Settings } from '@/types';

export interface FilterContext {
  settings: Settings;
  currentFilter: string;
  currentPage: number;
  eventsPerPage: number;
}

/**
 * Count how many events match a given filter string.
 */
export function countEventsMatchingFilter(
  events: DataLayerEvent[],
  filter: string
): number {
  const lowerFilter = filter.toLowerCase();
  return events.filter((e) =>
    e.event.toLowerCase().includes(lowerFilter)
  ).length;
}

/**
 * Get all filtered events (no pagination).
 */
export function getAllFilteredEvents(
  events: DataLayerEvent[],
  context: FilterContext
): DataLayerEvent[] {
  const { settings, currentFilter } = context;
  const { eventFilters, filterMode } = settings;

  let filtered = events;

  // Apply saved filters (include/exclude)
  if (eventFilters.length > 0) {
    if (filterMode === 'include') {
      filtered = filtered.filter((e) =>
        eventFilters.some((f) => e.event.toLowerCase().includes(f.toLowerCase()))
      );
    } else {
      filtered = filtered.filter((e) =>
        !eventFilters.some((f) => e.event.toLowerCase().includes(f.toLowerCase()))
      );
    }
  }

  // Apply current search filter
  if (currentFilter) {
    filtered = filtered.filter((e) =>
      e.event.toLowerCase().includes(currentFilter.toLowerCase())
    );
  }

  return filtered;
}

/**
 * Get filtered events with pagination applied.
 */
export function getFilteredEvents(
  events: DataLayerEvent[],
  context: FilterContext
): DataLayerEvent[] {
  const { currentPage, eventsPerPage } = context;
  const allFiltered = getAllFilteredEvents(events, context);
  const start = currentPage * eventsPerPage;
  const end = start + eventsPerPage;
  return allFiltered.slice(start, end);
}

/**
 * Get filtered groups - groups containing only the filtered events.
 */
export function getFilteredGroups(
  events: DataLayerEvent[],
  eventGroups: EventGroup[],
  context: FilterContext
): EventGroup[] {
  const filteredEvents = getFilteredEvents(events, context);
  const filteredEventIds = new Set(filteredEvents.map((e) => e.id));

  return eventGroups
    .map((group) => ({
      ...group,
      events: group.events.filter((e) => filteredEventIds.has(e.id)),
    }))
    .filter((group) => group.events.length > 0);
}

/**
 * Check if an event matches the current filters.
 */
export function eventMatchesFilters(
  event: DataLayerEvent,
  settings: Settings,
  currentFilter: string
): boolean {
  const { eventFilters, filterMode } = settings;

  // Check saved filters
  if (eventFilters.length > 0) {
    const matchesSavedFilter = eventFilters.some((f) =>
      event.event.toLowerCase().includes(f.toLowerCase())
    );

    if (filterMode === 'include' && !matchesSavedFilter) {
      return false;
    }
    if (filterMode === 'exclude' && matchesSavedFilter) {
      return false;
    }
  }

  // Check current search filter
  if (currentFilter) {
    if (!event.event.toLowerCase().includes(currentFilter.toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Get unique event names from a list of events.
 */
export function getUniqueEventNames(events: DataLayerEvent[]): string[] {
  const names = new Set(events.map((e) => e.event));
  return Array.from(names).sort();
}

/**
 * Get suggestions for filter input based on existing events.
 */
export function getFilterSuggestions(
  events: DataLayerEvent[],
  currentFilters: string[],
  searchText: string
): string[] {
  const uniqueNames = getUniqueEventNames(events);
  const lowerSearch = searchText.toLowerCase();

  return uniqueNames
    .filter((name) => {
      // Exclude already added filters
      if (currentFilters.includes(name)) return false;
      // Match search text
      if (searchText && !name.toLowerCase().includes(lowerSearch)) return false;
      return true;
    })
    .slice(0, 10); // Limit suggestions
}
