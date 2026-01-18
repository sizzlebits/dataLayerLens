/**
 * Browser API interface for Chrome/Firefox extension compatibility.
 * This abstraction enables dependency injection and easier testing.
 */

export interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

export interface StorageChanges {
  [key: string]: StorageChange;
}

export type StorageAreaName = 'local' | 'sync' | 'managed' | 'session';

export interface MessageSender {
  tab?: {
    id?: number;
    url?: string;
    title?: string;
    windowId?: number;
  };
  frameId?: number;
  id?: string;
  url?: string;
  origin?: string;
}

export interface Tab {
  id?: number;
  url?: string;
  title?: string;
  active: boolean;
  windowId: number;
  index: number;
}

export interface TabQueryInfo {
  active?: boolean;
  currentWindow?: boolean;
  url?: string | string[];
  windowId?: number;
}

export interface IBrowserStorage {
  get<T = Record<string, unknown>>(keys?: string | string[] | null): Promise<T>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export interface IBrowserStorageArea {
  local: IBrowserStorage;
  onChanged: {
    addListener(callback: (changes: StorageChanges, areaName: StorageAreaName) => void): void;
    removeListener(callback: (changes: StorageChanges, areaName: StorageAreaName) => void): void;
  };
}

export interface IBrowserRuntime {
  sendMessage<T = unknown>(message: unknown): Promise<T>;
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: MessageSender,
        sendResponse: (response?: unknown) => void
      ) => boolean | void
    ): void;
    removeListener(
      callback: (
        message: unknown,
        sender: MessageSender,
        sendResponse: (response?: unknown) => void
      ) => boolean | void
    ): void;
  };
  lastError?: { message?: string };
  getURL(path: string): string;
}

export interface IBrowserTabs {
  query(queryInfo: TabQueryInfo): Promise<Tab[]>;
  sendMessage<T = unknown>(tabId: number, message: unknown): Promise<T>;
  onRemoved: {
    addListener(callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void;
    removeListener(callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void;
  };
}

export interface ScriptInjectionTarget {
  tabId: number;
  frameIds?: number[];
  allFrames?: boolean;
}

export interface IBrowserScripting {
  executeScript(options: { target: ScriptInjectionTarget; files: string[] }): Promise<unknown>;
}

export interface IBrowserAction {
  onClicked: {
    addListener(callback: (tab: Tab) => void): void;
    removeListener(callback: (tab: Tab) => void): void;
  };
}

export interface IBrowserAPI {
  runtime: IBrowserRuntime;
  storage: IBrowserStorageArea;
  tabs: IBrowserTabs;
  scripting: IBrowserScripting;
  action?: IBrowserAction;
}
