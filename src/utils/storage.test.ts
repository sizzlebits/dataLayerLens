import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULT_SETTINGS, DataLayerEvent } from '@/types';

describe('storage utilities', () => {
  // Mock the browser API
  const mockStorage = {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Set up chrome mock before importing storage module
    vi.stubGlobal('chrome', { storage: mockStorage });
    vi.stubGlobal('browser', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getSettings', () => {
    it('returns merged settings from storage', async () => {
      const storedSettings = { maxEvents: 100, theme: 'light' as const };
      mockStorage.local.get.mockResolvedValue({
        datalayer_monitor_settings: storedSettings,
      });

      const { getSettings } = await import('./storage');
      const result = await getSettings();

      expect(result.maxEvents).toBe(100);
      expect(result.theme).toBe('light');
      expect(mockStorage.local.get).toHaveBeenCalledWith('datalayer_monitor_settings');
    });

    it('returns default settings when storage is empty', async () => {
      mockStorage.local.get.mockResolvedValue({});

      const { getSettings } = await import('./storage');
      const result = await getSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('returns default settings on error', async () => {
      mockStorage.local.get.mockRejectedValue(new Error('Storage error'));

      const { getSettings } = await import('./storage');
      const result = await getSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('merges and saves settings to storage', async () => {
      mockStorage.local.get.mockResolvedValue({
        datalayer_monitor_settings: { maxEvents: 50 },
      });
      mockStorage.local.set.mockResolvedValue(undefined);

      const { saveSettings } = await import('./storage');
      const result = await saveSettings({ theme: 'light' });

      expect(result.theme).toBe('light');
      expect(result.maxEvents).toBe(50);
      expect(mockStorage.local.set).toHaveBeenCalled();
    });
  });

  describe('getStoredEvents', () => {
    const mockEvents: DataLayerEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        event: 'page_view',
        data: {},
        source: 'dataLayer',
        raw: {},
        dataLayerIndex: 0,
      },
    ];

    it('returns events from storage', async () => {
      mockStorage.local.get.mockResolvedValue({
        datalayer_monitor_events: mockEvents,
      });

      const { getStoredEvents } = await import('./storage');
      const result = await getStoredEvents();

      expect(result).toEqual(mockEvents);
    });

    it('returns events for specific tab', async () => {
      mockStorage.local.get.mockResolvedValue({
        datalayer_monitor_events_123: mockEvents,
      });

      const { getStoredEvents } = await import('./storage');
      const result = await getStoredEvents(123);

      expect(result).toEqual(mockEvents);
      expect(mockStorage.local.get).toHaveBeenCalledWith('datalayer_monitor_events_123');
    });

    it('returns empty array when no events stored', async () => {
      mockStorage.local.get.mockResolvedValue({});

      const { getStoredEvents } = await import('./storage');
      const result = await getStoredEvents();

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      mockStorage.local.get.mockRejectedValue(new Error('Storage error'));

      const { getStoredEvents } = await import('./storage');
      const result = await getStoredEvents();

      expect(result).toEqual([]);
    });
  });

  describe('saveEvents', () => {
    const mockEvents: DataLayerEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        event: 'page_view',
        data: {},
        source: 'dataLayer',
        raw: {},
        dataLayerIndex: 0,
      },
    ];

    it('saves events to storage', async () => {
      mockStorage.local.set.mockResolvedValue(undefined);

      const { saveEvents } = await import('./storage');
      await saveEvents(mockEvents);

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        datalayer_monitor_events: mockEvents,
      });
    });

    it('saves events for specific tab', async () => {
      mockStorage.local.set.mockResolvedValue(undefined);

      const { saveEvents } = await import('./storage');
      await saveEvents(mockEvents, 456);

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        datalayer_monitor_events_456: mockEvents,
      });
    });
  });

  describe('clearEvents', () => {
    it('removes events from storage', async () => {
      mockStorage.local.remove.mockResolvedValue(undefined);

      const { clearEvents } = await import('./storage');
      await clearEvents();

      expect(mockStorage.local.remove).toHaveBeenCalledWith('datalayer_monitor_events');
    });

    it('removes events for specific tab', async () => {
      mockStorage.local.remove.mockResolvedValue(undefined);

      const { clearEvents } = await import('./storage');
      await clearEvents(789);

      expect(mockStorage.local.remove).toHaveBeenCalledWith('datalayer_monitor_events_789');
    });
  });

  describe('onSettingsChanged', () => {
    it('registers a listener for settings changes', async () => {
      const callback = vi.fn();

      const { onSettingsChanged } = await import('./storage');
      const unsubscribe = onSettingsChanged(callback);

      expect(mockStorage.onChanged.addListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('calls callback when settings change', async () => {
      const callback = vi.fn();
      let capturedListener: (changes: Record<string, { newValue: unknown }>, areaName: string) => void;

      mockStorage.onChanged.addListener.mockImplementation((listener) => {
        capturedListener = listener;
      });

      const { onSettingsChanged } = await import('./storage');
      onSettingsChanged(callback);

      // Simulate settings change
      capturedListener!({
        datalayer_monitor_settings: { newValue: { maxEvents: 200 } },
      }, 'local');

      expect(callback).toHaveBeenCalledWith({ maxEvents: 200 });
    });

    it('does not call callback for non-settings changes', async () => {
      const callback = vi.fn();
      let capturedListener: (changes: Record<string, { newValue: unknown }>, areaName: string) => void;

      mockStorage.onChanged.addListener.mockImplementation((listener) => {
        capturedListener = listener;
      });

      const { onSettingsChanged } = await import('./storage');
      onSettingsChanged(callback);

      // Simulate non-settings change
      capturedListener!({
        some_other_key: { newValue: 'test' },
      }, 'local');

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback for sync storage changes', async () => {
      const callback = vi.fn();
      let capturedListener: (changes: Record<string, { newValue: unknown }>, areaName: string) => void;

      mockStorage.onChanged.addListener.mockImplementation((listener) => {
        capturedListener = listener;
      });

      const { onSettingsChanged } = await import('./storage');
      onSettingsChanged(callback);

      // Simulate sync storage change
      capturedListener!({
        datalayer_monitor_settings: { newValue: { maxEvents: 200 } },
      }, 'sync');

      expect(callback).not.toHaveBeenCalled();
    });

    it('unsubscribe removes the listener', async () => {
      const callback = vi.fn();
      const { onSettingsChanged } = await import('./storage');
      const unsubscribe = onSettingsChanged(callback);

      unsubscribe();

      expect(mockStorage.onChanged.removeListener).toHaveBeenCalled();
    });
  });
});
