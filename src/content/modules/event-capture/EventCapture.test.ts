import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventCapture, createEventCapture } from './EventCapture';
import { createMockBrowserAPI } from '@/services/browser';
import type { DataLayerEvent } from '@/types';

describe('EventCapture', () => {
  let mockBrowserAPI: ReturnType<typeof createMockBrowserAPI>;
  let onEventMock: ReturnType<typeof vi.fn>;
  let eventCapture: EventCapture;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let postMessageSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockBrowserAPI = createMockBrowserAPI();
    onEventMock = vi.fn();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    postMessageSpy = vi.spyOn(window, 'postMessage');

    // Mock document.createElement for script injection
    const mockScript = {
      src: '',
      onload: null as (() => void) | null,
      remove: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockScript as unknown as HTMLElement);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      // Trigger onload
      if (mockScript.onload) {
        mockScript.onload();
      }
      return node;
    });

    eventCapture = new EventCapture({
      browserAPI: mockBrowserAPI,
      onEvent: onEventMock,
      dataLayerNames: ['dataLayer'],
    });
  });

  afterEach(() => {
    eventCapture.destroy();
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('injects the page script', () => {
      eventCapture.initialize();

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('sets up message listener', () => {
      eventCapture.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('only initializes once', () => {
      eventCapture.initialize();
      eventCapture.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      eventCapture.initialize();
    });

    it('handles DATALAYER_PUSH messages', () => {
      const messageEvent = new MessageEvent('message', {
        source: window,
        data: {
          type: 'DATALAYER_PUSH',
          payload: {
            data: { event: 'page_view', page: '/home' },
            source: 'dataLayer',
            timestamp: 1705579200000,
          },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(onEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'page_view',
          source: 'dataLayer',
          data: { event: 'page_view', page: '/home' },
        })
      );
    });

    it('ignores messages without event property', () => {
      const messageEvent = new MessageEvent('message', {
        source: window,
        data: {
          type: 'DATALAYER_PUSH',
          payload: {
            data: { page: '/home' }, // No event property
            source: 'dataLayer',
          },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(onEventMock).not.toHaveBeenCalled();
    });

    it('ignores messages with empty event property', () => {
      const messageEvent = new MessageEvent('message', {
        source: window,
        data: {
          type: 'DATALAYER_PUSH',
          payload: {
            data: { event: '  ' }, // Empty event
            source: 'dataLayer',
          },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(onEventMock).not.toHaveBeenCalled();
    });

    it('ignores messages from other sources', () => {
      const messageEvent = new MessageEvent('message', {
        source: null, // Different source
        data: {
          type: 'DATALAYER_PUSH',
          payload: {
            data: { event: 'page_view' },
            source: 'dataLayer',
          },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(onEventMock).not.toHaveBeenCalled();
    });

    it('handles DATALAYER_MONITOR_READY by sending init config', () => {
      const messageEvent = new MessageEvent('message', {
        source: window,
        data: { type: 'DATALAYER_MONITOR_READY' },
      });

      window.dispatchEvent(messageEvent);

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          type: 'DATALAYER_MONITOR_INIT',
          payload: { dataLayerNames: ['dataLayer'] },
        },
        '*'
      );
    });

    it('generates unique event IDs', () => {
      const capturedEvents: DataLayerEvent[] = [];
      onEventMock.mockImplementation((event) => capturedEvents.push(event));

      // Send two events
      for (let i = 0; i < 2; i++) {
        const messageEvent = new MessageEvent('message', {
          source: window,
          data: {
            type: 'DATALAYER_PUSH',
            payload: {
              data: { event: `event_${i}` },
              source: 'dataLayer',
            },
          },
        });
        window.dispatchEvent(messageEvent);
      }

      expect(capturedEvents).toHaveLength(2);
      expect(capturedEvents[0].id).not.toBe(capturedEvents[1].id);
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      eventCapture.initialize();
    });

    it('sends update config message to page', () => {
      eventCapture.updateConfig(['dataLayer', 'customDataLayer']);

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          type: 'DATALAYER_MONITOR_UPDATE_CONFIG',
          payload: { dataLayerNames: ['dataLayer', 'customDataLayer'] },
        },
        '*'
      );
    });
  });

  describe('destroy', () => {
    it('removes message listener', () => {
      eventCapture.initialize();
      eventCapture.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('allows re-initialization after destroy', () => {
      eventCapture.initialize();
      eventCapture.destroy();
      eventCapture.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });
});

describe('createEventCapture', () => {
  it('creates an EventCapture instance', () => {
    const mockBrowserAPI = createMockBrowserAPI();
    const onEvent = vi.fn();

    const capture = createEventCapture({
      browserAPI: mockBrowserAPI,
      onEvent,
      dataLayerNames: ['dataLayer'],
    });

    expect(capture).toBeInstanceOf(EventCapture);
  });
});
