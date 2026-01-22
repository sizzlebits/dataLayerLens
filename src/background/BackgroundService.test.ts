import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundService, createBackgroundService } from './BackgroundService';
import { createMockBrowserAPI } from '@/services/browser';
import type { DataLayerEvent, Settings, DomainSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

describe('BackgroundService', () => {
  let mockBrowserAPI: ReturnType<typeof createMockBrowserAPI>;
  let service: BackgroundService;

  beforeEach(() => {
    mockBrowserAPI = createMockBrowserAPI();
    service = new BackgroundService({
      browserAPI: mockBrowserAPI,
      maxEventsPerTab: 100,
    });
  });

  describe('constructor', () => {
    it('creates service with handlers', () => {
      expect(service.getSettingsHandler()).toBeDefined();
      expect(service.getEventHandler()).toBeDefined();
    });
  });

  describe('start/stop', () => {
    it('registers message listener on start', () => {
      service.start();
      expect(mockBrowserAPI.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(mockBrowserAPI.tabs.onRemoved.addListener).toHaveBeenCalled();
    });

    it('removes listeners on stop', () => {
      service.start();
      service.stop();
      expect(mockBrowserAPI.runtime.onMessage.removeListener).toHaveBeenCalled();
      expect(mockBrowserAPI.tabs.onRemoved.removeListener).toHaveBeenCalled();
    });

    it('handles stop when not started', () => {
      // Should not throw
      service.stop();
      expect(mockBrowserAPI.runtime.onMessage.removeListener).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    let messageHandler: (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => boolean | void;
    let sendResponse: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      service.start();
      // Get the registered message handler
      messageHandler = vi.mocked(mockBrowserAPI.runtime.onMessage.addListener).mock.calls[0][0];
      sendResponse = vi.fn();
    });

    const createSender = (tabId?: number, url?: string): chrome.runtime.MessageSender => ({
      tab: tabId ? { id: tabId, url, index: 0, pinned: false, highlighted: false, windowId: 1, active: true, incognito: false, selected: false, discarded: false, autoDiscardable: true, groupId: -1 } : undefined,
    });

    describe('DATALAYER_EVENT', () => {
      it('adds event to handler when tabId and payload present', () => {
        const event: DataLayerEvent = {
          id: '1',
          timestamp: Date.now(),
          event: 'test_event',
          data: { test: true },
          source: 'dataLayer',
          raw: { event: 'test_event', test: true },
          dataLayerIndex: 0,
        };

        messageHandler(
          { type: 'DATALAYER_EVENT', payload: event },
          createSender(1, 'https://example.com'),
          sendResponse
        );

        expect(service.getEventHandler().getEvents(1)).toContainEqual(event);
      });

      it('does not add event when tabId missing', () => {
        const event: DataLayerEvent = {
          id: '1',
          timestamp: Date.now(),
          event: 'test_event',
          data: {},
          source: 'dataLayer',
          raw: {},
          dataLayerIndex: 0,
        };

        messageHandler(
          { type: 'DATALAYER_EVENT', payload: event },
          createSender(),
          sendResponse
        );

        // No exception thrown
      });
    });

    describe('GET_TAB_EVENTS', () => {
      it('returns events for tab', () => {
        const event: DataLayerEvent = {
          id: '1',
          timestamp: Date.now(),
          event: 'test_event',
          data: {},
          source: 'dataLayer',
          raw: {},
          dataLayerIndex: 0,
        };

        service.getEventHandler().addEvent(1, event);

        messageHandler(
          { type: 'GET_TAB_EVENTS' },
          createSender(1),
          sendResponse
        );

        expect(sendResponse).toHaveBeenCalledWith({ events: [event] });
      });

      it('does not respond when tabId missing', () => {
        messageHandler(
          { type: 'GET_TAB_EVENTS' },
          createSender(),
          sendResponse
        );

        expect(sendResponse).not.toHaveBeenCalled();
      });
    });

    describe('CLEAR_TAB_EVENTS', () => {
      it('clears events for tab', () => {
        const event: DataLayerEvent = {
          id: '1',
          timestamp: Date.now(),
          event: 'test_event',
          data: {},
          source: 'dataLayer',
          raw: {},
          dataLayerIndex: 0,
        };

        service.getEventHandler().addEvent(1, event);

        messageHandler(
          { type: 'CLEAR_TAB_EVENTS' },
          createSender(1),
          sendResponse
        );

        expect(sendResponse).toHaveBeenCalledWith({ success: true });
        expect(service.getEventHandler().getEvents(1)).toEqual([]);
      });
    });

    describe('GET_SETTINGS', () => {
      it('returns settings for domain', async () => {
        const result = messageHandler(
          { type: 'GET_SETTINGS', domain: 'example.com' },
          createSender(1, 'https://example.com'),
          sendResponse
        );

        expect(result).toBe(true); // Async response

        // Wait for async handler
        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: expect.any(Object),
            domain: 'example.com',
          })
        );
      });

      it('extracts domain from sender URL when not provided', async () => {
        messageHandler(
          { type: 'GET_SETTINGS' },
          createSender(1, 'https://test.com/page'),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            domain: 'test.com',
          })
        );
      });
    });

    describe('UPDATE_SETTINGS', () => {
      it('saves global settings when saveGlobal is true', async () => {
        const newSettings: Partial<Settings> = { maxEvents: 200 };

        messageHandler(
          { type: 'UPDATE_SETTINGS', payload: newSettings, saveGlobal: true },
          createSender(1, 'https://example.com'),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({ success: true });
      });

      it('saves domain settings when saveGlobal is false', async () => {
        const newSettings: Partial<Settings> = { maxEvents: 200 };

        messageHandler(
          { type: 'UPDATE_SETTINGS', payload: newSettings, saveGlobal: false, domain: 'example.com' },
          createSender(1, 'https://example.com'),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({
          success: true,
          domain: 'example.com',
        });
      });
    });

    describe('GET_DOMAIN_SETTINGS', () => {
      it('returns all domain settings', async () => {
        messageHandler(
          { type: 'GET_DOMAIN_SETTINGS' },
          createSender(1),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({
          domainSettings: expect.any(Object),
        });
      });
    });

    describe('DELETE_DOMAIN_SETTINGS', () => {
      it('deletes domain settings when domain provided', async () => {
        messageHandler(
          { type: 'DELETE_DOMAIN_SETTINGS', domain: 'example.com' },
          createSender(1),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({ success: true });
      });

      it('returns error when domain not provided', async () => {
        messageHandler(
          { type: 'DELETE_DOMAIN_SETTINGS' },
          createSender(1),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'No domain specified',
        });
      });
    });

    describe('EXPORT_ALL_SETTINGS', () => {
      it('exports all settings', async () => {
        messageHandler(
          { type: 'EXPORT_ALL_SETTINGS' },
          createSender(1),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            globalSettings: expect.any(Object),
          })
        );
      });
    });

    describe('IMPORT_ALL_SETTINGS', () => {
      it('imports settings when payload provided', async () => {
        const importData = {
          globalSettings: DEFAULT_SETTINGS,
          domainSettings: {},
        };

        messageHandler(
          { type: 'IMPORT_ALL_SETTINGS', payload: importData },
          createSender(1),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({ success: true });
      });

      it('returns error when payload not provided', async () => {
        messageHandler(
          { type: 'IMPORT_ALL_SETTINGS' },
          createSender(1),
          sendResponse
        );

        await vi.waitFor(() => {
          expect(sendResponse).toHaveBeenCalled();
        });

        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'No settings data provided',
        });
      });
    });

    describe('SETTINGS_UPDATED', () => {
      it('relays settings update to other views', () => {
        const payload = { maxEvents: 200 };

        messageHandler(
          { type: 'SETTINGS_UPDATED', payload },
          createSender(1, 'https://example.com'),
          sendResponse
        );

        expect(mockBrowserAPI.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'SETTINGS_UPDATED',
          payload,
          tabId: 1,
        });
      });

      it('does not relay when tabId missing', () => {
        messageHandler(
          { type: 'SETTINGS_UPDATED', payload: {} },
          createSender(),
          sendResponse
        );

        expect(mockBrowserAPI.runtime.sendMessage).not.toHaveBeenCalled();
      });
    });

    describe('unknown message type', () => {
      it('returns false for unknown message types', () => {
        const result = messageHandler(
          { type: 'UNKNOWN_TYPE' },
          createSender(1),
          sendResponse
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('tab removed handling', () => {
    it('removes tab events when tab is closed', () => {
      service.start();

      const event: DataLayerEvent = {
        id: '1',
        timestamp: Date.now(),
        event: 'test_event',
        data: {},
        source: 'dataLayer',
        raw: {},
        dataLayerIndex: 0,
      };

      service.getEventHandler().addEvent(1, event);
      expect(service.getEventHandler().getEvents(1)).toHaveLength(1);

      // Trigger tab removed
      const tabRemovedHandler = vi.mocked(mockBrowserAPI.tabs.onRemoved.addListener).mock.calls[0][0];
      tabRemovedHandler(1);

      expect(service.getEventHandler().getEvents(1)).toHaveLength(0);
    });
  });

  describe('extractDomain', () => {
    it('handles invalid URLs gracefully', () => {
      service.start();
      const messageHandler = vi.mocked(mockBrowserAPI.runtime.onMessage.addListener).mock.calls[0][0];
      const sendResponse = vi.fn();

      // Create sender with invalid URL
      const sender = {
        tab: {
          id: 1,
          url: 'invalid-url',
          index: 0,
          pinned: false,
          highlighted: false,
          windowId: 1,
          active: true,
          incognito: false,
          selected: false,
          discarded: false,
          autoDiscardable: true,
          groupId: -1
        },
      };

      // Should not throw
      messageHandler(
        { type: 'GET_SETTINGS' },
        sender,
        sendResponse
      );
    });
  });

  describe('createBackgroundService factory', () => {
    it('creates a BackgroundService instance', () => {
      const instance = createBackgroundService({
        browserAPI: mockBrowserAPI,
      });

      expect(instance).toBeInstanceOf(BackgroundService);
      expect(instance.getSettingsHandler()).toBeDefined();
      expect(instance.getEventHandler()).toBeDefined();
    });
  });
});
