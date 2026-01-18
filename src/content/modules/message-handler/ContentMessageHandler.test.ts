import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentMessageHandler, createContentMessageHandler } from './ContentMessageHandler';
import { createMockBrowserAPI } from '@/services/browser';
import type { DataLayerEvent, Settings } from '@/types';

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

const mockSettings: Settings = {
  overlayEnabled: false,
  overlayCollapsed: false,
  overlayPosition: { x: -1, y: -1 },
  overlayHeight: 400,
  overlayAnchor: { vertical: 'bottom', horizontal: 'right' },
  maxEvents: 500,
  dataLayerNames: ['dataLayer'],
  eventFilters: [],
  filterMode: 'exclude',
  grouping: {
    enabled: false,
    mode: 'time',
    timeWindowMs: 500,
    triggerEvents: ['gtm.js', 'page_view'],
  },
  persistEvents: false,
  persistEventsMaxAge: 300000,
  theme: 'dark',
  animationsEnabled: true,
  showTimestamps: true,
  compactMode: false,
  debugLogging: false,
  consoleLogging: false,
};

describe('ContentMessageHandler', () => {
  let mockBrowserAPI: ReturnType<typeof createMockBrowserAPI>;
  let handler: ContentMessageHandler;
  let callbacks: {
    onGetEvents: ReturnType<typeof vi.fn>;
    onClearEvents: ReturnType<typeof vi.fn>;
    onToggleOverlay: ReturnType<typeof vi.fn>;
    onUpdateSettings: ReturnType<typeof vi.fn>;
    onGetSettings: ReturnType<typeof vi.fn>;
    onGetOverlayState: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockBrowserAPI = createMockBrowserAPI();
    callbacks = {
      onGetEvents: vi.fn().mockReturnValue([]),
      onClearEvents: vi.fn(),
      onToggleOverlay: vi.fn().mockReturnValue(true),
      onUpdateSettings: vi.fn(),
      onGetSettings: vi.fn().mockReturnValue(mockSettings),
      onGetOverlayState: vi.fn().mockReturnValue(false),
    };

    handler = new ContentMessageHandler({
      browserAPI: mockBrowserAPI,
      callbacks,
    });
  });

  afterEach(() => {
    handler.stop();
  });

  describe('start', () => {
    it('adds message listener', () => {
      handler.start();
      expect(mockBrowserAPI.runtime._getListeners()).toHaveLength(1);
    });

    it('only adds listener once', () => {
      handler.start();
      handler.start();
      expect(mockBrowserAPI.runtime._getListeners()).toHaveLength(1);
    });
  });

  describe('stop', () => {
    it('removes message listener', () => {
      handler.start();
      handler.stop();
      expect(mockBrowserAPI.runtime._getListeners()).toHaveLength(0);
    });
  });

  describe('message handling', () => {
    let sendResponseMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      sendResponseMock = vi.fn();
      handler.start();
    });

    function simulateMessage(type: string, payload?: unknown): void {
      mockBrowserAPI.runtime._simulateMessage(
        { type, payload },
        {},
        sendResponseMock
      );
    }

    describe('GET_EVENTS', () => {
      it('returns events from callback', () => {
        const mockEvents = [createMockEvent(), createMockEvent()];
        callbacks.onGetEvents.mockReturnValue(mockEvents);

        simulateMessage('GET_EVENTS');

        expect(callbacks.onGetEvents).toHaveBeenCalled();
        expect(sendResponseMock).toHaveBeenCalledWith({ events: mockEvents });
      });
    });

    describe('CLEAR_EVENTS', () => {
      it('calls clear callback and returns success', () => {
        simulateMessage('CLEAR_EVENTS');

        expect(callbacks.onClearEvents).toHaveBeenCalled();
        expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
      });
    });

    describe('TOGGLE_OVERLAY', () => {
      it('calls toggle callback without payload', () => {
        simulateMessage('TOGGLE_OVERLAY');

        expect(callbacks.onToggleOverlay).toHaveBeenCalledWith(undefined);
        expect(sendResponseMock).toHaveBeenCalledWith({ enabled: true });
      });

      it('calls toggle callback with enabled value', () => {
        callbacks.onToggleOverlay.mockReturnValue(false);

        simulateMessage('TOGGLE_OVERLAY', { enabled: false });

        expect(callbacks.onToggleOverlay).toHaveBeenCalledWith(false);
        expect(sendResponseMock).toHaveBeenCalledWith({ enabled: false });
      });
    });

    describe('UPDATE_SETTINGS', () => {
      it('calls update settings callback with payload', () => {
        const settingsUpdate = { maxEvents: 1000, theme: 'light' as const };

        simulateMessage('UPDATE_SETTINGS', settingsUpdate);

        expect(callbacks.onUpdateSettings).toHaveBeenCalledWith(settingsUpdate);
        expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
      });
    });

    describe('GET_SETTINGS', () => {
      it('returns settings from callback', () => {
        simulateMessage('GET_SETTINGS');

        expect(callbacks.onGetSettings).toHaveBeenCalled();
        expect(sendResponseMock).toHaveBeenCalledWith({ settings: mockSettings });
      });
    });

    describe('GET_OVERLAY_STATE', () => {
      it('returns overlay state from callback', () => {
        callbacks.onGetOverlayState.mockReturnValue(true);

        simulateMessage('GET_OVERLAY_STATE');

        expect(callbacks.onGetOverlayState).toHaveBeenCalled();
        expect(sendResponseMock).toHaveBeenCalledWith({ enabled: true });
      });
    });

    describe('PING', () => {
      it('returns pong', () => {
        simulateMessage('PING');

        expect(sendResponseMock).toHaveBeenCalledWith({ pong: true });
      });
    });

    describe('unknown message type', () => {
      it('returns failure for unknown message', () => {
        simulateMessage('UNKNOWN_TYPE');

        expect(sendResponseMock).toHaveBeenCalledWith({ success: false });
      });
    });

    describe('invalid messages', () => {
      it('ignores messages without type', () => {
        mockBrowserAPI.runtime._simulateMessage(
          { payload: 'data' },
          {},
          sendResponseMock
        );

        expect(sendResponseMock).not.toHaveBeenCalled();
      });

      it('ignores null messages', () => {
        mockBrowserAPI.runtime._simulateMessage(null, {}, sendResponseMock);

        expect(sendResponseMock).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('returns failure on callback error', () => {
        callbacks.onGetEvents.mockImplementation(() => {
          throw new Error('Test error');
        });

        simulateMessage('GET_EVENTS');

        expect(sendResponseMock).toHaveBeenCalledWith({ success: false });
      });
    });
  });
});

describe('createContentMessageHandler', () => {
  it('creates a ContentMessageHandler instance', () => {
    const mockBrowserAPI = createMockBrowserAPI();
    const handler = createContentMessageHandler({
      browserAPI: mockBrowserAPI,
      callbacks: {
        onGetEvents: vi.fn(),
        onClearEvents: vi.fn(),
        onToggleOverlay: vi.fn(),
        onUpdateSettings: vi.fn(),
        onGetSettings: vi.fn(),
        onGetOverlayState: vi.fn(),
      },
    });

    expect(handler).toBeInstanceOf(ContentMessageHandler);
  });
});
