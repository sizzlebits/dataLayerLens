/**
 * Injected script that runs in the page context to monitor dataLayer arrays.
 * This script is injected via the content script to access window.dataLayer.
 */

interface DataLayerMonitorConfig {
  dataLayerNames: string[];
  consoleLogging?: boolean;
}

// Store console logging setting
let consoleLoggingEnabled = false;

interface MonitoredDataLayer {
  name: string;
  originalPush: (...args: unknown[]) => number;
}

const EXTENSION_ID = '__DATALAYER_MONITOR__';

// Track which dataLayers we're monitoring
const monitoredLayers: Map<string, MonitoredDataLayer> = new Map();

// Track the current length of each dataLayer for index assignment
const dataLayerLengths: Map<string, number> = new Map();

// Generate unique event IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Check if an object is a valid GTM-style event
function isValidEvent(data: unknown): data is Record<string, unknown> {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).event === 'string' &&
    ((data as Record<string, unknown>).event as string).trim() !== ''
  );
}

// Safely clone an object, replacing non-cloneable values
function safeClone(obj: unknown, seen = new WeakSet()): unknown {
  // Handle primitives
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;

  // Handle functions - convert to string representation
  if (typeof obj === 'function') {
    return `[Function: ${obj.name || 'anonymous'}]`;
  }

  // Handle DOM elements
  if (obj instanceof Element) {
    return `[${obj.tagName.toLowerCase()}${obj.id ? '#' + obj.id : ''}${obj.className ? '.' + obj.className.split(' ').join('.') : ''}]`;
  }

  // Handle other non-cloneable objects
  if (obj instanceof Window || obj instanceof Document) {
    return '[Window/Document]';
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => safeClone(item, seen));
  }

  // Handle objects
  if (typeof obj === 'object') {
    // Avoid circular references
    if (seen.has(obj as object)) {
      return '[Circular]';
    }
    seen.add(obj as object);

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      try {
        result[key] = safeClone(value, seen);
      } catch {
        result[key] = '[Non-cloneable]';
      }
    }
    return result;
  }

  return String(obj);
}

// Send event to content script
function emitEvent(event: Record<string, unknown>, source: string, dataLayerIndex: number): void {
  // Safely clone the event data to avoid DataCloneError
  const safeData = safeClone(event) as Record<string, unknown>;

  const payload = {
    id: generateId(),
    timestamp: Date.now(),
    event: event.event as string,
    data: safeData,
    source,
    raw: safeData,
    dataLayerIndex,
  };

  try {
    window.postMessage(
      {
        type: 'DATALAYER_MONITOR_EVENT',
        payload,
      },
      '*'
    );
  } catch (e) {
    // If still failing, try with minimal data
    console.warn('[DataLayer Monitor] Failed to send event, using minimal data:', e);
    window.postMessage(
      {
        type: 'DATALAYER_MONITOR_EVENT',
        payload: {
          id: payload.id,
          timestamp: payload.timestamp,
          event: payload.event,
          data: { event: payload.event, _error: 'Data could not be cloned' },
          source,
          raw: { event: payload.event },
          dataLayerIndex,
        },
      },
      '*'
    );
  }

  // Only log to console if enabled
  if (consoleLoggingEnabled) {
    const eventName = event.event as string;
    const title = `%c📊 ${source}%c ${eventName}`;
    console.groupCollapsed(
      title,
      'background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
      'color: #22d3ee; font-weight: bold;'
    );
    console.log('%cEvent Data:', 'color: #10b981; font-weight: bold;');
    console.log(event);
    console.log('%cTimestamp:', 'color: #64748b;', new Date().toLocaleTimeString());
    console.groupEnd();
  }
}

// Wrap a dataLayer's push method
function wrapDataLayer(name: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;

  // Ensure the array exists
  win[name] = win[name] || [];
  const dataLayer = win[name] as unknown[];

  // Check if already wrapped
  if (monitoredLayers.has(name)) {
    if (consoleLoggingEnabled) {
      console.log(`%c[DataLayer Monitor] Already monitoring ${name}`, 'color: #f59e0b;');
    }
    return;
  }

  // Initialize the length tracker for this dataLayer
  dataLayerLengths.set(name, dataLayer.length);

  // Save original push
  const originalPush = dataLayer.push.bind(dataLayer);

  // Create wrapped push
  dataLayer.push = function (...args: unknown[]): number {
    // Get current index before push
    const currentLength = dataLayerLengths.get(name) || dataLayer.length;

    const result = originalPush(...args);

    // Check each pushed item and assign index
    let index = currentLength;
    for (const item of args) {
      if (isValidEvent(item)) {
        emitEvent(item, name, index);
      }
      index++;
    }

    // Update tracked length
    dataLayerLengths.set(name, dataLayer.length);

    return result;
  };

  monitoredLayers.set(name, { name, originalPush });

  // Process existing events in the dataLayer with their original indices
  for (let i = 0; i < dataLayer.length; i++) {
    const item = dataLayer[i];
    if (isValidEvent(item)) {
      emitEvent(item, name, i);
    }
  }

  if (consoleLoggingEnabled) {
    console.log(
      `%c[DataLayer Monitor] %cNow monitoring %c${name}%c (${dataLayer.length} existing events)`,
      'background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2px 8px; border-radius: 4px;',
      'color: #e2e8f0;',
      'color: #22d3ee; font-weight: bold;',
      'color: #64748b;'
    );
  }
}

// Unwrap a dataLayer's push method
function unwrapDataLayer(name: string): void {
  const monitored = monitoredLayers.get(name);
  if (!monitored) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  const dataLayer = win[name] as unknown[];

  if (dataLayer) {
    dataLayer.push = monitored.originalPush;
  }

  monitoredLayers.delete(name);

  if (consoleLoggingEnabled) {
    console.log(
      `%c[DataLayer Monitor] %cStopped monitoring %c${name}`,
      'background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px;',
      'color: #e2e8f0;',
      'color: #f87171; font-weight: bold;'
    );
  }
}

// Update monitored dataLayers based on config
function updateMonitoring(config: DataLayerMonitorConfig): void {
  const { dataLayerNames, consoleLogging } = config;

  // Update console logging setting
  consoleLoggingEnabled = consoleLogging ?? false;

  const currentNames = new Set(monitoredLayers.keys());
  const newNames = new Set(dataLayerNames);

  // Unwrap removed layers
  for (const name of currentNames) {
    if (!newNames.has(name)) {
      unwrapDataLayer(name);
    }
  }

  // Wrap new layers
  for (const name of newNames) {
    if (!currentNames.has(name)) {
      wrapDataLayer(name);
    }
  }
}

// Listen for messages from content script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data || typeof event.data !== 'object') return;

  const { type, payload } = event.data;

  switch (type) {
    case 'DATALAYER_MONITOR_INIT':
      updateMonitoring(payload as DataLayerMonitorConfig);
      break;
    case 'DATALAYER_MONITOR_UPDATE_CONFIG':
      updateMonitoring(payload as DataLayerMonitorConfig);
      break;
    case 'DATALAYER_MONITOR_STOP':
      for (const name of monitoredLayers.keys()) {
        unwrapDataLayer(name);
      }
      break;
  }
});

// Mark as installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any)[EXTENSION_ID] = {
  version: '1.0.0',
  monitoredLayers: () => Array.from(monitoredLayers.keys()),
};

// Notify that we're ready
window.postMessage({ type: 'DATALAYER_MONITOR_READY' }, '*');
