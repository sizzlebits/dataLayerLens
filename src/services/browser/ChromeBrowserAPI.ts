/**
 * Chrome/Firefox browser API implementation.
 * Wraps the native browser extension APIs with promises for consistency.
 */

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

// Get the appropriate browser API (Firefox uses 'browser', Chrome uses 'chrome')
const getNativeBrowserAPI = (): typeof chrome => {
  if (typeof browser !== 'undefined') {
    return browser as unknown as typeof chrome;
  }
  if (typeof chrome !== 'undefined') {
    return chrome;
  }
  throw new Error('No browser extension API available');
};

class ChromeStorage implements IBrowserStorage {
  private storage: chrome.storage.LocalStorageArea;

  constructor(storage: chrome.storage.LocalStorageArea) {
    this.storage = storage;
  }

  get<T = Record<string, unknown>>(keys?: string | string[] | null): Promise<T> {
    return new Promise((resolve, reject) => {
      this.storage.get(keys ?? null, (result) => {
        const api = getNativeBrowserAPI();
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else {
          resolve(result as T);
        }
      });
    });
  }

  set(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.set(items, () => {
        const api = getNativeBrowserAPI();
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.remove(keys, () => {
        const api = getNativeBrowserAPI();
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}

class ChromeStorageArea implements IBrowserStorageArea {
  public local: IBrowserStorage;
  public onChanged: {
    addListener(callback: (changes: StorageChanges, areaName: StorageAreaName) => void): void;
    removeListener(callback: (changes: StorageChanges, areaName: StorageAreaName) => void): void;
  };

  constructor(api: typeof chrome) {
    this.local = new ChromeStorage(api.storage.local);
    this.onChanged = {
      addListener: (callback) => {
        api.storage.onChanged.addListener(callback as (
          changes: { [key: string]: chrome.storage.StorageChange },
          areaName: string
        ) => void);
      },
      removeListener: (callback) => {
        api.storage.onChanged.removeListener(callback as (
          changes: { [key: string]: chrome.storage.StorageChange },
          areaName: string
        ) => void);
      },
    };
  }
}

class ChromeRuntime implements IBrowserRuntime {
  private api: typeof chrome;

  constructor(api: typeof chrome) {
    this.api = api;
  }

  get lastError(): { message?: string } | undefined {
    return this.api.runtime.lastError;
  }

  sendMessage<T = unknown>(message: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      this.api.runtime.sendMessage(message, (response: unknown) => {
        if (this.api.runtime.lastError) {
          reject(new Error(this.api.runtime.lastError.message));
        } else {
          resolve(response as T);
        }
      });
    });
  }

  get onMessage() {
    return {
      addListener: (
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ) => {
        this.api.runtime.onMessage.addListener(callback as (
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void);
      },
      removeListener: (
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ) => {
        this.api.runtime.onMessage.removeListener(callback as (
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void);
      },
    };
  }

  getURL(path: string): string {
    return this.api.runtime.getURL(path);
  }
}

class ChromeTabs implements IBrowserTabs {
  private api: typeof chrome;

  constructor(api: typeof chrome) {
    this.api = api;
  }

  query(queryInfo: TabQueryInfo): Promise<Tab[]> {
    return new Promise((resolve, reject) => {
      this.api.tabs.query(queryInfo, (tabs) => {
        if (this.api.runtime.lastError) {
          reject(new Error(this.api.runtime.lastError.message));
        } else {
          resolve(tabs as Tab[]);
        }
      });
    });
  }

  sendMessage<T = unknown>(tabId: number, message: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      this.api.tabs.sendMessage(tabId, message, (response: unknown) => {
        if (this.api.runtime.lastError) {
          reject(new Error(this.api.runtime.lastError.message));
        } else {
          resolve(response as T);
        }
      });
    });
  }

  get onRemoved() {
    return {
      addListener: (callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void) => {
        this.api.tabs.onRemoved.addListener(callback);
      },
      removeListener: (callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void) => {
        this.api.tabs.onRemoved.removeListener(callback);
      },
    };
  }
}

class ChromeScripting implements IBrowserScripting {
  private api: typeof chrome;

  constructor(api: typeof chrome) {
    this.api = api;
  }

  executeScript(options: { target: ScriptInjectionTarget; files: string[] }): Promise<unknown> {
    return this.api.scripting.executeScript({
      target: { tabId: options.target.tabId, frameIds: options.target.frameIds, allFrames: options.target.allFrames },
      files: options.files,
    });
  }
}

class ChromeAction implements IBrowserAction {
  private api: typeof chrome;

  constructor(api: typeof chrome) {
    this.api = api;
  }

  get onClicked() {
    return {
      addListener: (callback: (tab: Tab) => void) => {
        this.api.action?.onClicked?.addListener(callback as (tab: chrome.tabs.Tab) => void);
      },
      removeListener: (callback: (tab: Tab) => void) => {
        this.api.action?.onClicked?.removeListener(callback as (tab: chrome.tabs.Tab) => void);
      },
    };
  }
}

export class ChromeBrowserAPI implements IBrowserAPI {
  public runtime: IBrowserRuntime;
  public storage: IBrowserStorageArea;
  public tabs: IBrowserTabs;
  public scripting: IBrowserScripting;
  public action?: IBrowserAction;

  constructor(nativeAPI?: typeof chrome) {
    const api = nativeAPI ?? getNativeBrowserAPI();
    this.runtime = new ChromeRuntime(api);
    this.storage = new ChromeStorageArea(api);
    this.tabs = new ChromeTabs(api);
    this.scripting = new ChromeScripting(api);
    // action API may not be available in all contexts (e.g., content scripts)
    if (api.action) {
      this.action = new ChromeAction(api);
    }
  }
}

// Singleton instance for runtime use
let browserAPIInstance: ChromeBrowserAPI | null = null;

export function getBrowserAPI(): IBrowserAPI {
  if (!browserAPIInstance) {
    browserAPIInstance = new ChromeBrowserAPI();
  }
  return browserAPIInstance;
}
