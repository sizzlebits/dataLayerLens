import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore, StoreOptions } from './createStore';
import { DEFAULT_SETTINGS, DEFAULT_GROUPING, DataLayerEvent } from '@/types';

function createMockBrowserAPI() {
  const storageData: Record<string, unknown> = {};
  const storageListeners: Array<(changes: Record<string, unknown>, areaName: string) => void> = [];
  const messageListeners: Array<(message: unknown) => void> = [];

  return {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storageData[key] })),
        set: vi.fn(async (data: Record<string, unknown>) => {
          Object.assign(storageData, data);
        }),
      },
      onChanged: {
        addListener: vi.fn((listener) => storageListeners.push(listener)),
        removeListener: vi.fn((listener) => {
          const idx = storageListeners.indexOf(listener);
          if (idx !== -1) storageListeners.splice(idx, 1);
        }),
      },
    },
    tabs: {
      query: vi.fn(async () => [{ id: 123 }]),
      sendMessage: vi.fn(async () => ({})),
    },
    runtime: {
      onMessage: {
        addListener: vi.fn((listener) => messageListeners.push(listener)),
        removeListener: vi.fn((listener) => {
          const idx = messageListeners.indexOf(listener);
          if (idx !== -1) messageListeners.splice(idx, 1);
        }),
      },
      sendMessage: vi.fn(async () => ({})),
    },
    // Test helpers
    _storageData: storageData,
    _storageListeners: storageListeners,
    _messageListeners: messageListeners,
    _simulateStorageChange: (changes: Record<string, unknown>, area: string) => {
      storageListeners.forEach((l) => l(changes, area));
    },
    _simulateMessage: (message: unknown) => {
      messageListeners.forEach((l) => l(message));
    },
  };
}

function createEvent(overrides: Partial<DataLayerEvent> = {}): DataLayerEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    event: 'test_event',
    data: { event: 'test_event' },
    timestamp: Date.now(),
    source: 'dataLayer',
    raw: { event: 'test_event' },
    dataLayerIndex: 0,
    ...overrides,
  };
}

describe('createStore', () => {
  let mockAPI: ReturnType<typeof createMockBrowserAPI>;
  let options: StoreOptions;

  beforeEach(() => {
    mockAPI = createMockBrowserAPI();
    options = { browserAPI: mockAPI as unknown as StoreOptions['browserAPI'] };
  });

  describe('store creation', () => {
    it('creates store with default state', () => {
      const { useStore } = createStore(options);

      const state = useStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
      expect(state.events).toEqual([]);
      expect(state.isLoading).toBe(true);
      expect(state.filter).toBe('');
      expect(state.expandedEvents).toEqual(new Set());
    });

    it('returns useStore hook', () => {
      const { useStore } = createStore(options);

      expect(typeof useStore).toBe('function');
      expect(typeof useStore.getState).toBe('function');
      expect(typeof useStore.setState).toBe('function');
    });

    it('returns setup functions', () => {
      const store = createStore(options);

      expect(typeof store.setupStorageListener).toBe('function');
      expect(typeof store.setupMessageListener).toBe('function');
    });
  });

  describe('loadSettings', () => {
    it('loads settings from storage', async () => {
      mockAPI._storageData['datalayer_monitor_settings'] = {
        persistEvents: true,
        maxEvents: 200,
      };

      const { useStore } = createStore(options);
      await useStore.getState().loadSettings();

      const state = useStore.getState();
      expect(state.settings.persistEvents).toBe(true);
      expect(state.settings.maxEvents).toBe(200);
      expect(state.isLoading).toBe(false);
    });

    it('merges with default settings', async () => {
      mockAPI._storageData['datalayer_monitor_settings'] = {
        persistEvents: true,
      };

      const { useStore } = createStore(options);
      await useStore.getState().loadSettings();

      const state = useStore.getState();
      expect(state.settings.persistEvents).toBe(true);
      // Other defaults should be preserved
      expect(state.settings.maxEvents).toBe(DEFAULT_SETTINGS.maxEvents);
    });

    it('merges grouping settings with defaults', async () => {
      mockAPI._storageData['datalayer_monitor_settings'] = {
        grouping: { enabled: true },
      };

      const { useStore } = createStore(options);
      await useStore.getState().loadSettings();

      const state = useStore.getState();
      expect(state.settings.grouping.enabled).toBe(true);
      expect(state.settings.grouping.mode).toBe(DEFAULT_GROUPING.mode);
    });

    it('handles storage error gracefully', async () => {
      mockAPI.storage.local.get = vi.fn().mockRejectedValue(new Error('Storage error'));

      const { useStore } = createStore(options);
      await useStore.getState().loadSettings();

      const state = useStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('uses custom settings key', async () => {
      const customKey = 'custom_settings';
      mockAPI._storageData[customKey] = { persistEvents: true };

      const { useStore } = createStore({ ...options, settingsKey: customKey });
      await useStore.getState().loadSettings();

      expect(mockAPI.storage.local.get).toHaveBeenCalledWith(customKey);
    });
  });

  describe('updateSettings', () => {
    it('updates settings in state', async () => {
      const { useStore } = createStore(options);

      await useStore.getState().updateSettings({ persistEvents: true });

      expect(useStore.getState().settings.persistEvents).toBe(true);
    });

    it('saves settings to storage', async () => {
      const { useStore } = createStore(options);

      await useStore.getState().updateSettings({ maxEvents: 300 });

      expect(mockAPI.storage.local.set).toHaveBeenCalledWith({
        datalayer_monitor_settings: expect.objectContaining({ maxEvents: 300 }),
      });
    });

    it('sends update message to content script', async () => {
      const { useStore } = createStore(options);

      await useStore.getState().updateSettings({ persistEvents: true });

      expect(mockAPI.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'UPDATE_SETTINGS',
        payload: expect.objectContaining({ persistEvents: true }),
      });
    });

    it('handles no active tab gracefully', async () => {
      mockAPI.tabs.query = vi.fn().mockResolvedValue([]);

      const { useStore } = createStore(options);
      await useStore.getState().updateSettings({ persistEvents: true });

      // Should not throw
      expect(mockAPI.tabs.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('loadEvents', () => {
    it('loads events from content script', async () => {
      const events = [createEvent({ id: '1' }), createEvent({ id: '2' })];
      mockAPI.tabs.sendMessage = vi.fn().mockResolvedValue({ events });

      const { useStore } = createStore(options);
      await useStore.getState().loadEvents();

      expect(useStore.getState().events).toEqual(events);
    });

    it('sends GET_EVENTS message', async () => {
      const { useStore } = createStore(options);
      await useStore.getState().loadEvents();

      expect(mockAPI.tabs.sendMessage).toHaveBeenCalledWith(123, { type: 'GET_EVENTS' });
    });

    it('handles no response gracefully', async () => {
      mockAPI.tabs.sendMessage = vi.fn().mockResolvedValue({});

      const { useStore } = createStore(options);
      await useStore.getState().loadEvents();

      expect(useStore.getState().events).toEqual([]);
    });
  });

  describe('clearEvents', () => {
    it('clears events in state', async () => {
      const { useStore } = createStore(options);
      useStore.setState({ events: [createEvent()] });

      await useStore.getState().clearEvents();

      expect(useStore.getState().events).toEqual([]);
    });

    it('sends CLEAR_EVENTS message', async () => {
      const { useStore } = createStore(options);

      await useStore.getState().clearEvents();

      expect(mockAPI.tabs.sendMessage).toHaveBeenCalledWith(123, { type: 'CLEAR_EVENTS' });
    });
  });

  describe('setFilter', () => {
    it('updates filter in state', () => {
      const { useStore } = createStore(options);

      useStore.getState().setFilter('page_view');

      expect(useStore.getState().filter).toBe('page_view');
    });
  });

  describe('toggleEventExpanded', () => {
    it('adds event to expanded set', () => {
      const { useStore } = createStore(options);

      useStore.getState().toggleEventExpanded('event-1');

      expect(useStore.getState().expandedEvents.has('event-1')).toBe(true);
    });

    it('removes event from expanded set on second toggle', () => {
      const { useStore } = createStore(options);
      useStore.getState().toggleEventExpanded('event-1');

      useStore.getState().toggleEventExpanded('event-1');

      expect(useStore.getState().expandedEvents.has('event-1')).toBe(false);
    });

    it('preserves other expanded events', () => {
      const { useStore } = createStore(options);
      useStore.getState().toggleEventExpanded('event-1');
      useStore.getState().toggleEventExpanded('event-2');

      useStore.getState().toggleEventExpanded('event-1');

      expect(useStore.getState().expandedEvents.has('event-1')).toBe(false);
      expect(useStore.getState().expandedEvents.has('event-2')).toBe(true);
    });
  });

  describe('addEvent', () => {
    it('adds event to beginning of list', () => {
      const { useStore } = createStore(options);
      const existing = createEvent({ id: 'old' });
      useStore.setState({ events: [existing] });

      const newEvent = createEvent({ id: 'new' });
      useStore.getState().addEvent(newEvent);

      const events = useStore.getState().events;
      expect(events[0].id).toBe('new');
      expect(events[1].id).toBe('old');
    });

    it('respects maxEvents limit', () => {
      const { useStore } = createStore({ ...options, maxEvents: 3 });
      useStore.setState({
        events: [
          createEvent({ id: '1' }),
          createEvent({ id: '2' }),
          createEvent({ id: '3' }),
        ],
      });

      useStore.getState().addEvent(createEvent({ id: 'new' }));

      const events = useStore.getState().events;
      expect(events).toHaveLength(3);
      expect(events[0].id).toBe('new');
      expect(events.map((e) => e.id)).not.toContain('3');
    });
  });

  describe('setupStorageListener', () => {
    it('adds storage change listener', () => {
      const { setupStorageListener } = createStore(options);

      setupStorageListener();

      expect(mockAPI.storage.onChanged.addListener).toHaveBeenCalled();
    });

    it('updates settings on storage change', () => {
      const { useStore, setupStorageListener } = createStore(options);
      setupStorageListener();

      const newSettings = { ...DEFAULT_SETTINGS, persistEvents: true };
      mockAPI._simulateStorageChange(
        { datalayer_monitor_settings: { newValue: newSettings } },
        'local'
      );

      expect(useStore.getState().settings).toEqual(newSettings);
    });

    it('ignores non-local storage changes', () => {
      const { useStore, setupStorageListener } = createStore(options);
      setupStorageListener();
      const originalSettings = { ...useStore.getState().settings };

      mockAPI._simulateStorageChange(
        { datalayer_monitor_settings: { newValue: { persistEvents: true } } },
        'sync'
      );

      expect(useStore.getState().settings).toEqual(originalSettings);
    });

    it('returns cleanup function', () => {
      const { setupStorageListener } = createStore(options);

      const cleanup = setupStorageListener();
      cleanup();

      expect(mockAPI.storage.onChanged.removeListener).toHaveBeenCalled();
    });
  });

  describe('setupMessageListener', () => {
    it('adds message listener', () => {
      const { setupMessageListener } = createStore(options);

      setupMessageListener();

      expect(mockAPI.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('adds event on EVENT_ADDED message', () => {
      const { useStore, setupMessageListener } = createStore(options);
      setupMessageListener();

      const event = createEvent({ id: 'new-event' });
      mockAPI._simulateMessage({ type: 'EVENT_ADDED', payload: event });

      expect(useStore.getState().events[0].id).toBe('new-event');
    });

    it('adds event on DATALAYER_EVENT message', () => {
      const { useStore, setupMessageListener } = createStore(options);
      setupMessageListener();

      const event = createEvent({ id: 'dl-event' });
      mockAPI._simulateMessage({ type: 'DATALAYER_EVENT', payload: event });

      expect(useStore.getState().events[0].id).toBe('dl-event');
    });

    it('ignores messages without payload', () => {
      const { useStore, setupMessageListener } = createStore(options);
      setupMessageListener();

      mockAPI._simulateMessage({ type: 'EVENT_ADDED' });

      expect(useStore.getState().events).toEqual([]);
    });

    it('returns cleanup function', () => {
      const { setupMessageListener } = createStore(options);

      const cleanup = setupMessageListener();
      cleanup();

      expect(mockAPI.runtime.onMessage.removeListener).toHaveBeenCalled();
    });
  });
});
