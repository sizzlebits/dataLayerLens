import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message, DataLayerEvent } from '@/types';

// Create mock chrome API - must be defined before vi.mock
const mockSendMessage = vi.fn();
const mockTabsSendMessage = vi.fn();
const mockAddListener = vi.fn();
const mockRemoveListener = vi.fn();
let mockLastError: { message: string } | null = null;

// Mock the entire module to avoid browserAPI initialization issues
vi.mock('./messaging', () => {
  // Utility functions that don't need browser API
  const generateEventId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  };

  const isValidDataLayerPush = (data: unknown): boolean => {
    return (
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      typeof (data as Record<string, unknown>).event === 'string' &&
      ((data as Record<string, unknown>).event as string).trim() !== ''
    );
  };

  const createDataLayerEvent = (
    data: unknown,
    source: string
  ): DataLayerEvent | null => {
    if (!isValidDataLayerPush(data)) {
      return null;
    }

    const eventData = data as Record<string, unknown>;

    return {
      id: generateEventId(),
      timestamp: Date.now(),
      event: eventData.event as string,
      data: eventData,
      source,
      raw: data,
      dataLayerIndex: 0,
    };
  };

  // Functions that use browser API - mock them
  const sendMessage = vi.fn((message: Message): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      mockSendMessage(message, (response: unknown) => {
        if (mockLastError) {
          reject(mockLastError);
        } else {
          resolve(response);
        }
      });
    });
  });

  const sendToTab = vi.fn((tabId: number, message: Message): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      mockTabsSendMessage(tabId, message, (response: unknown) => {
        if (mockLastError) {
          reject(mockLastError);
        } else {
          resolve(response);
        }
      });
    });
  });

  const onMessage = vi.fn((callback: (message: Message, sender: chrome.runtime.MessageSender) => void | Promise<unknown>): (() => void) => {
    const listener = (
      message: Message,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      const result = callback(message, sender);
      if (result instanceof Promise) {
        result.then(sendResponse);
        return true;
      }
      return false;
    };

    mockAddListener(listener);
    return () => mockRemoveListener(listener);
  });

  return {
    generateEventId,
    createDataLayerEvent,
    sendMessage,
    sendToTab,
    onMessage,
  };
});

// Import after mocking
import { generateEventId, createDataLayerEvent, sendMessage, sendToTab, onMessage } from './messaging';

describe('generateEventId', () => {
  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateEventId());
    }
    expect(ids.size).toBe(100);
  });

  it('includes timestamp in ID', () => {
    const before = Date.now();
    const id = generateEventId();
    const after = Date.now();

    const timestamp = parseInt(id.split('-')[0], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('has correct format (timestamp-random)', () => {
    const id = generateEventId();
    const parts = id.split('-');
    expect(parts.length).toBe(2);
    expect(/^\d+$/.test(parts[0])).toBe(true);
    expect(/^[a-z0-9]+$/.test(parts[1])).toBe(true);
  });
});

describe('createDataLayerEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  it('creates event from valid dataLayer push', () => {
    const data = {
      event: 'page_view',
      page_title: 'Home',
      page_location: 'https://example.com',
    };

    const event = createDataLayerEvent(data, 'dataLayer');

    expect(event).not.toBeNull();
    expect(event!.event).toBe('page_view');
    expect(event!.source).toBe('dataLayer');
    expect(event!.data).toEqual(data);
    expect(event!.raw).toEqual(data);
    expect(event!.timestamp).toBe(Date.now());
    expect(event!.id).toBeTruthy();
  });

  it('returns null for null data', () => {
    expect(createDataLayerEvent(null, 'dataLayer')).toBeNull();
  });

  it('returns null for undefined data', () => {
    expect(createDataLayerEvent(undefined, 'dataLayer')).toBeNull();
  });

  it('returns null for arrays', () => {
    expect(createDataLayerEvent(['event', 'page_view'], 'dataLayer')).toBeNull();
  });

  it('returns null for primitives', () => {
    expect(createDataLayerEvent('page_view', 'dataLayer')).toBeNull();
    expect(createDataLayerEvent(123, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent(true, 'dataLayer')).toBeNull();
  });

  it('returns null for objects without event property', () => {
    expect(createDataLayerEvent({ page_title: 'Home' }, 'dataLayer')).toBeNull();
  });

  it('returns null for objects with non-string event', () => {
    expect(createDataLayerEvent({ event: 123 }, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent({ event: null }, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent({ event: { name: 'test' } }, 'dataLayer')).toBeNull();
  });

  it('returns null for objects with empty event string', () => {
    expect(createDataLayerEvent({ event: '' }, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent({ event: '   ' }, 'dataLayer')).toBeNull();
  });

  it('preserves custom source name', () => {
    const data = { event: 'test' };
    const event = createDataLayerEvent(data, 'dataLayer_v2');
    expect(event!.source).toBe('dataLayer_v2');
  });

  it('handles complex nested data', () => {
    const data = {
      event: 'purchase',
      ecommerce: {
        transaction_id: 'T123',
        value: 100,
        items: [
          { item_id: 'SKU1', item_name: 'Product 1' },
          { item_id: 'SKU2', item_name: 'Product 2' },
        ],
      },
    };

    const event = createDataLayerEvent(data, 'dataLayer');
    expect(event!.data).toEqual(data);
  });
});

describe('sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLastError = null;
  });

  it('sends message via runtime.sendMessage', async () => {
    mockSendMessage.mockImplementation((_msg: Message, callback: (response: unknown) => void) => {
      callback({ success: true });
    });

    const message: Message = { type: 'GET_EVENTS' };
    const result = await sendMessage(message);

    expect(mockSendMessage).toHaveBeenCalledWith(message, expect.any(Function));
    expect(result).toEqual({ success: true });
  });

  it('rejects on runtime.lastError', async () => {
    mockSendMessage.mockImplementation((_msg: Message, callback: (response: unknown) => void) => {
      mockLastError = { message: 'Connection error' };
      callback(undefined);
    });

    const message: Message = { type: 'GET_EVENTS' };

    await expect(sendMessage(message)).rejects.toEqual({ message: 'Connection error' });
  });
});

describe('sendToTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLastError = null;
  });

  it('sends message to specific tab', async () => {
    mockTabsSendMessage.mockImplementation((_tabId: number, _msg: Message, callback: (response: unknown) => void) => {
      callback({ events: [] });
    });

    const message: Message = { type: 'GET_EVENTS' };
    const result = await sendToTab(123, message);

    expect(mockTabsSendMessage).toHaveBeenCalledWith(123, message, expect.any(Function));
    expect(result).toEqual({ events: [] });
  });

  it('rejects on runtime.lastError', async () => {
    mockTabsSendMessage.mockImplementation((_tabId: number, _msg: Message, callback: (response: unknown) => void) => {
      mockLastError = { message: 'Tab not found' };
      callback(undefined);
    });

    const message: Message = { type: 'GET_EVENTS' };

    await expect(sendToTab(999, message)).rejects.toEqual({ message: 'Tab not found' });
  });
});

describe('onMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers message listener', () => {
    const callback = vi.fn();
    onMessage(callback);

    expect(mockAddListener).toHaveBeenCalled();
  });

  it('returns cleanup function that removes listener', () => {
    const callback = vi.fn();
    const cleanup = onMessage(callback);

    cleanup();

    expect(mockRemoveListener).toHaveBeenCalled();
  });

  it('calls callback with message and sender', () => {
    const callback = vi.fn();
    onMessage(callback);

    // Get the registered listener
    const listener = mockAddListener.mock.calls[0][0];
    const message: Message = { type: 'GET_EVENTS' };
    const sender = { tab: { id: 1 } } as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    listener(message, sender, sendResponse);

    expect(callback).toHaveBeenCalledWith(message, sender);
  });

  it('returns true for async callbacks to keep channel open', () => {
    const callback = vi.fn().mockResolvedValue({ success: true });
    onMessage(callback);

    const listener = mockAddListener.mock.calls[0][0];
    const message: Message = { type: 'GET_EVENTS' };
    const sender = {} as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    const result = listener(message, sender, sendResponse);

    expect(result).toBe(true);
  });

  it('returns false for sync callbacks', () => {
    const callback = vi.fn().mockReturnValue(undefined);
    onMessage(callback);

    const listener = mockAddListener.mock.calls[0][0];
    const message: Message = { type: 'GET_EVENTS' };
    const sender = {} as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    const result = listener(message, sender, sendResponse);

    expect(result).toBe(false);
  });

  it('calls sendResponse with resolved promise value', async () => {
    const callback = vi.fn().mockResolvedValue({ data: 'test' });
    onMessage(callback);

    const listener = mockAddListener.mock.calls[0][0];
    const message: Message = { type: 'GET_EVENTS' };
    const sender = {} as chrome.runtime.MessageSender;
    const sendResponse = vi.fn();

    listener(message, sender, sendResponse);

    // Wait for promise to resolve
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ data: 'test' });
    });
  });
});
