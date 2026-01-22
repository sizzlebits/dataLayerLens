/**
 * Mock browser API for testing.
 * Provides controllable implementations of all browser extension APIs.
 * Uses vi.fn() for methods that need to be tracked in tests.
 */

import { vi } from 'vitest';
import type {
  IBrowserAPI,
  IBrowserRuntime,
  IBrowserStorage,
  IBrowserStorageArea,
  IBrowserTabs,
  IBrowserScripting,
  IBrowserAction,
  MessageSender,
  StorageAreaName,
  StorageChanges,
  Tab,
  TabQueryInfo,
  ScriptInjectionTarget,
} from './BrowserAPI';

type MessageListener = (
  message: unknown,
  sender: MessageSender,
  sendResponse: (response?: unknown) => void
) => boolean | void;

type StorageChangeListener = (changes: StorageChanges, areaName: StorageAreaName) => void;

export class MockStorage implements IBrowserStorage {
  private data: Record<string, unknown> = {};

  async get<T = Record<string, unknown>>(keys?: string | string[] | null): Promise<T> {
    if (keys === null || keys === undefined) {
      return { ...this.data } as T;
    }

    const keyArray = Array.isArray(keys) ? keys : [keys];
    const result: Record<string, unknown> = {};

    for (const key of keyArray) {
      if (key in this.data) {
        result[key] = this.data[key];
      }
    }

    return result as T;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.data, items);
  }

  async remove(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const key of keyArray) {
      delete this.data[key];
    }
  }

  // Test helpers
  _getData(): Record<string, unknown> {
    return { ...this.data };
  }

  _setData(data: Record<string, unknown>): void {
    this.data = { ...data };
  }

  _clear(): void {
    this.data = {};
  }
}

export class MockStorageArea implements IBrowserStorageArea {
  public local: MockStorage;
  private listeners: StorageChangeListener[] = [];

  constructor() {
    this.local = new MockStorage();
  }

  public onChanged = {
    addListener: vi.fn((callback: StorageChangeListener): void => {
      this.listeners.push(callback);
    }),
    removeListener: vi.fn((callback: StorageChangeListener): void => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    }),
  };

  // Test helper to trigger storage change events
  _triggerChange(changes: StorageChanges, areaName: StorageAreaName = 'local'): void {
    for (const listener of this.listeners) {
      listener(changes, areaName);
    }
  }

  _getListeners(): StorageChangeListener[] {
    return [...this.listeners];
  }
}

export class MockRuntime implements IBrowserRuntime {
  private listeners: MessageListener[] = [];
  private messageHandler: ((message: unknown) => unknown) | null = null;
  public lastError: { message?: string } | undefined = undefined;
  private urlPrefix = 'chrome-extension://mock-extension-id/';

  public onMessage = {
    addListener: vi.fn((callback: MessageListener): void => {
      this.listeners.push(callback);
    }),
    removeListener: vi.fn((callback: MessageListener): void => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    }),
  };

  sendMessage = vi.fn(async <T = unknown>(message: unknown): Promise<T> => {
    if (this.messageHandler) {
      return this.messageHandler(message) as T;
    }
    return undefined as T;
  });

  getURL(path: string): string {
    return `${this.urlPrefix}${path.replace(/^\//, '')}`;
  }

  // Test helpers
  _setMessageHandler(handler: (message: unknown) => unknown): void {
    this.messageHandler = handler;
  }

  _simulateMessage(
    message: unknown,
    sender: MessageSender = {},
    sendResponse: (response?: unknown) => void = () => {}
  ): void {
    for (const listener of this.listeners) {
      listener(message, sender, sendResponse);
    }
  }

  _getListeners(): MessageListener[] {
    return [...this.listeners];
  }

  _setLastError(error: { message?: string } | undefined): void {
    this.lastError = error;
  }

  _setUrlPrefix(prefix: string): void {
    this.urlPrefix = prefix;
  }
}

export class MockTabs implements IBrowserTabs {
  private tabs: Tab[] = [];
  private messageHandler: ((tabId: number, message: unknown) => unknown) | null = null;
  private removedListeners: ((tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void)[] = [];

  query = vi.fn(async (queryInfo: TabQueryInfo): Promise<Tab[]> => {
    return this.tabs.filter((tab) => {
      if (queryInfo.active !== undefined && tab.active !== queryInfo.active) {
        return false;
      }
      if (queryInfo.windowId !== undefined && tab.windowId !== queryInfo.windowId) {
        return false;
      }
      if (queryInfo.url !== undefined) {
        const urls = Array.isArray(queryInfo.url) ? queryInfo.url : [queryInfo.url];
        const tabUrl = tab.url ?? '';
        const matches = urls.some((pattern) => {
          // Simple glob matching for testing
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(tabUrl);
        });
        if (!matches) {
          return false;
        }
      }
      return true;
    });
  });

  sendMessage = vi.fn(async <T = unknown>(tabId: number, message: unknown): Promise<T> => {
    if (this.messageHandler) {
      return this.messageHandler(tabId, message) as T;
    }
    return undefined as T;
  });

  public onRemoved = {
    addListener: vi.fn((callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void => {
      this.removedListeners.push(callback);
    }),
    removeListener: vi.fn((callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void => {
      const index = this.removedListeners.indexOf(callback);
      if (index > -1) {
        this.removedListeners.splice(index, 1);
      }
    }),
  };

  // Test helpers
  _setTabs(tabs: Tab[]): void {
    this.tabs = [...tabs];
  }

  _addTab(tab: Tab): void {
    this.tabs.push(tab);
  }

  _clearTabs(): void {
    this.tabs = [];
  }

  _setMessageHandler(handler: (tabId: number, message: unknown) => unknown): void {
    this.messageHandler = handler;
  }

  _simulateTabRemoved(tabId: number, windowId = 1, isWindowClosing = false): void {
    for (const listener of this.removedListeners) {
      listener(tabId, { windowId, isWindowClosing });
    }
  }
}

export class MockScripting implements IBrowserScripting {
  private executeScriptHandler: ((options: { target: ScriptInjectionTarget; files: string[] }) => unknown) | null = null;

  async executeScript(options: { target: ScriptInjectionTarget; files: string[] }): Promise<unknown> {
    if (this.executeScriptHandler) {
      return this.executeScriptHandler(options);
    }
    return [];
  }

  _setExecuteScriptHandler(handler: (options: { target: ScriptInjectionTarget; files: string[] }) => unknown): void {
    this.executeScriptHandler = handler;
  }
}

export class MockAction implements IBrowserAction {
  private clickedListeners: ((tab: Tab) => void)[] = [];

  public onClicked = {
    addListener: vi.fn((callback: (tab: Tab) => void): void => {
      this.clickedListeners.push(callback);
    }),
    removeListener: vi.fn((callback: (tab: Tab) => void): void => {
      const index = this.clickedListeners.indexOf(callback);
      if (index > -1) {
        this.clickedListeners.splice(index, 1);
      }
    }),
  };

  _simulateClick(tab: Tab): void {
    for (const listener of this.clickedListeners) {
      listener(tab);
    }
  }
}

export class MockBrowserAPI implements IBrowserAPI {
  public runtime: MockRuntime;
  public storage: MockStorageArea;
  public tabs: MockTabs;
  public scripting: MockScripting;
  public action: MockAction;

  constructor() {
    this.runtime = new MockRuntime();
    this.storage = new MockStorageArea();
    this.tabs = new MockTabs();
    this.scripting = new MockScripting();
    this.action = new MockAction();
  }

  // Test helper to reset all mocks
  _reset(): void {
    this.runtime = new MockRuntime();
    this.storage = new MockStorageArea();
    this.tabs = new MockTabs();
    this.scripting = new MockScripting();
    this.action = new MockAction();
  }
}

/**
 * Factory function to create a new mock browser API for testing.
 */
export function createMockBrowserAPI(): MockBrowserAPI {
  return new MockBrowserAPI();
}
