import { Settings, DEFAULT_SETTINGS, DataLayerEvent } from '@/types';

const SETTINGS_KEY = 'datalayer_monitor_settings';
const EVENTS_KEY = 'datalayer_monitor_events';

// Browser API abstraction for Chrome/Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export async function getSettings(): Promise<Settings> {
  try {
    const result = await browserAPI.storage.local.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await browserAPI.storage.local.set({ [SETTINGS_KEY]: updated });
  return updated;
}

export async function getStoredEvents(tabId?: number): Promise<DataLayerEvent[]> {
  try {
    const key = tabId ? `${EVENTS_KEY}_${tabId}` : EVENTS_KEY;
    const result = await browserAPI.storage.local.get(key);
    return result[key] || [];
  } catch {
    return [];
  }
}

export async function saveEvents(events: DataLayerEvent[], tabId?: number): Promise<void> {
  const key = tabId ? `${EVENTS_KEY}_${tabId}` : EVENTS_KEY;
  await browserAPI.storage.local.set({ [key]: events });
}

export async function clearEvents(tabId?: number): Promise<void> {
  const key = tabId ? `${EVENTS_KEY}_${tabId}` : EVENTS_KEY;
  await browserAPI.storage.local.remove(key);
}

export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[SETTINGS_KEY]) {
      callback(changes[SETTINGS_KEY].newValue as Settings);
    }
  };

  browserAPI.storage.onChanged.addListener(listener);
  return () => browserAPI.storage.onChanged.removeListener(listener);
}
