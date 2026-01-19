import { useMemo } from 'react';
import { DataLayerEvent, Settings } from '@/types';

interface UseEventFilteringResult {
  filteredEvents: DataLayerEvent[];
  availableEventTypes: string[];
}

/**
 * Hook for filtering events based on search text and event filters.
 * Used by both SidePanel and DevToolsPanel.
 */
export function useEventFiltering(
  events: DataLayerEvent[],
  searchText: string,
  settings: Settings
): UseEventFilteringResult {
  const filteredEvents = useMemo(() => {
    let result = events;

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((event) =>
        event.event.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      );
    }

    // Apply event type filters
    if (settings.eventFilters.length > 0) {
      if (settings.filterMode === 'include') {
        result = result.filter((event) =>
          settings.eventFilters.some((f) => event.event.toLowerCase().includes(f.toLowerCase()))
        );
      } else {
        result = result.filter((event) =>
          !settings.eventFilters.some((f) => event.event.toLowerCase().includes(f.toLowerCase()))
        );
      }
    }

    return result;
  }, [events, searchText, settings.eventFilters, settings.filterMode]);

  // Get unique event types for filter suggestions
  const availableEventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.event));
    return Array.from(types).sort();
  }, [events]);

  return { filteredEvents, availableEventTypes };
}
