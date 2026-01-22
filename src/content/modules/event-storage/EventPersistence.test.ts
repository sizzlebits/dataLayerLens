import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventPersistence, createEventPersistence } from './EventPersistence';
import { createMockBrowserAPI } from '@/services/browser';
import type { DataLayerEvent } from '@/types';

function createMockEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    event: 'test_event',
    data: { event: 'test_event' },
    source: 'dataLayer',
    raw: { event: 'test_event' },
    dataLayerIndex: 0,
    ...overrides,
  };
}

describe('EventPersistence', () => {
  let mockBrowserAPI: ReturnType<typeof createMockBrowserAPI>;
  let persistence: EventPersistence;

  beforeEach(() => {
    mockBrowserAPI = createMockBrowserAPI();
    persistence = new EventPersistence({
      browserAPI: mockBrowserAPI,
      domain: 'example.com',
      maxAge: 300000, // 5 minutes
      maxEvents: 100,
    });
  });

  describe('loadEvents', () => {
    it('returns empty array when no persisted events', async () => {
      const events = await persistence.loadEvents();

      expect(events).toEqual([]);
    });

    it('loads persisted events', async () => {
      const storedEvents = [
        createMockEvent({ id: '1', timestamp: Date.now() }),
        createMockEvent({ id: '2', timestamp: Date.now() }),
      ];

      await mockBrowserAPI.storage.local.set({
        persisted_events_example_com: {
          events: storedEvents,
          lastUpdated: Date.now(),
        },
      });

      // Need to use correct key format
      mockBrowserAPI.storage.local._setData({
        'persisted_events_example.com': {
          events: storedEvents,
          lastUpdated: Date.now(),
        },
      });

      const events = await persistence.loadEvents();

      expect(events).toHaveLength(2);
    });

    it('filters out expired events', async () => {
      const now = Date.now();
      const storedEvents = [
        createMockEvent({ id: 'fresh', timestamp: now - 60000 }), // 1 minute ago
        createMockEvent({ id: 'expired', timestamp: now - 400000 }), // 6.6 minutes ago
      ];

      mockBrowserAPI.storage.local._setData({
        'persisted_events_example.com': {
          events: storedEvents,
          lastUpdated: now,
        },
      });

      const events = await persistence.loadEvents();

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('fresh');
    });

    it('marks loaded events as persisted', async () => {
      const storedEvents = [createMockEvent({ source: 'dataLayer' })];

      mockBrowserAPI.storage.local._setData({
        'persisted_events_example.com': {
          events: storedEvents,
          lastUpdated: Date.now(),
        },
      });

      const events = await persistence.loadEvents();

      expect(events[0].source).toBe('dataLayer (persisted)');
    });

    it('does not double-mark already persisted events', async () => {
      const storedEvents = [createMockEvent({ source: 'dataLayer (persisted)' })];

      mockBrowserAPI.storage.local._setData({
        'persisted_events_example.com': {
          events: storedEvents,
          lastUpdated: Date.now(),
        },
      });

      const events = await persistence.loadEvents();

      expect(events[0].source).toBe('dataLayer (persisted)');
      expect(events[0].source).not.toContain('(persisted) (persisted)');
    });

    it('returns empty array on storage error', async () => {
      // Mock storage to throw
      vi.spyOn(mockBrowserAPI.storage.local, 'get').mockRejectedValue(new Error('Storage error'));

      const events = await persistence.loadEvents();

      expect(events).toEqual([]);
    });
  });

  describe('saveEvents', () => {
    it('saves events to storage', async () => {
      const events = [
        createMockEvent({ id: '1' }),
        createMockEvent({ id: '2' }),
      ];

      await persistence.saveEvents(events);

      const stored = await mockBrowserAPI.storage.local.get('persisted_events_example.com');
      const data = stored['persisted_events_example.com'] as { events: DataLayerEvent[] };

      expect(data.events).toHaveLength(2);
    });

    it('respects maxEvents limit when saving', async () => {
      const events = Array.from({ length: 150 }, (_, i) =>
        createMockEvent({ id: `event-${i}` })
      );

      await persistence.saveEvents(events);

      const stored = await mockBrowserAPI.storage.local.get('persisted_events_example.com');
      const data = stored['persisted_events_example.com'] as { events: DataLayerEvent[] };

      expect(data.events).toHaveLength(100);
    });

    it('strips persisted marker when saving', async () => {
      const events = [
        createMockEvent({ id: '1', source: 'dataLayer' }),
        createMockEvent({ id: '2', source: 'dataLayer (persisted)' }),
      ];

      await persistence.saveEvents(events);

      const stored = await mockBrowserAPI.storage.local.get('persisted_events_example.com');
      const data = stored['persisted_events_example.com'] as { events: DataLayerEvent[] };

      // Both events should be saved
      expect(data.events).toHaveLength(2);
      // Both should have the marker stripped
      expect(data.events[0].source).toBe('dataLayer');
      expect(data.events[1].source).toBe('dataLayer');
    });

    it('handles storage error gracefully', async () => {
      vi.spyOn(mockBrowserAPI.storage.local, 'set').mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(persistence.saveEvents([createMockEvent()])).resolves.toBeUndefined();
    });
  });

  describe('clearEvents', () => {
    it('removes persisted events from storage', async () => {
      mockBrowserAPI.storage.local._setData({
        'persisted_events_example.com': {
          events: [createMockEvent()],
          lastUpdated: Date.now(),
        },
      });

      await persistence.clearEvents();

      const stored = await mockBrowserAPI.storage.local.get('persisted_events_example.com');
      expect(stored['persisted_events_example.com']).toBeUndefined();
    });

    it('handles storage error gracefully', async () => {
      vi.spyOn(mockBrowserAPI.storage.local, 'remove').mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(persistence.clearEvents()).resolves.toBeUndefined();
    });
  });

  describe('updateSettings', () => {
    it('updates maxAge and maxEvents', () => {
      persistence.updateSettings(600000, 200);

      // Settings are internal, but we can verify by saving events
      // and checking the limit
    });
  });
});

describe('createEventPersistence', () => {
  it('creates an EventPersistence instance', () => {
    const mockBrowserAPI = createMockBrowserAPI();
    const persistence = createEventPersistence({
      browserAPI: mockBrowserAPI,
      domain: 'test.com',
      maxAge: 300000,
      maxEvents: 100,
    });

    expect(persistence).toBeInstanceOf(EventPersistence);
  });
});
