import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventStorage, createEventStorage } from './EventStorage';
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

describe('EventStorage', () => {
  let storage: EventStorage;
  let onEventsChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onEventsChangeMock = vi.fn();
    storage = new EventStorage({
      maxEvents: 100,
      onEventsChange: onEventsChangeMock,
    });
  });

  describe('addEvent', () => {
    it('adds event to beginning of list', () => {
      const event1 = createMockEvent({ id: '1' });
      const event2 = createMockEvent({ id: '2' });

      storage.addEvent(event1);
      storage.addEvent(event2);

      const events = storage.getEvents();
      expect(events[0].id).toBe('2');
      expect(events[1].id).toBe('1');
    });

    it('notifies listeners on add', () => {
      storage.addEvent(createMockEvent());

      expect(onEventsChangeMock).toHaveBeenCalledTimes(1);
      expect(onEventsChangeMock).toHaveBeenCalledWith(expect.any(Array));
    });

    it('respects maxEvents limit', () => {
      const limitedStorage = new EventStorage({ maxEvents: 3 });

      for (let i = 0; i < 5; i++) {
        limitedStorage.addEvent(createMockEvent({ id: `event-${i}` }));
      }

      expect(limitedStorage.getEventCount()).toBe(3);
      // Should have newest events (4, 3, 2), not oldest (0, 1)
      const events = limitedStorage.getEvents();
      expect(events.map((e) => e.id)).toEqual(['event-4', 'event-3', 'event-2']);
    });
  });

  describe('getEvents', () => {
    it('returns empty array when no events', () => {
      expect(storage.getEvents()).toEqual([]);
    });

    it('returns copy of events array', () => {
      storage.addEvent(createMockEvent());

      const events1 = storage.getEvents();
      const events2 = storage.getEvents();

      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });

    it('prevents external mutation', () => {
      storage.addEvent(createMockEvent({ id: 'original' }));

      const events = storage.getEvents();
      events.push(createMockEvent({ id: 'injected' }));

      expect(storage.getEventCount()).toBe(1);
      expect(storage.getEvents()[0].id).toBe('original');
    });
  });

  describe('getEventById', () => {
    it('returns event by ID', () => {
      const event = createMockEvent({ id: 'target' });
      storage.addEvent(createMockEvent({ id: 'other' }));
      storage.addEvent(event);

      expect(storage.getEventById('target')).toEqual(event);
    });

    it('returns undefined for non-existent ID', () => {
      storage.addEvent(createMockEvent({ id: 'exists' }));

      expect(storage.getEventById('missing')).toBeUndefined();
    });
  });

  describe('clearEvents', () => {
    it('removes all events', () => {
      storage.addEvent(createMockEvent());
      storage.addEvent(createMockEvent());

      storage.clearEvents();

      expect(storage.getEventCount()).toBe(0);
      expect(storage.getEvents()).toEqual([]);
    });

    it('notifies listeners on clear', () => {
      storage.addEvent(createMockEvent());
      onEventsChangeMock.mockClear();

      storage.clearEvents();

      expect(onEventsChangeMock).toHaveBeenCalledTimes(1);
      expect(onEventsChangeMock).toHaveBeenCalledWith([]);
    });
  });

  describe('setEvents', () => {
    it('replaces all events', () => {
      storage.addEvent(createMockEvent({ id: 'old' }));

      const newEvents = [
        createMockEvent({ id: 'new-1' }),
        createMockEvent({ id: 'new-2' }),
      ];
      storage.setEvents(newEvents);

      const events = storage.getEvents();
      expect(events).toHaveLength(2);
      expect(events.map((e) => e.id)).toEqual(['new-1', 'new-2']);
    });

    it('respects maxEvents limit', () => {
      const limitedStorage = new EventStorage({ maxEvents: 2 });

      const events = [
        createMockEvent({ id: '1' }),
        createMockEvent({ id: '2' }),
        createMockEvent({ id: '3' }),
      ];
      limitedStorage.setEvents(events);

      expect(limitedStorage.getEventCount()).toBe(2);
    });

    it('notifies listeners on set', () => {
      storage.setEvents([createMockEvent()]);

      expect(onEventsChangeMock).toHaveBeenCalled();
    });
  });

  describe('maxEvents', () => {
    it('getMaxEvents returns current limit', () => {
      expect(storage.getMaxEvents()).toBe(100);
    });

    it('setMaxEvents updates limit', () => {
      storage.setMaxEvents(50);

      expect(storage.getMaxEvents()).toBe(50);
    });

    it('setMaxEvents trims events if needed', () => {
      for (let i = 0; i < 10; i++) {
        storage.addEvent(createMockEvent({ id: `event-${i}` }));
      }
      onEventsChangeMock.mockClear();

      storage.setMaxEvents(5);

      expect(storage.getEventCount()).toBe(5);
      expect(onEventsChangeMock).toHaveBeenCalled();
    });

    it('setMaxEvents does not notify if no trimming needed', () => {
      storage.addEvent(createMockEvent());
      onEventsChangeMock.mockClear();

      storage.setMaxEvents(50);

      expect(onEventsChangeMock).not.toHaveBeenCalled();
    });
  });

  describe('getEventCount', () => {
    it('returns 0 for empty storage', () => {
      expect(storage.getEventCount()).toBe(0);
    });

    it('returns correct count', () => {
      storage.addEvent(createMockEvent());
      storage.addEvent(createMockEvent());
      storage.addEvent(createMockEvent());

      expect(storage.getEventCount()).toBe(3);
    });
  });
});

describe('createEventStorage', () => {
  it('creates an EventStorage instance', () => {
    const storage = createEventStorage({ maxEvents: 50 });

    expect(storage).toBeInstanceOf(EventStorage);
    expect(storage.getMaxEvents()).toBe(50);
  });
});
