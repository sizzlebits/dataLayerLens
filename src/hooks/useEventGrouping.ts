import { useMemo } from 'react';
import { DataLayerEvent, EventGroup, Settings } from '@/types';

/**
 * Hook for grouping events based on settings.
 * Supports both time-based and trigger-event-based grouping.
 */
export function useEventGrouping(
  filteredEvents: DataLayerEvent[],
  settings: Settings
): EventGroup[] {
  return useMemo((): EventGroup[] => {
    if (!settings.grouping?.enabled || filteredEvents.length === 0) {
      return [];
    }

    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;
    let lastEventTime = 0;

    // Events are already sorted most recent first, process in reverse to build groups chronologically
    const eventsChronological = [...filteredEvents].reverse();

    for (const event of eventsChronological) {
      const shouldStartNew = (() => {
        if (!currentGroup) return true;

        if (settings.grouping.mode === 'time') {
          return event.timestamp - lastEventTime > settings.grouping.timeWindowMs;
        } else {
          // Event mode - start new group on trigger events
          return settings.grouping.triggerEvents.some(
            (t) => event.event.toLowerCase().includes(t.toLowerCase())
          );
        }
      })();

      if (shouldStartNew) {
        currentGroup = {
          id: `group-${event.id}`,
          events: [event],
          startTime: event.timestamp,
          endTime: event.timestamp,
          triggerEvent: settings.grouping.mode === 'event' ? event.event : undefined,
          collapsed: false,
        };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.events.push(event);
        currentGroup.endTime = event.timestamp;
      }

      lastEventTime = event.timestamp;
    }

    // Reverse events within each group so newest is first, and reverse groups so newest group is first
    groups.forEach((g) => g.events.reverse());
    groups.reverse();

    return groups;
  }, [filteredEvents, settings.grouping]);
}
