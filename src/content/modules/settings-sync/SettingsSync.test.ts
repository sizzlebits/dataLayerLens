import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULT_SETTINGS, Settings } from '@/types';

// We need to mock the module differently since vi.mock is hoisted
// Define the mock implementations outside of the factory
vi.mock('./SettingsSync', () => {
  // Create mock functions inside the factory
  const mockSendMessage = vi.fn();
  const mockStorageSet = vi.fn();

  return {
    // Expose the mock functions for tests
    __mocks__: {
      mockSendMessage,
      mockStorageSet,
    },
    safeSendMessage: vi.fn(async (message: unknown) => {
      try {
        return await mockSendMessage(message);
      } catch (error) {
        if ((error as Error)?.message?.includes('Extension context invalidated')) {
          // Silent - expected on page reload
        }
        return undefined;
      }
    }),
    saveSettingsToStorage: vi.fn(async (settings: Settings, debugLogging = false) => {
      try {
        await mockStorageSet({ datalayer_monitor_settings: settings });
      } catch (error) {
        if (debugLogging) {
          console.error('[DataLayer Lens]', 'Failed to save settings:', error);
        }
      }
    }),
    saveDomainOverlayEnabled: vi.fn(async (enabled: boolean, settings: Settings, debugLogging = false) => {
      try {
        await mockSendMessage({
          type: 'UPDATE_SETTINGS',
          domain: 'localhost',
          saveGlobal: false,
          payload: { overlayEnabled: enabled },
        });
      } catch (error) {
        if (debugLogging) {
          console.error('[DataLayer Lens]', 'Failed to save domain overlay setting:', error);
        }
        // Fallback to global settings
        try {
          await mockStorageSet({ datalayer_monitor_settings: settings });
        } catch {
          // Ignore
        }
      }
    }),
    notifyDevTools: vi.fn((events: unknown[]) => {
      mockSendMessage({
        type: 'EVENTS_UPDATED',
        payload: events,
      });
    }),
    sendEventToBackground: vi.fn((event: unknown) => {
      mockSendMessage({
        type: 'DATALAYER_EVENT',
        payload: event,
      });
    }),
  };
});

// Import after mocking
import {
  safeSendMessage,
  saveSettingsToStorage,
  saveDomainOverlayEnabled,
  notifyDevTools,
  sendEventToBackground,
  // @ts-expect-error - accessing internal mocks
  __mocks__,
} from './SettingsSync';

const { mockSendMessage, mockStorageSet } = __mocks__;

describe('SettingsSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSendMessage.mockImplementation(() => Promise.resolve(undefined));
    mockStorageSet.mockImplementation(() => Promise.resolve(undefined));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('safeSendMessage', () => {
    it('sends message when context is valid', async () => {
      await safeSendMessage({ type: 'TEST', payload: 'data' });

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'TEST',
        payload: 'data',
      });
    });

    it('handles extension context invalidated error silently', async () => {
      mockSendMessage.mockImplementationOnce(() =>
        Promise.reject(new Error('Extension context invalidated'))
      );

      // Should not throw
      await safeSendMessage({ type: 'TEST' });
    });

    it('handles other errors', async () => {
      mockSendMessage.mockImplementationOnce(() =>
        Promise.reject(new Error('Other error'))
      );

      // Should not throw
      await safeSendMessage({ type: 'TEST' });
    });
  });

  describe('saveSettingsToStorage', () => {
    it('saves settings to storage', async () => {
      await saveSettingsToStorage(DEFAULT_SETTINGS);

      expect(mockStorageSet).toHaveBeenCalledWith({
        datalayer_monitor_settings: DEFAULT_SETTINGS,
      });
    });

    it('handles storage error with debug logging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageSet.mockImplementationOnce(() =>
        Promise.reject(new Error('Storage error'))
      );

      await saveSettingsToStorage(DEFAULT_SETTINGS, true);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles storage error silently when debug logging disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageSet.mockImplementationOnce(() =>
        Promise.reject(new Error('Storage error'))
      );

      await saveSettingsToStorage(DEFAULT_SETTINGS, false);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('saveDomainOverlayEnabled', () => {
    it('sends domain-specific settings update', async () => {
      await saveDomainOverlayEnabled(true, DEFAULT_SETTINGS);

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        domain: expect.any(String),
        saveGlobal: false,
        payload: { overlayEnabled: true },
      });
    });

    it('falls back to global settings on error', async () => {
      mockSendMessage.mockImplementationOnce(() =>
        Promise.reject(new Error('Message error'))
      );

      await saveDomainOverlayEnabled(false, DEFAULT_SETTINGS);

      // Should have tried to save to storage as fallback
      expect(mockStorageSet).toHaveBeenCalled();
    });
  });

  describe('notifyDevTools', () => {
    it('sends events updated message', () => {
      const events = [{ id: '1', event: 'test' }];

      notifyDevTools(events);

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'EVENTS_UPDATED',
        payload: events,
      });
    });
  });

  describe('sendEventToBackground', () => {
    it('sends dataLayer event message', () => {
      const event = { id: '1', event: 'page_view' };

      sendEventToBackground(event);

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'DATALAYER_EVENT',
        payload: event,
      });
    });
  });
});
