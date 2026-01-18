import { create } from 'zustand';
import { DataLayerEvent, Settings, DEFAULT_SETTINGS, DEFAULT_GROUPING } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

interface StoreState {
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

export const useStore = create<StoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  events: [],
  isLoading: true,
  filter: '',
  expandedEvents: new Set(),

  loadSettings: async () => {
    try {
      const result = await browserAPI.storage.local.get('datalayer_monitor_settings');
      const saved = result.datalayer_monitor_settings || {};
      const settings = {
        ...DEFAULT_SETTINGS,
        ...saved,
        grouping: { ...DEFAULT_GROUPING, ...saved.grouping },
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
      await browserAPI.storage.local.set({ datalayer_monitor_settings: updated });

      // Notify content script of settings change
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
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
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await browserAPI.tabs.sendMessage(tab.id, { type: 'GET_EVENTS' });
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
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
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
    set({ events: events.slice(0, 500) }); // Limit to 500 events
  },
}));

// Listen for settings changes
browserAPI.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.datalayer_monitor_settings) {
    useStore.setState({
      settings: changes.datalayer_monitor_settings.newValue as Settings,
    });
  }
});

// Listen for new events from content script
browserAPI.runtime.onMessage.addListener((message) => {
  if (message.type === 'EVENT_ADDED' || message.type === 'DATALAYER_EVENT') {
    useStore.getState().addEvent(message.payload);
  }
});
