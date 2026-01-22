import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventHandler, createEventHandler } from './EventHandler';
import type { DataLayerEvent } from '@/types';
import type { IBrowserAPI } from '@/services/browser';

// Create a mock with vi.fn() methods that also satisfies IBrowserAPI
function createMockBrowserAPI() {
  const mock = {
    runtime: {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(),
    },
    action: {
      onClicked: { addListener: vi.fn() },
    },
  };
  return mock as typeof mock & IBrowserAPI;
}

function createEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    event: 'test_event',
    data: { event: 'test_event' },
    timestamp: Date.now(),
    source: 'dataLayer',
    dataLayerIndex: 0,
    raw: {},
    ...overrides,
  };
}

describe('EventHandler', () => {
  let mockAPI: ReturnType<typeof createMockBrowserAPI>;
  let handler: EventHandler;

  beforeEach(() => {
    mockAPI = createMockBrowserAPI();
    handler = new EventHandler({
      browserAPI: mockAPI,
      maxEventsPerTab: 100,
    });
  });

  describe('addEvent', () => {
    it('adds event to tab storage', () => {
      const event = createEvent({ id: 'e1' });
      handler.addEvent(123, event);

      const events = handler.getEvents(123);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('e1');
    });

    it('adds events at the beginning (newest first)', () => {
      handler.addEvent(123, createEvent({ id: 'e1' }));
      handler.addEvent(123, createEvent({ id: 'e2' }));

      const events = handler.getEvents(123);
      expect(events[0].id).toBe('e2');
      expect(events[1].id).toBe('e1');
    });

    it('limits events per tab to maxEventsPerTab', () => {
      const smallHandler = new EventHandler({
        browserAPI: mockAPI,
        maxEventsPerTab: 3,
      });

      smallHandler.addEvent(123, createEvent({ id: 'e1' }));
      smallHandler.addEvent(123, createEvent({ id: 'e2' }));
      smallHandler.addEvent(123, createEvent({ id: 'e3' }));
      smallHandler.addEvent(123, createEvent({ id: 'e4' }));

      const events = smallHandler.getEvents(123);
      expect(events).toHaveLength(3);
      expect(events.map(e => e.id)).toEqual(['e4', 'e3', 'e2']);
    });

    it('sends EVENT_ADDED message to runtime', () => {
      const event = createEvent({ id: 'e1' });
      handler.addEvent(123, event);

      expect(mockAPI.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'EVENT_ADDED',
        payload: event,
        tabId: 123,
      });
    });

    it('handles sendMessage errors silently', () => {
      mockAPI.runtime.sendMessage.mockRejectedValue(new Error('No listeners'));
      const event = createEvent();

      // Should not throw
      expect(() => handler.addEvent(123, event)).not.toThrow();
    });

    it('maintains separate events per tab', () => {
      handler.addEvent(100, createEvent({ id: 'tab100-e1' }));
      handler.addEvent(200, createEvent({ id: 'tab200-e1' }));
      handler.addEvent(100, createEvent({ id: 'tab100-e2' }));

      expect(handler.getEvents(100).map(e => e.id)).toEqual(['tab100-e2', 'tab100-e1']);
      expect(handler.getEvents(200).map(e => e.id)).toEqual(['tab200-e1']);
    });
  });

  describe('getEvents', () => {
    it('returns empty array for unknown tab', () => {
      expect(handler.getEvents(999)).toEqual([]);
    });

    it('returns all events for tab', () => {
      handler.addEvent(123, createEvent({ id: 'e1' }));
      handler.addEvent(123, createEvent({ id: 'e2' }));

      expect(handler.getEvents(123)).toHaveLength(2);
    });
  });

  describe('clearEvents', () => {
    it('clears events for specific tab', () => {
      handler.addEvent(123, createEvent());
      handler.addEvent(456, createEvent());

      handler.clearEvents(123);

      expect(handler.getEvents(123)).toEqual([]);
      expect(handler.getEvents(456)).toHaveLength(1);
    });

    it('handles clearing non-existent tab', () => {
      expect(() => handler.clearEvents(999)).not.toThrow();
    });
  });

  describe('clearAllEvents', () => {
    it('clears events for all tabs', () => {
      handler.addEvent(100, createEvent());
      handler.addEvent(200, createEvent());
      handler.addEvent(300, createEvent());

      handler.clearAllEvents();

      expect(handler.getEvents(100)).toEqual([]);
      expect(handler.getEvents(200)).toEqual([]);
      expect(handler.getEvents(300)).toEqual([]);
    });
  });

  describe('removeTab', () => {
    it('removes tab from storage', () => {
      handler.addEvent(123, createEvent());
      handler.removeTab(123);

      expect(handler.getEvents(123)).toEqual([]);
    });
  });

  describe('getEventCount', () => {
    it('returns 0 for unknown tab', () => {
      expect(handler.getEventCount(999)).toBe(0);
    });

    it('returns correct count', () => {
      handler.addEvent(123, createEvent());
      handler.addEvent(123, createEvent());
      handler.addEvent(123, createEvent());

      expect(handler.getEventCount(123)).toBe(3);
    });
  });

  describe('default maxEventsPerTab', () => {
    it('uses 1000 as default', () => {
      const defaultHandler = new EventHandler({
        browserAPI: mockAPI,
      });

      // Add 1001 events
      for (let i = 0; i < 1001; i++) {
        defaultHandler.addEvent(123, createEvent({ id: `e${i}` }));
      }

      expect(defaultHandler.getEventCount(123)).toBe(1000);
    });
  });
});

describe('createEventHandler', () => {
  it('creates EventHandler instance', () => {
    const mockAPI = createMockBrowserAPI();
    const handler = createEventHandler({ browserAPI: mockAPI });

    expect(handler).toBeDefined();
    expect(typeof handler.addEvent).toBe('function');
    expect(typeof handler.getEvents).toBe('function');
  });
});
