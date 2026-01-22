import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataLayerEvent, EventGroup } from '@/types';
import { DEFAULT_GROUPING } from '@/types';

// Mock the sub-modules before importing EventManager
vi.mock('../modules/event-storage/EventStorage', () => ({
  createEventStorage: vi.fn(),
}));

vi.mock('../modules/event-storage/EventGrouping', () => ({
  createEventGrouping: vi.fn(),
}));

vi.mock('../modules/event-storage/EventPersistence', () => ({
  createEventPersistence: vi.fn(),
}));

vi.mock('@/services/browser', () => ({
  chromeBrowserAPI: {
    storage: { local: { get: vi.fn(), set: vi.fn() } },
    runtime: { sendMessage: vi.fn() },
  },
}));

import { EventManager, type EventManagerOptions } from './EventManager';
import { createEventStorage } from '../modules/event-storage/EventStorage';
import { createEventGrouping } from '../modules/event-storage/EventGrouping';
import { createEventPersistence } from '../modules/event-storage/EventPersistence';

function createMockEvent(overrides?: Partial<DataLayerEvent>): DataLayerEvent {
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

function createMockStorage() {
  const events: DataLayerEvent[] = [];
  let maxEvents = 500;

  return {
    addEvent: vi.fn((event: DataLayerEvent) => events.push(event)),
    getEvents: vi.fn(() => [...events]),
    getEventById: vi.fn((id: string) => events.find(e => e.id === id)),
    clearEvents: vi.fn(() => events.length = 0),
    setEvents: vi.fn((newEvents: DataLayerEvent[]) => {
      events.length = 0;
      events.push(...newEvents);
    }),
    setMaxEvents: vi.fn((max: number) => maxEvents = max),
    getMaxEvents: vi.fn(() => maxEvents),
    getEventCount: vi.fn(() => events.length),
    _events: events,
  };
}

function createMockGrouping() {
  const groups: EventGroup[] = [];
  const collapsedGroups = new Set<string>();
  let settings = { ...DEFAULT_GROUPING };

  return {
    addEventToGroup: vi.fn(),
    getGroups: vi.fn(() => [...groups]),
    clearGroups: vi.fn(() => groups.length = 0),
    rebuildGroups: vi.fn(),
    toggleGroupCollapsed: vi.fn((id: string) => {
      if (collapsedGroups.has(id)) {
        collapsedGroups.delete(id);
      } else {
        collapsedGroups.add(id);
      }
    }),
    isGroupCollapsed: vi.fn((id: string) => collapsedGroups.has(id)),
    updateSettings: vi.fn((newSettings) => {
      settings = { ...settings, ...newSettings };
    }),
    getSettings: vi.fn(() => settings),
    _groups: groups,
    _collapsedGroups: collapsedGroups,
  };
}

function createMockPersistence() {
  let savedEvents: DataLayerEvent[] = [];

  return {
    loadEvents: vi.fn(async () => [...savedEvents]),
    saveEvents: vi.fn(async (events: DataLayerEvent[]) => {
      savedEvents = [...events];
    }),
    clearEvents: vi.fn(async () => {
      savedEvents = [];
    }),
    updateSettings: vi.fn(),
    updateDebugLogging: vi.fn(),
    _savedEvents: savedEvents,
    _setSavedEvents: (events: DataLayerEvent[]) => {
      savedEvents = events;
    },
  };
}

describe('EventManager', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockGrouping: ReturnType<typeof createMockGrouping>;
  let mockPersistence: ReturnType<typeof createMockPersistence>;
  let onEventsChange: ReturnType<typeof vi.fn>;
  let onGroupsChange: ReturnType<typeof vi.fn>;
  let eventManager: EventManager;
  let defaultOptions: EventManagerOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStorage = createMockStorage();
    mockGrouping = createMockGrouping();
    mockPersistence = createMockPersistence();
    onEventsChange = vi.fn();
    onGroupsChange = vi.fn();

    vi.mocked(createEventStorage).mockReturnValue(mockStorage);
    vi.mocked(createEventGrouping).mockReturnValue(mockGrouping);
    vi.mocked(createEventPersistence).mockReturnValue(mockPersistence);

    defaultOptions = {
      maxEvents: 500,
      persistEvents: false,
      persistEventsMaxAge: 300000,
      grouping: DEFAULT_GROUPING,
      debugLogging: false,
      onEventsChange,
      onGroupsChange,
    };

    eventManager = new EventManager(defaultOptions);
  });

  describe('initialization', () => {
    it('creates storage with correct options', () => {
      expect(createEventStorage).toHaveBeenCalledWith({
        maxEvents: 500,
        onEventsChange: expect.any(Function),
      });
    });

    it('creates grouping with correct options', () => {
      expect(createEventGrouping).toHaveBeenCalledWith({
        settings: DEFAULT_GROUPING,
        onGroupsChange,
      });
    });

    it('creates persistence with correct options', () => {
      expect(createEventPersistence).toHaveBeenCalledWith({
        browserAPI: expect.any(Object),
        domain: expect.any(String),
        maxAge: 300000,
        maxEvents: 500,
        debugLogging: false,
      });
    });
  });

  describe('addEvent', () => {
    it('adds event to storage and grouping', () => {
      const event = createMockEvent({ id: 'test-1' });

      eventManager.addEvent(event);

      expect(mockStorage.addEvent).toHaveBeenCalledWith(event);
      expect(mockGrouping.addEventToGroup).toHaveBeenCalledWith(event);
    });

    it('saves to persistence when enabled', async () => {
      // Create manager with persistence enabled
      const persistManager = new EventManager({
        ...defaultOptions,
        persistEvents: true,
      });

      const event = createMockEvent();
      persistManager.addEvent(event);

      // Need to wait for async save
      await vi.waitFor(() => {
        expect(mockPersistence.saveEvents).toHaveBeenCalled();
      });
    });

    it('does not save to persistence when disabled', () => {
      const event = createMockEvent();
      eventManager.addEvent(event);

      expect(mockPersistence.saveEvents).not.toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('returns events from storage', () => {
      const events = [createMockEvent({ id: 'e1' }), createMockEvent({ id: 'e2' })];
      mockStorage._events.push(...events);

      const result = eventManager.getEvents();

      expect(result).toEqual(events);
    });
  });

  describe('getEventById', () => {
    it('returns event from storage by ID', () => {
      const event = createMockEvent({ id: 'find-me' });
      mockStorage._events.push(event);

      const result = eventManager.getEventById('find-me');

      expect(mockStorage.getEventById).toHaveBeenCalledWith('find-me');
    });
  });

  describe('getGroups', () => {
    it('returns groups from grouping module', () => {
      const groups: EventGroup[] = [
        { id: 'g1', events: [], startTime: 0, endTime: 0, collapsed: false },
      ];
      mockGrouping._groups.push(...groups);

      const result = eventManager.getGroups();

      expect(result).toEqual(groups);
    });
  });

  describe('clearEvents', () => {
    it('clears storage, grouping, and persistence', async () => {
      await eventManager.clearEvents();

      expect(mockStorage.clearEvents).toHaveBeenCalled();
      expect(mockGrouping.clearGroups).toHaveBeenCalled();
      expect(mockPersistence.clearEvents).toHaveBeenCalled();
    });
  });

  describe('loadPersistedEvents', () => {
    it('loads events when persistence is enabled', async () => {
      const persistManager = new EventManager({
        ...defaultOptions,
        persistEvents: true,
      });

      const events = [createMockEvent({ id: 'p1' })];
      mockPersistence._setSavedEvents(events);

      await persistManager.loadPersistedEvents();

      expect(mockPersistence.loadEvents).toHaveBeenCalled();
      expect(mockStorage.setEvents).toHaveBeenCalledWith(events);
    });

    it('skips loading when persistence is disabled', async () => {
      await eventManager.loadPersistedEvents();

      expect(mockPersistence.loadEvents).not.toHaveBeenCalled();
    });

    it('rebuilds groups if grouping is enabled', async () => {
      mockGrouping.getSettings.mockReturnValue({ ...DEFAULT_GROUPING, enabled: true });

      const persistManager = new EventManager({
        ...defaultOptions,
        persistEvents: true,
        grouping: { ...DEFAULT_GROUPING, enabled: true },
      });

      const events = [createMockEvent({ id: 'p1' })];
      mockPersistence._setSavedEvents(events);

      await persistManager.loadPersistedEvents();

      expect(mockGrouping.rebuildGroups).toHaveBeenCalledWith(events);
    });
  });

  describe('savePersistedEvents', () => {
    it('saves events when persistence is enabled', async () => {
      const persistManager = new EventManager({
        ...defaultOptions,
        persistEvents: true,
      });

      const events = [createMockEvent()];
      mockStorage._events.push(...events);

      await persistManager.savePersistedEvents();

      expect(mockPersistence.saveEvents).toHaveBeenCalledWith(events);
    });

    it('skips saving when persistence is disabled', async () => {
      await eventManager.savePersistedEvents();

      expect(mockPersistence.saveEvents).not.toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('updates max events', () => {
      eventManager.updateSettings({ maxEvents: 200 });

      expect(mockStorage.setMaxEvents).toHaveBeenCalledWith(200);
    });

    it('updates persistence enabled', () => {
      eventManager.updateSettings({ persistEvents: true });

      // After enabling, adding an event should trigger save
      const event = createMockEvent();
      eventManager.addEvent(event);

      expect(mockPersistence.saveEvents).toHaveBeenCalled();
    });

    it('updates grouping settings', () => {
      eventManager.updateSettings({
        grouping: { ...DEFAULT_GROUPING, enabled: true },
      });

      expect(mockGrouping.updateSettings).toHaveBeenCalledWith({
        ...DEFAULT_GROUPING,
        enabled: true,
      });
    });

    it('updates debug logging', () => {
      eventManager.updateSettings({ debugLogging: true });

      expect(mockPersistence.updateDebugLogging).toHaveBeenCalledWith(true);
    });
  });

  describe('rebuildGroups', () => {
    it('rebuilds groups with current events', () => {
      const events = [createMockEvent()];
      mockStorage._events.push(...events);

      eventManager.rebuildGroups();

      expect(mockGrouping.rebuildGroups).toHaveBeenCalledWith(events);
    });
  });

  describe('group collapse state', () => {
    it('toggles group collapsed state', () => {
      eventManager.toggleGroupCollapsed('group-1');

      expect(mockGrouping.toggleGroupCollapsed).toHaveBeenCalledWith('group-1');
    });

    it('checks if group is collapsed', () => {
      mockGrouping._collapsedGroups.add('group-1');

      const result = eventManager.isGroupCollapsed('group-1');

      expect(result).toBe(true);
    });
  });

  describe('event expansion state', () => {
    it('toggles event expanded state', () => {
      eventManager.toggleEventExpanded('event-1');

      expect(eventManager.isEventExpanded('event-1')).toBe(true);

      eventManager.toggleEventExpanded('event-1');

      expect(eventManager.isEventExpanded('event-1')).toBe(false);
    });

    it('returns expanded event IDs as a new set', () => {
      eventManager.toggleEventExpanded('event-1');
      eventManager.toggleEventExpanded('event-2');

      const ids = eventManager.getExpandedEventIds();

      expect(ids.has('event-1')).toBe(true);
      expect(ids.has('event-2')).toBe(true);
      expect(ids.size).toBe(2);
    });
  });

  describe('getEventCount', () => {
    it('returns count from storage', () => {
      mockStorage._events.push(createMockEvent(), createMockEvent());

      const count = eventManager.getEventCount();

      expect(mockStorage.getEventCount).toHaveBeenCalled();
    });
  });
});
