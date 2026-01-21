import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventGrouping } from './useEventGrouping';
import { DataLayerEvent, Settings, DEFAULT_SETTINGS } from '@/types';

function createEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    event: 'test_event',
    data: { event: 'test_event' },
    timestamp: Date.now(),
    source: 'dataLayer',
    dataLayerIndex: 0,
    ...overrides,
  };
}

function createSettings(groupingOverrides: Partial<Settings['grouping']> = {}): Settings {
  return {
    ...DEFAULT_SETTINGS,
    grouping: {
      enabled: true,
      mode: 'time',
      timeWindowMs: 1000,
      triggerEvents: [],
      ...groupingOverrides,
    },
  };
}

describe('useEventGrouping', () => {
  describe('disabled grouping', () => {
    it('returns empty array when grouping is disabled', () => {
      const events = [createEvent(), createEvent()];
      const settings = createSettings({ enabled: false });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current).toEqual([]);
    });

    it('returns empty array when events array is empty', () => {
      const settings = createSettings({ enabled: true });

      const { result } = renderHook(() => useEventGrouping([], settings));

      expect(result.current).toEqual([]);
    });
  });

  describe('time-based grouping', () => {
    it('groups events within the time window', () => {
      const baseTime = 1000000;
      const events = [
        createEvent({ id: '3', timestamp: baseTime + 500, dataLayerIndex: 2 }),
        createEvent({ id: '2', timestamp: baseTime + 200, dataLayerIndex: 1 }),
        createEvent({ id: '1', timestamp: baseTime, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({ mode: 'time', timeWindowMs: 1000 });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].events).toHaveLength(3);
    });

    it('creates new group when time gap exceeds window', () => {
      const baseTime = 1000000;
      const events = [
        createEvent({ id: '3', timestamp: baseTime + 3000, dataLayerIndex: 2 }),
        createEvent({ id: '2', timestamp: baseTime + 2500, dataLayerIndex: 1 }),
        createEvent({ id: '1', timestamp: baseTime, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({ mode: 'time', timeWindowMs: 1000 });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current).toHaveLength(2);
      expect(result.current[0].events).toHaveLength(2);
      expect(result.current[1].events).toHaveLength(1);
    });

    it('sets group timestamps correctly', () => {
      const baseTime = 1000000;
      const events = [
        createEvent({ id: '2', timestamp: baseTime + 500, dataLayerIndex: 1 }),
        createEvent({ id: '1', timestamp: baseTime, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({ mode: 'time', timeWindowMs: 1000 });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current[0].startTime).toBe(baseTime);
      expect(result.current[0].endTime).toBe(baseTime + 500);
    });
  });

  describe('event-based grouping', () => {
    it('creates new group on trigger event', () => {
      const baseTime = 1000000;
      const events = [
        createEvent({ id: '4', event: 'page_view', timestamp: baseTime + 300, dataLayerIndex: 3 }),
        createEvent({ id: '3', event: 'click', timestamp: baseTime + 200, dataLayerIndex: 2 }),
        createEvent({ id: '2', event: 'page_view', timestamp: baseTime + 100, dataLayerIndex: 1 }),
        createEvent({ id: '1', event: 'scroll', timestamp: baseTime, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({
        mode: 'event',
        triggerEvents: ['page_view'],
      });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      // 3 groups: first for scroll (non-trigger but starts first), then 2 for page_views
      expect(result.current).toHaveLength(3);
      expect(result.current[0].triggerEvent).toBe('page_view'); // Most recent group
      expect(result.current[1].triggerEvent).toBe('page_view');
      expect(result.current[2].triggerEvent).toBe('scroll'); // First group was scroll (in event mode, all groups get triggerEvent)
    });

    it('matches trigger events case-insensitively', () => {
      const events = [
        createEvent({ id: '2', event: 'PAGE_VIEW', timestamp: 2000, dataLayerIndex: 1 }),
        createEvent({ id: '1', event: 'page_view', timestamp: 1000, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({
        mode: 'event',
        triggerEvents: ['page_view'],
      });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current).toHaveLength(2);
    });

    it('matches partial trigger event names', () => {
      const events = [
        createEvent({ id: '2', event: 'ga4_page_view', timestamp: 2000, dataLayerIndex: 1 }),
        createEvent({ id: '1', event: 'click', timestamp: 1000, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({
        mode: 'event',
        triggerEvents: ['page_view'],
      });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current).toHaveLength(2);
    });
  });

  describe('group properties', () => {
    it('assigns unique group IDs', () => {
      const events = [
        createEvent({ id: 'e2', timestamp: 3000, dataLayerIndex: 1 }),
        createEvent({ id: 'e1', timestamp: 1000, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({ mode: 'time', timeWindowMs: 500 });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current[0].id).toContain('group-');
      expect(result.current[1].id).toContain('group-');
      expect(result.current[0].id).not.toBe(result.current[1].id);
    });

    it('initializes groups as not collapsed', () => {
      const events = [createEvent()];
      const settings = createSettings();

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current[0].collapsed).toBe(false);
    });

    it('maintains newest-first order within groups', () => {
      const events = [
        createEvent({ id: '3', timestamp: 3000, dataLayerIndex: 2 }),
        createEvent({ id: '2', timestamp: 2000, dataLayerIndex: 1 }),
        createEvent({ id: '1', timestamp: 1000, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({ mode: 'time', timeWindowMs: 5000 });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current[0].events[0].id).toBe('3');
      expect(result.current[0].events[1].id).toBe('2');
      expect(result.current[0].events[2].id).toBe('1');
    });

    it('returns newest groups first', () => {
      const events = [
        createEvent({ id: '3', event: 'trigger', timestamp: 3000, dataLayerIndex: 2 }),
        createEvent({ id: '2', event: 'trigger', timestamp: 2000, dataLayerIndex: 1 }),
        createEvent({ id: '1', event: 'trigger', timestamp: 1000, dataLayerIndex: 0 }),
      ];
      const settings = createSettings({
        mode: 'event',
        triggerEvents: ['trigger'],
      });

      const { result } = renderHook(() => useEventGrouping(events, settings));

      expect(result.current[0].events[0].timestamp).toBeGreaterThan(
        result.current[1].events[0].timestamp
      );
    });
  });

  describe('memoization', () => {
    it('returns same reference when inputs unchanged', () => {
      const events = [createEvent()];
      const settings = createSettings();

      const { result, rerender } = renderHook(() => useEventGrouping(events, settings));
      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });

    it('returns new reference when events change', () => {
      const settings = createSettings();
      let events = [createEvent({ id: '1' })];

      const { result, rerender } = renderHook(() => useEventGrouping(events, settings));
      const firstResult = result.current;

      events = [createEvent({ id: '2' })];
      rerender();

      expect(result.current).not.toBe(firstResult);
    });
  });
});
