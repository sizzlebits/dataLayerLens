import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterEngine, createFilterEngine } from './FilterEngine';
import type { DataLayerEvent } from '@/types';

function createMockEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    event: 'test_event',
    data: { event: 'test_event' },
    source: 'dataLayer',
    raw: { event: 'test_event' },
    ...overrides,
  };
}

describe('FilterEngine', () => {
  let filterEngine: FilterEngine;
  let onFilterChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFilterChangeMock = vi.fn();
    filterEngine = new FilterEngine({
      onFilterChange: onFilterChangeMock,
    });
  });

  describe('default configuration', () => {
    it('has empty event filters by default', () => {
      expect(filterEngine.getConfig().eventFilters).toEqual([]);
    });

    it('has exclude mode by default', () => {
      expect(filterEngine.getConfig().filterMode).toBe('exclude');
    });

    it('has empty search text by default', () => {
      expect(filterEngine.getConfig().searchText).toBe('');
    });
  });

  describe('eventPassesFilter', () => {
    describe('with no filters', () => {
      it('passes all events', () => {
        const event = createMockEvent({ event: 'any_event' });
        expect(filterEngine.eventPassesFilter(event)).toBe(true);
      });
    });

    describe('in exclude mode', () => {
      beforeEach(() => {
        filterEngine.addFilter('gtm.js');
      });

      it('excludes matching events', () => {
        const event = createMockEvent({ event: 'gtm.js' });
        expect(filterEngine.eventPassesFilter(event)).toBe(false);
      });

      it('includes non-matching events', () => {
        const event = createMockEvent({ event: 'page_view' });
        expect(filterEngine.eventPassesFilter(event)).toBe(true);
      });

      it('matches case-insensitively', () => {
        const event = createMockEvent({ event: 'GTM.JS' });
        expect(filterEngine.eventPassesFilter(event)).toBe(false);
      });

      it('matches partial strings', () => {
        const event = createMockEvent({ event: 'gtm.js.init' });
        expect(filterEngine.eventPassesFilter(event)).toBe(false);
      });
    });

    describe('in include mode', () => {
      beforeEach(() => {
        filterEngine.setFilterMode('include');
        filterEngine.addFilter('page_view');
      });

      it('includes matching events', () => {
        const event = createMockEvent({ event: 'page_view' });
        expect(filterEngine.eventPassesFilter(event)).toBe(true);
      });

      it('excludes non-matching events', () => {
        const event = createMockEvent({ event: 'gtm.js' });
        expect(filterEngine.eventPassesFilter(event)).toBe(false);
      });
    });

    describe('with search text', () => {
      beforeEach(() => {
        filterEngine.setSearchText('purchase');
      });

      it('includes events containing search text', () => {
        const event = createMockEvent({ event: 'purchase' });
        expect(filterEngine.eventPassesFilter(event)).toBe(true);
      });

      it('includes events with search text as substring', () => {
        const event = createMockEvent({ event: 'begin_purchase_flow' });
        expect(filterEngine.eventPassesFilter(event)).toBe(true);
      });

      it('excludes events not containing search text', () => {
        const event = createMockEvent({ event: 'page_view' });
        expect(filterEngine.eventPassesFilter(event)).toBe(false);
      });

      it('matches case-insensitively', () => {
        const event = createMockEvent({ event: 'PURCHASE' });
        expect(filterEngine.eventPassesFilter(event)).toBe(true);
      });
    });

    describe('with both event filters and search text', () => {
      it('requires both conditions to pass', () => {
        filterEngine.addFilter('gtm.js');
        filterEngine.setSearchText('page');

        // Excluded by event filter
        expect(filterEngine.eventPassesFilter(createMockEvent({ event: 'gtm.js' }))).toBe(false);

        // Doesn't match search
        expect(filterEngine.eventPassesFilter(createMockEvent({ event: 'purchase' }))).toBe(false);

        // Matches both
        expect(filterEngine.eventPassesFilter(createMockEvent({ event: 'page_view' }))).toBe(true);
      });
    });
  });

  describe('filterEvents', () => {
    it('returns all events when no filters', () => {
      const events = [
        createMockEvent({ event: 'event1' }),
        createMockEvent({ event: 'event2' }),
        createMockEvent({ event: 'event3' }),
      ];

      expect(filterEngine.filterEvents(events)).toHaveLength(3);
    });

    it('filters events in exclude mode', () => {
      filterEngine.addFilter('gtm');

      const events = [
        createMockEvent({ event: 'gtm.js' }),
        createMockEvent({ event: 'gtm.dom' }),
        createMockEvent({ event: 'page_view' }),
      ];

      const filtered = filterEngine.filterEvents(events);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].event).toBe('page_view');
    });

    it('filters events in include mode', () => {
      filterEngine.setFilterMode('include');
      filterEngine.addFilter('page');

      const events = [
        createMockEvent({ event: 'gtm.js' }),
        createMockEvent({ event: 'page_view' }),
        createMockEvent({ event: 'page_scroll' }),
      ];

      const filtered = filterEngine.filterEvents(events);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('addFilter', () => {
    it('adds filter to list', () => {
      filterEngine.addFilter('test');
      expect(filterEngine.getConfig().eventFilters).toContain('test');
    });

    it('does not add duplicate filters', () => {
      filterEngine.addFilter('test');
      filterEngine.addFilter('test');
      expect(filterEngine.getConfig().eventFilters).toEqual(['test']);
    });

    it('notifies on change', () => {
      filterEngine.addFilter('test');
      expect(onFilterChangeMock).toHaveBeenCalled();
    });
  });

  describe('removeFilter', () => {
    it('removes filter from list', () => {
      filterEngine.addFilter('test');
      filterEngine.removeFilter('test');
      expect(filterEngine.getConfig().eventFilters).not.toContain('test');
    });

    it('does nothing if filter not present', () => {
      filterEngine.addFilter('other');
      onFilterChangeMock.mockClear();

      filterEngine.removeFilter('nonexistent');
      expect(onFilterChangeMock).not.toHaveBeenCalled();
    });

    it('notifies on change', () => {
      filterEngine.addFilter('test');
      onFilterChangeMock.mockClear();

      filterEngine.removeFilter('test');
      expect(onFilterChangeMock).toHaveBeenCalled();
    });
  });

  describe('setFilterMode', () => {
    it('changes filter mode', () => {
      filterEngine.setFilterMode('include');
      expect(filterEngine.getConfig().filterMode).toBe('include');
    });

    it('clears filters when switching mode', () => {
      filterEngine.addFilter('test');
      filterEngine.setFilterMode('include');
      expect(filterEngine.getConfig().eventFilters).toEqual([]);
    });

    it('does nothing if mode unchanged', () => {
      filterEngine.addFilter('test');
      onFilterChangeMock.mockClear();

      filterEngine.setFilterMode('exclude');
      expect(onFilterChangeMock).not.toHaveBeenCalled();
      expect(filterEngine.getConfig().eventFilters).toContain('test');
    });
  });

  describe('setSearchText', () => {
    it('sets search text', () => {
      filterEngine.setSearchText('query');
      expect(filterEngine.getConfig().searchText).toBe('query');
    });

    it('notifies on change', () => {
      filterEngine.setSearchText('query');
      expect(onFilterChangeMock).toHaveBeenCalled();
    });
  });

  describe('clearFilters', () => {
    it('clears all filters and search text', () => {
      filterEngine.addFilter('test');
      filterEngine.setSearchText('query');

      filterEngine.clearFilters();

      expect(filterEngine.getConfig().eventFilters).toEqual([]);
      expect(filterEngine.getConfig().searchText).toBe('');
    });

    it('notifies on change', () => {
      onFilterChangeMock.mockClear();
      filterEngine.clearFilters();
      expect(onFilterChangeMock).toHaveBeenCalled();
    });
  });

  describe('hasFilter', () => {
    it('returns true if filter exists', () => {
      filterEngine.addFilter('test');
      expect(filterEngine.hasFilter('test')).toBe(true);
    });

    it('returns false if filter does not exist', () => {
      expect(filterEngine.hasFilter('nonexistent')).toBe(false);
    });
  });

  describe('countMatchingEvents', () => {
    it('counts events matching pattern', () => {
      const events = [
        createMockEvent({ event: 'gtm.js' }),
        createMockEvent({ event: 'gtm.dom' }),
        createMockEvent({ event: 'page_view' }),
      ];

      expect(filterEngine.countMatchingEvents(events, 'gtm')).toBe(2);
    });

    it('matches case-insensitively', () => {
      const events = [
        createMockEvent({ event: 'GTM.JS' }),
        createMockEvent({ event: 'page_view' }),
      ];

      expect(filterEngine.countMatchingEvents(events, 'gtm')).toBe(1);
    });

    it('returns 0 for no matches', () => {
      const events = [createMockEvent({ event: 'page_view' })];
      expect(filterEngine.countMatchingEvents(events, 'purchase')).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('updates configuration partially', () => {
      filterEngine.updateConfig({ searchText: 'test' });

      const config = filterEngine.getConfig();
      expect(config.searchText).toBe('test');
      expect(config.filterMode).toBe('exclude'); // Unchanged
    });

    it('notifies on change', () => {
      filterEngine.updateConfig({ searchText: 'test' });
      expect(onFilterChangeMock).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('returns a copy of configuration', () => {
      const config1 = filterEngine.getConfig();
      const config2 = filterEngine.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('prevents external mutation', () => {
      const config = filterEngine.getConfig();
      config.eventFilters.push('injected');

      expect(filterEngine.getConfig().eventFilters).not.toContain('injected');
    });
  });
});

describe('createFilterEngine', () => {
  it('creates a FilterEngine instance', () => {
    const engine = createFilterEngine();
    expect(engine).toBeInstanceOf(FilterEngine);
  });

  it('accepts initial configuration', () => {
    const engine = createFilterEngine({
      config: {
        eventFilters: ['test'],
        filterMode: 'include',
      },
    });

    const config = engine.getConfig();
    expect(config.eventFilters).toContain('test');
    expect(config.filterMode).toBe('include');
  });
});
