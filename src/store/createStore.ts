/**
 * Store factory with dependency injection for testability.
 * Creates a Zustand store instance that can be configured with custom browser API.
 */

import { create, StateCreator } from 'zustand';
import type { IBrowserAPI } from '@/services/browser';
import { DataLayerEvent, Settings, DEFAULT_SETTINGS, DEFAULT_GROUPING } from '@/types';

export interface StoreState {
  settings: Settings;
  events: DataLayerEvent[];
  isLoading: boolean;
  filter: string;
  expandedEvents: Set<string>;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  loadEvents: () => Promise<void>;
  clearEvents: () => Promise<void>;
  setFilter: (filter: string) => void;
  toggleEventExpanded: (eventId: string) => void;
  addEvent: (event: DataLayerEvent) => void;
}

export interface StoreOptions {
  /** Browser API instance for storage and messaging */
  browserAPI: IBrowserAPI;
  /** Maximum events to store (default: 500) */
  maxEvents?: number;
  /** Storage key for settings */
  settingsKey?: string;
}

const DEFAULT_SETTINGS_KEY = 'datalayer_monitor_settings';
const DEFAULT_MAX_EVENTS = 500;

/**
 * Create a store state creator with injected dependencies.
 */
function createStoreSlice(options: StoreOptions): StateCreator<StoreState> {
  const {
    browserAPI,
    maxEvents = DEFAULT_MAX_EVENTS,
    settingsKey = DEFAULT_SETTINGS_KEY,
  } = options;

  return (set, get) => ({
    settings: DEFAULT_SETTINGS,
    events: [],
    isLoading: true,
    filter: '',
    expandedEvents: new Set(),

    loadSettings: async () => {
      try {
        const result = await browserAPI.storage.local.get(settingsKey);
        const saved = (result[settingsKey] || {}) as Partial<Settings>;
        const settings: Settings = {
          ...DEFAULT_SETTINGS,
          ...saved,
          grouping: { ...DEFAULT_GROUPING, ...(saved.grouping || {}) },
        };
        set({ settings, isLoading: false });
      } catch (error) {
        console.error('Failed to load settings:', error);
        set({ isLoading: false });
      }
    },

    updateSettings: async (newSettings) => {
      const current = get().settings;
      const updated = { ...current, ...newSettings };
      set({ settings: updated });

      try {
        await browserAPI.storage.local.set({ [settingsKey]: updated });

        // Notify content script of settings change
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (tab?.id) {
          browserAPI.tabs.sendMessage(tab.id, {
            type: 'UPDATE_SETTINGS',
            payload: updated,
          }).catch(() => {
            // Content script may not be loaded
          });
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },

    loadEvents: async () => {
      try {
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (tab?.id) {
          const response = await browserAPI.tabs.sendMessage<{ events?: DataLayerEvent[] }>(tab.id, { type: 'GET_EVENTS' });
          if (response?.events) {
            set({ events: response.events });
          }
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    },

    clearEvents: async () => {
      try {
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        if (tab?.id) {
          await browserAPI.tabs.sendMessage(tab.id, { type: 'CLEAR_EVENTS' });
          set({ events: [] });
        }
      } catch (error) {
        console.error('Failed to clear events:', error);
      }
    },

    setFilter: (filter) => {
      set({ filter });
    },

    toggleEventExpanded: (eventId) => {
      const expanded = new Set(get().expandedEvents);
      if (expanded.has(eventId)) {
        expanded.delete(eventId);
      } else {
        expanded.add(eventId);
      }
      set({ expandedEvents: expanded });
    },

    addEvent: (event) => {
      const events = [event, ...get().events];
      set({ events: events.slice(0, maxEvents) });
    },
  });
}

/**
 * Create a store instance with the given options.
 * Returns the store hook and methods to set up listeners.
 */
export function createStore(options: StoreOptions) {
  const store = create<StoreState>(createStoreSlice(options));

  /**
   * Set up storage change listener.
   * Call this once when initializing the store.
   */
  const setupStorageListener = (settingsKey = DEFAULT_SETTINGS_KEY) => {
    const listener = (changes: { [key: string]: { oldValue?: unknown; newValue?: unknown } }, areaName: string) => {
      if (areaName === 'local' && changes[settingsKey]) {
        store.setState({
          settings: changes[settingsKey].newValue as Settings,
        });
      }
    };

    options.browserAPI.storage.onChanged.addListener(listener);

    // Return cleanup function
    return () => {
      options.browserAPI.storage.onChanged.removeListener(listener);
    };
  };

  /**
   * Set up message listener for new events.
   * Call this once when initializing the store.
   */
  const setupMessageListener = () => {
    const listener = (message: unknown) => {
      const msg = message as { type: string; payload?: DataLayerEvent };
      if ((msg.type === 'EVENT_ADDED' || msg.type === 'DATALAYER_EVENT') && msg.payload) {
        store.getState().addEvent(msg.payload);
      }
    };

    options.browserAPI.runtime.onMessage.addListener(listener);

    // Return cleanup function
    return () => {
      options.browserAPI.runtime.onMessage.removeListener(listener);
    };
  };

  return {
    useStore: store,
    setupStorageListener,
    setupMessageListener,
  };
}

export type { StoreState as Store };
