import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MockBrowserAPI,
  MockStorage,
  MockStorageArea,
  MockRuntime,
  MockTabs,
  createMockBrowserAPI,
} from './MockBrowserAPI';
import type { Tab, StorageChanges } from './BrowserAPI';

describe('MockStorage', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe('get', () => {
    it('returns empty object when no data is set', async () => {
      const result = await storage.get();
      expect(result).toEqual({});
    });

    it('returns all data when keys is null', async () => {
      await storage.set({ foo: 'bar', baz: 123 });
      const result = await storage.get(null);
      expect(result).toEqual({ foo: 'bar', baz: 123 });
    });

    it('returns specific key when string is passed', async () => {
      await storage.set({ foo: 'bar', baz: 123 });
      const result = await storage.get('foo');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns multiple keys when array is passed', async () => {
      await storage.set({ foo: 'bar', baz: 123, qux: true });
      const result = await storage.get(['foo', 'baz']);
      expect(result).toEqual({ foo: 'bar', baz: 123 });
    });

    it('returns empty object for non-existent keys', async () => {
      await storage.set({ foo: 'bar' });
      const result = await storage.get('nonexistent');
      expect(result).toEqual({});
    });
  });

  describe('set', () => {
    it('stores single value', async () => {
      await storage.set({ foo: 'bar' });
      const result = await storage.get('foo');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('stores multiple values', async () => {
      await storage.set({ foo: 'bar', baz: 123 });
      const result = await storage.get();
      expect(result).toEqual({ foo: 'bar', baz: 123 });
    });

    it('overwrites existing values', async () => {
      await storage.set({ foo: 'bar' });
      await storage.set({ foo: 'updated' });
      const result = await storage.get('foo');
      expect(result).toEqual({ foo: 'updated' });
    });
  });

  describe('remove', () => {
    it('removes single key', async () => {
      await storage.set({ foo: 'bar', baz: 123 });
      await storage.remove('foo');
      const result = await storage.get();
      expect(result).toEqual({ baz: 123 });
    });

    it('removes multiple keys', async () => {
      await storage.set({ foo: 'bar', baz: 123, qux: true });
      await storage.remove(['foo', 'baz']);
      const result = await storage.get();
      expect(result).toEqual({ qux: true });
    });

    it('does nothing for non-existent keys', async () => {
      await storage.set({ foo: 'bar' });
      await storage.remove('nonexistent');
      const result = await storage.get();
      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('test helpers', () => {
    it('_getData returns copy of internal data', async () => {
      await storage.set({ foo: 'bar' });
      const data = storage._getData();
      expect(data).toEqual({ foo: 'bar' });

      // Modifying the returned object shouldn't affect storage
      data.foo = 'modified';
      expect(storage._getData()).toEqual({ foo: 'bar' });
    });

    it('_setData replaces internal data', () => {
      storage._setData({ test: 'data' });
      expect(storage._getData()).toEqual({ test: 'data' });
    });

    it('_clear removes all data', async () => {
      await storage.set({ foo: 'bar', baz: 123 });
      storage._clear();
      expect(storage._getData()).toEqual({});
    });
  });
});

describe('MockStorageArea', () => {
  let storageArea: MockStorageArea;

  beforeEach(() => {
    storageArea = new MockStorageArea();
  });

  it('provides local storage instance', () => {
    expect(storageArea.local).toBeInstanceOf(MockStorage);
  });

  describe('onChanged', () => {
    it('adds listener', () => {
      const listener = vi.fn();
      storageArea.onChanged.addListener(listener);
      expect(storageArea._getListeners()).toContain(listener);
    });

    it('removes listener', () => {
      const listener = vi.fn();
      storageArea.onChanged.addListener(listener);
      storageArea.onChanged.removeListener(listener);
      expect(storageArea._getListeners()).not.toContain(listener);
    });

    it('triggers change events to all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      storageArea.onChanged.addListener(listener1);
      storageArea.onChanged.addListener(listener2);

      const changes: StorageChanges = {
        foo: { oldValue: 'old', newValue: 'new' },
      };
      storageArea._triggerChange(changes, 'local');

      expect(listener1).toHaveBeenCalledWith(changes, 'local');
      expect(listener2).toHaveBeenCalledWith(changes, 'local');
    });
  });
});

describe('MockRuntime', () => {
  let runtime: MockRuntime;

  beforeEach(() => {
    runtime = new MockRuntime();
  });

  describe('sendMessage', () => {
    it('returns undefined when no handler is set', async () => {
      const result = await runtime.sendMessage({ type: 'test' });
      expect(result).toBeUndefined();
    });

    it('calls message handler and returns result', async () => {
      runtime._setMessageHandler((message) => {
        const msg = message as { type: string };
        if (msg.type === 'ping') {
          return 'pong';
        }
        return null;
      });

      const result = await runtime.sendMessage({ type: 'ping' });
      expect(result).toBe('pong');
    });
  });

  describe('onMessage', () => {
    it('adds listener', () => {
      const listener = vi.fn();
      runtime.onMessage.addListener(listener);
      expect(runtime._getListeners()).toContain(listener);
    });

    it('removes listener', () => {
      const listener = vi.fn();
      runtime.onMessage.addListener(listener);
      runtime.onMessage.removeListener(listener);
      expect(runtime._getListeners()).not.toContain(listener);
    });

    it('simulates incoming messages', () => {
      const listener = vi.fn();
      runtime.onMessage.addListener(listener);

      const message = { type: 'test', payload: 'data' };
      const sender = { tab: { id: 1 } };
      const sendResponse = vi.fn();

      runtime._simulateMessage(message, sender, sendResponse);

      expect(listener).toHaveBeenCalledWith(message, sender, sendResponse);
    });
  });

  describe('getURL', () => {
    it('returns URL with extension prefix', () => {
      const url = runtime.getURL('popup.html');
      expect(url).toBe('chrome-extension://mock-extension-id/popup.html');
    });

    it('handles leading slash', () => {
      const url = runtime.getURL('/icons/icon.png');
      expect(url).toBe('chrome-extension://mock-extension-id/icons/icon.png');
    });

    it('uses custom URL prefix', () => {
      runtime._setUrlPrefix('moz-extension://custom-id/');
      const url = runtime.getURL('popup.html');
      expect(url).toBe('moz-extension://custom-id/popup.html');
    });
  });

  describe('lastError', () => {
    it('is undefined by default', () => {
      expect(runtime.lastError).toBeUndefined();
    });

    it('can be set for testing', () => {
      runtime._setLastError({ message: 'Test error' });
      expect(runtime.lastError).toEqual({ message: 'Test error' });
    });
  });
});

describe('MockTabs', () => {
  let tabs: MockTabs;

  beforeEach(() => {
    tabs = new MockTabs();
  });

  describe('query', () => {
    const testTabs: Tab[] = [
      { id: 1, url: 'https://example.com', active: true, windowId: 1, index: 0 },
      { id: 2, url: 'https://test.com', active: false, windowId: 1, index: 1 },
      { id: 3, url: 'https://example.com/page', active: true, windowId: 2, index: 0 },
    ];

    beforeEach(() => {
      tabs._setTabs(testTabs);
    });

    it('returns all tabs when no query info', async () => {
      const result = await tabs.query({});
      expect(result).toHaveLength(3);
    });

    it('filters by active state', async () => {
      const result = await tabs.query({ active: true });
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.active)).toBe(true);
    });

    it('filters by windowId', async () => {
      const result = await tabs.query({ windowId: 1 });
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.windowId === 1)).toBe(true);
    });

    it('filters by URL pattern', async () => {
      const result = await tabs.query({ url: 'https://example.com*' });
      expect(result).toHaveLength(2);
    });

    it('filters by multiple URL patterns', async () => {
      const result = await tabs.query({ url: ['https://example.com', 'https://test.com'] });
      expect(result).toHaveLength(2);
    });

    it('combines multiple filters', async () => {
      const result = await tabs.query({ active: true, windowId: 1 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('sendMessage', () => {
    it('returns undefined when no handler is set', async () => {
      const result = await tabs.sendMessage(1, { type: 'test' });
      expect(result).toBeUndefined();
    });

    it('calls message handler with tabId and message', async () => {
      tabs._setMessageHandler((tabId, message) => {
        return { tabId, received: message };
      });

      const result = await tabs.sendMessage(42, { type: 'ping' });
      expect(result).toEqual({ tabId: 42, received: { type: 'ping' } });
    });
  });

  describe('test helpers', () => {
    it('_addTab adds single tab', async () => {
      tabs._addTab({ id: 1, active: true, windowId: 1, index: 0 });
      await expect(tabs.query({})).resolves.toHaveLength(1);
    });

    it('_clearTabs removes all tabs', async () => {
      tabs._setTabs([
        { id: 1, active: true, windowId: 1, index: 0 },
        { id: 2, active: false, windowId: 1, index: 1 },
      ]);
      tabs._clearTabs();
      const result = await tabs.query({});
      expect(result).toHaveLength(0);
    });
  });
});

describe('MockBrowserAPI', () => {
  let browserAPI: MockBrowserAPI;

  beforeEach(() => {
    browserAPI = createMockBrowserAPI();
  });

  it('provides runtime instance', () => {
    expect(browserAPI.runtime).toBeInstanceOf(MockRuntime);
  });

  it('provides storage instance', () => {
    expect(browserAPI.storage).toBeInstanceOf(MockStorageArea);
  });

  it('provides tabs instance', () => {
    expect(browserAPI.tabs).toBeInstanceOf(MockTabs);
  });

  it('_reset creates fresh instances', async () => {
    // Set some state
    await browserAPI.storage.local.set({ foo: 'bar' });
    browserAPI.tabs._addTab({ id: 1, active: true, windowId: 1, index: 0 });

    // Reset
    browserAPI._reset();

    // Verify fresh state
    const storageData = await browserAPI.storage.local.get();
    const tabsResult = await browserAPI.tabs.query({});

    expect(storageData).toEqual({});
    expect(tabsResult).toHaveLength(0);
  });
});

describe('createMockBrowserAPI', () => {
  it('creates new instance each time', () => {
    const api1 = createMockBrowserAPI();
    const api2 = createMockBrowserAPI();
    expect(api1).not.toBe(api2);
  });
});
