/**
 * Tests for the EventFiltering module.
 */

import { describe, it, expect } from 'vitest';
import {
  getAllFilteredEvents,
  getFilteredEvents,
  countEventsMatchingFilter,
  eventMatchesFilters,
  getUniqueEventNames,
  getFilterSuggestions,
  type FilterContext,
} from './EventFiltering';
import { DataLayerEvent, DEFAULT_SETTINGS } from '@/types';

// Helper to create mock events
function createMockEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    event: 'page_view',
    data: { page: '/test' },
    source: 'dataLayer',
    raw: {},
    dataLayerIndex: 0,
    ...overrides,
  };
}

describe('EventFiltering', () => {
  describe('getAllFilteredEvents', () => {
    it('should return all events when no filters applied', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'click' }),
        createMockEvent({ event: 'purchase' }),
      ];

      const context: FilterContext = {
        settings: { ...DEFAULT_SETTINGS, eventFilters: [], filterMode: 'exclude' },
        currentFilter: '',
        currentPage: 0,
        eventsPerPage: 50,
      };

      const result = getAllFilteredEvents(events, context);
      expect(result).toHaveLength(3);
    });

    it('should filter events with include mode', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'click' }),
        createMockEvent({ event: 'purchase' }),
      ];

      const context: FilterContext = {
        settings: { ...DEFAULT_SETTINGS, eventFilters: ['page'], filterMode: 'include' },
        currentFilter: '',
        currentPage: 0,
        eventsPerPage: 50,
      };

      const result = getAllFilteredEvents(events, context);
      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('page_view');
    });

    it('should filter events with exclude mode', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'click' }),
        createMockEvent({ event: 'purchase' }),
      ];

      const context: FilterContext = {
        settings: { ...DEFAULT_SETTINGS, eventFilters: ['click'], filterMode: 'exclude' },
        currentFilter: '',
        currentPage: 0,
        eventsPerPage: 50,
      };

      const result = getAllFilteredEvents(events, context);
      expect(result).toHaveLength(2);
      expect(result.every((e) => e.event !== 'click')).toBe(true);
    });

    it('should apply current search filter', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'click' }),
        createMockEvent({ event: 'purchase' }),
      ];

      const context: FilterContext = {
        settings: { ...DEFAULT_SETTINGS, eventFilters: [], filterMode: 'exclude' },
        currentFilter: 'view',
        currentPage: 0,
        eventsPerPage: 50,
      };

      const result = getAllFilteredEvents(events, context);
      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('page_view');
    });
  });

  describe('getFilteredEvents', () => {
    it('should paginate results', () => {
      const events = Array.from({ length: 100 }, (_, i) =>
        createMockEvent({ event: `event_${i}`, id: `id-${i}` })
      );

      const context: FilterContext = {
        settings: { ...DEFAULT_SETTINGS },
        currentFilter: '',
        currentPage: 0,
        eventsPerPage: 10,
      };

      const result = getFilteredEvents(events, context);
      expect(result).toHaveLength(10);
    });

    it('should return correct page of results', () => {
      const events = Array.from({ length: 100 }, (_, i) =>
        createMockEvent({ event: `event_${i}`, id: `id-${i}` })
      );

      const context: FilterContext = {
        settings: { ...DEFAULT_SETTINGS },
        currentFilter: '',
        currentPage: 2,
        eventsPerPage: 10,
      };

      const result = getFilteredEvents(events, context);
      expect(result[0].event).toBe('event_20');
    });
  });

  describe('countEventsMatchingFilter', () => {
    it('should count matching events', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'page_scroll' }),
        createMockEvent({ event: 'click' }),
      ];

      expect(countEventsMatchingFilter(events, 'page')).toBe(2);
      expect(countEventsMatchingFilter(events, 'click')).toBe(1);
      expect(countEventsMatchingFilter(events, 'nonexistent')).toBe(0);
    });

    it('should be case-insensitive', () => {
      const events = [createMockEvent({ event: 'PageView' })];
      expect(countEventsMatchingFilter(events, 'pageview')).toBe(1);
    });
  });

  describe('eventMatchesFilters', () => {
    it('should return true when no filters', () => {
      const event = createMockEvent({ event: 'page_view' });
      const settings = { ...DEFAULT_SETTINGS, eventFilters: [] };
      expect(eventMatchesFilters(event, settings, '')).toBe(true);
    });

    it('should respect include filter mode', () => {
      const event = createMockEvent({ event: 'page_view' });
      const settings = { ...DEFAULT_SETTINGS, eventFilters: ['click'], filterMode: 'include' as const };
      expect(eventMatchesFilters(event, settings, '')).toBe(false);
    });

    it('should respect current search filter', () => {
      const event = createMockEvent({ event: 'page_view' });
      const settings = { ...DEFAULT_SETTINGS, eventFilters: [] };
      expect(eventMatchesFilters(event, settings, 'view')).toBe(true);
      expect(eventMatchesFilters(event, settings, 'click')).toBe(false);
    });
  });

  describe('getUniqueEventNames', () => {
    it('should return unique event names', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'click' }),
        createMockEvent({ event: 'page_view' }),
      ];

      const result = getUniqueEventNames(events);
      expect(result).toHaveLength(2);
      expect(result).toContain('page_view');
      expect(result).toContain('click');
    });

    it('should return sorted names', () => {
      const events = [
        createMockEvent({ event: 'zebra' }),
        createMockEvent({ event: 'apple' }),
        createMockEvent({ event: 'mango' }),
      ];

      const result = getUniqueEventNames(events);
      expect(result).toEqual(['apple', 'mango', 'zebra']);
    });
  });

  describe('getFilterSuggestions', () => {
    it('should suggest event names matching search', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'page_scroll' }),
        createMockEvent({ event: 'click' }),
      ];

      const result = getFilterSuggestions(events, [], 'page');
      expect(result).toContain('page_view');
      expect(result).toContain('page_scroll');
      expect(result).not.toContain('click');
    });

    it('should exclude already selected filters', () => {
      const events = [
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'click' }),
      ];

      const result = getFilterSuggestions(events, ['page_view'], '');
      expect(result).not.toContain('page_view');
      expect(result).toContain('click');
    });

    it('should limit suggestions to 10', () => {
      const events = Array.from({ length: 20 }, (_, i) =>
        createMockEvent({ event: `event_${i}` })
      );

      const result = getFilterSuggestions(events, [], '');
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});
