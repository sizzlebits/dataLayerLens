import { Message, DataLayerEvent } from '@/types';

// Browser API abstraction for Chrome/Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export function sendMessage(message: Message): Promise<unknown> {
  return new Promise((resolve, reject) => {
    browserAPI.runtime.sendMessage(message, (response: unknown) => {
      if (browserAPI.runtime.lastError) {
        reject(browserAPI.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

export function sendToTab(tabId: number, message: Message): Promise<unknown> {
  return new Promise((resolve, reject) => {
    browserAPI.tabs.sendMessage(tabId, message, (response: unknown) => {
      if (browserAPI.runtime.lastError) {
        reject(browserAPI.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

export function onMessage(callback: (message: Message, sender: chrome.runtime.MessageSender) => void | Promise<unknown>): () => void {
  const listener = (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    const result = callback(message, sender);
    if (result instanceof Promise) {
      result.then(sendResponse);
      return true; // Keep the message channel open for async response
    }
    return false;
  };

  browserAPI.runtime.onMessage.addListener(listener);
  return () => browserAPI.runtime.onMessage.removeListener(listener);
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createDataLayerEvent(
  data: unknown,
  source: string
): DataLayerEvent | null {
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
    dataLayerIndex: 0, // Index not tracked in messaging
  };
}

function isValidDataLayerPush(data: unknown): boolean {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).event === 'string' &&
    ((data as Record<string, unknown>).event as string).trim() !== ''
  );
}
