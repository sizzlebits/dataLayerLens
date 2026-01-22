import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataLayerEvent, Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  MessageRouter,
  handleMessage,
  createMessageRouter,
  type MessageRouterCallbacks,
  type IMessageRouterRuntime,
} from './MessageRouter';

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

function createMockRuntime(): IMessageRouterRuntime & {
  _listeners: Array<(message: unknown, sender: unknown, sendResponse: (r?: unknown) => void) => boolean | void>;
  _simulateMessage: (message: unknown, sender?: unknown) => { response: unknown; returnValue: boolean | void };
} {
  const listeners: Array<(message: unknown, sender: unknown, sendResponse: (r?: unknown) => void) => boolean | void> = [];

  return {
    id: 'test-extension-id',
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: vi.fn((listener) => listeners.push(listener)),
      removeListener: vi.fn((listener) => {
        const idx = listeners.indexOf(listener);
        if (idx !== -1) listeners.splice(idx, 1);
      }),
    },
    _listeners: listeners,
    _simulateMessage: (message: unknown, sender = {}) => {
      let capturedResponse: unknown;
      let returnValue: boolean | void;
      for (const listener of listeners) {
        returnValue = listener(message, sender, (r) => { capturedResponse = r; });
      }
      return { response: capturedResponse, returnValue };
    },
  };
}

describe('handleMessage (pure function)', () => {
  let callbacks: MessageRouterCallbacks;

  beforeEach(() => {
    callbacks = {
      onGetEvents: vi.fn(() => []),
      onClearEvents: vi.fn(),
      onUpdateSettings: vi.fn(),
      onGetSettings: vi.fn(() => DEFAULT_SETTINGS),
    };
  });

  it('handles GET_EVENTS message', () => {
    const events = [createMockEvent({ id: 'e1' }), createMockEvent({ id: 'e2' })];
    vi.mocked(callbacks.onGetEvents).mockReturnValue(events);

    const result = handleMessage({ type: 'GET_EVENTS' }, callbacks);

    expect(callbacks.onGetEvents).toHaveBeenCalled();
    expect(result.response).toEqual({ events });
  });

  it('handles CLEAR_EVENTS message', () => {
    const result = handleMessage({ type: 'CLEAR_EVENTS' }, callbacks);

    expect(callbacks.onClearEvents).toHaveBeenCalled();
    expect(result.response).toEqual({ success: true });
  });

  it('handles UPDATE_SETTINGS message', () => {
    const newSettings = { maxEvents: 200, persistEvents: true };

    const result = handleMessage({ type: 'UPDATE_SETTINGS', payload: newSettings }, callbacks);

    expect(callbacks.onUpdateSettings).toHaveBeenCalledWith(newSettings);
    expect(result.response).toEqual({ success: true });
  });

  it('handles GET_SETTINGS message', () => {
    const settings = { ...DEFAULT_SETTINGS, maxEvents: 300 };
    vi.mocked(callbacks.onGetSettings).mockReturnValue(settings);

    const result = handleMessage({ type: 'GET_SETTINGS' }, callbacks);

    expect(callbacks.onGetSettings).toHaveBeenCalled();
    expect(result.response).toEqual({ settings });
  });

  it('handles unknown message type', () => {
    const result = handleMessage({ type: 'UNKNOWN_TYPE' }, callbacks);

    expect(result.response).toEqual({ success: false });
  });
});

describe('MessageRouter', () => {
  let callbacks: MessageRouterCallbacks;
  let mockRuntime: ReturnType<typeof createMockRuntime>;
  let router: MessageRouter;

  beforeEach(() => {
    callbacks = {
      onGetEvents: vi.fn(() => []),
      onClearEvents: vi.fn(),
      onUpdateSettings: vi.fn(),
      onGetSettings: vi.fn(() => DEFAULT_SETTINGS),
    };

    mockRuntime = createMockRuntime();

    router = new MessageRouter({
      runtime: mockRuntime,
      callbacks,
    });
  });

  describe('start/stop', () => {
    it('adds message listener on start', () => {
      router.start();
      expect(mockRuntime.onMessage.addListener).toHaveBeenCalledTimes(1);
      expect(mockRuntime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('does not add duplicate listeners', () => {
      router.start();
      router.start();
      expect(mockRuntime.onMessage.addListener).toHaveBeenCalledTimes(1);
    });

    it('removes listener on stop', () => {
      router.start();
      router.stop();
      expect(mockRuntime.onMessage.removeListener).toHaveBeenCalledTimes(1);
    });

    it('handles stop when not started', () => {
      // Should not throw
      router.stop();
      expect(mockRuntime.onMessage.removeListener).not.toHaveBeenCalled();
    });
  });

  describe('message handling via listener', () => {
    beforeEach(() => {
      router.start();
    });

    it('handles GET_EVENTS message via listener', () => {
      const events = [createMockEvent({ id: 'e1' })];
      vi.mocked(callbacks.onGetEvents).mockReturnValue(events);

      const { response } = mockRuntime._simulateMessage({ type: 'GET_EVENTS' });

      expect(response).toEqual({ events });
    });

    it('handles CLEAR_EVENTS message via listener', () => {
      const { response } = mockRuntime._simulateMessage({ type: 'CLEAR_EVENTS' });

      expect(callbacks.onClearEvents).toHaveBeenCalled();
      expect(response).toEqual({ success: true });
    });

    it('handles UPDATE_SETTINGS message via listener', () => {
      const settings = { persistEvents: true };
      const { response } = mockRuntime._simulateMessage({ type: 'UPDATE_SETTINGS', payload: settings });

      expect(callbacks.onUpdateSettings).toHaveBeenCalledWith(settings);
      expect(response).toEqual({ success: true });
    });

    it('ignores invalid messages', () => {
      mockRuntime._simulateMessage(null);
      mockRuntime._simulateMessage({ noType: true });
      mockRuntime._simulateMessage('string');

      expect(callbacks.onGetEvents).not.toHaveBeenCalled();
      expect(callbacks.onClearEvents).not.toHaveBeenCalled();
    });

    it('returns true to keep channel open', () => {
      const { returnValue } = mockRuntime._simulateMessage({ type: 'GET_EVENTS' });
      expect(returnValue).toBe(true);
    });
  });

  describe('notification methods', () => {
    it('notifySettingsChanged sends SETTINGS_CHANGED message', () => {
      router.notifySettingsChanged(DEFAULT_SETTINGS);

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'SETTINGS_CHANGED',
        payload: DEFAULT_SETTINGS,
      });
    });

    it('notifyEventsUpdated sends EVENTS_UPDATED message', () => {
      const events = [createMockEvent()];
      router.notifyEventsUpdated(events);

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'EVENTS_UPDATED',
        payload: events,
      });
    });

    it('sendDataLayerEvent sends DATALAYER_EVENT message', () => {
      const event = createMockEvent();
      router.sendDataLayerEvent(event);

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'DATALAYER_EVENT',
        payload: event,
      });
    });

    it('broadcastSettingsUpdate sends SETTINGS_UPDATED message', () => {
      const settings = { persistEvents: true };
      router.broadcastSettingsUpdate(settings);

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'SETTINGS_UPDATED',
        payload: settings,
      });
    });

    it('does not send when context is invalid', () => {
      // Create router with no runtime.id (invalid context)
      const invalidRuntime = createMockRuntime();
      invalidRuntime.id = undefined;
      const invalidRouter = new MessageRouter({
        runtime: invalidRuntime,
        callbacks,
      });

      invalidRouter.notifySettingsChanged(DEFAULT_SETTINGS);

      expect(invalidRuntime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('requestSettings', () => {
    it('sends GET_SETTINGS message and returns settings', async () => {
      const expectedSettings = { ...DEFAULT_SETTINGS, maxEvents: 200 };
      vi.mocked(mockRuntime.sendMessage).mockResolvedValue({ settings: expectedSettings });

      const result = await router.requestSettings('example.com');

      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SETTINGS',
        domain: 'example.com',
      });
      expect(result).toEqual(expectedSettings);
    });

    it('returns null when no settings in response', async () => {
      vi.mocked(mockRuntime.sendMessage).mockResolvedValue({});

      const result = await router.requestSettings('example.com');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      vi.mocked(mockRuntime.sendMessage).mockRejectedValue(new Error('Network error'));

      const result = await router.requestSettings('example.com');

      expect(result).toBeNull();
    });

    it('returns null when context is invalid', async () => {
      const invalidRuntime = createMockRuntime();
      invalidRuntime.id = undefined;
      const invalidRouter = new MessageRouter({
        runtime: invalidRuntime,
        callbacks,
      });

      const result = await invalidRouter.requestSettings('example.com');

      expect(result).toBeNull();
      expect(invalidRuntime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('isContextValid', () => {
    it('returns true when context is valid', () => {
      expect(router.isContextValid()).toBe(true);
    });

    it('returns false when runtime.id is undefined', () => {
      const invalidRuntime = createMockRuntime();
      invalidRuntime.id = undefined;
      const invalidRouter = new MessageRouter({
        runtime: invalidRuntime,
        callbacks,
      });

      expect(invalidRouter.isContextValid()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles Extension context invalidated error', async () => {
      vi.mocked(mockRuntime.sendMessage).mockRejectedValue(
        new Error('Extension context invalidated')
      );

      await router.requestSettings('example.com');

      // After error, context should be marked invalid
      expect(router.isContextValid()).toBe(false);
    });
  });
});

describe('createMessageRouter', () => {
  it('creates a MessageRouter instance', () => {
    // Set up global chrome mock for factory function
    const mockChrome = {
      runtime: {
        id: 'test-id',
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };
    // @ts-expect-error - mocking global chrome
    globalThis.chrome = mockChrome;

    const callbacks: MessageRouterCallbacks = {
      onGetEvents: vi.fn(() => []),
      onClearEvents: vi.fn(),
      onUpdateSettings: vi.fn(),
      onGetSettings: vi.fn(() => DEFAULT_SETTINGS),
    };

    const router = createMessageRouter(callbacks);

    expect(router).toBeDefined();
    expect(typeof router.start).toBe('function');
    expect(typeof router.stop).toBe('function');
  });
});
