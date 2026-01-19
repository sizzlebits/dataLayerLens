/**
 * Overlay script that runs in MAIN world to access customElements.
 * Communicates with content.js (ISOLATED world) via postMessage.
 *
 * This script is loaded on every page but only activates when
 * the content script requests to create the overlay.
 */

import type { DataLayerEvent, Settings } from '@/types';
import type { DLOverlayContainer } from '@/content/overlay/components/DLOverlayContainer';

// Message types for communication between ISOLATED and MAIN worlds
interface CreateOverlayPayload {
  settings: Settings;
  events: DataLayerEvent[];
}

interface UpdateEventsPayload {
  events: DataLayerEvent[];
}

interface UpdateSettingsPayload {
  settings: Settings;
}

interface SetCollapsedPayload {
  collapsed: boolean;
}

// Overlay state
let overlayRoot: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let overlayContainer: DLOverlayContainer | null = null;
let interactionTime = 0;
let componentsRegistered = false;
let eventBlockingSetup = false;

/**
 * Send a message back to the content script (ISOLATED world).
 */
function sendToContent(type: string, payload?: unknown): void {
  try {
    window.postMessage({
      type,
      source: 'datalayer-lens-overlay',
      payload,
    }, '*');
  } catch {
    // Silently fail if postMessage fails
  }
}

/**
 * Set up document-level event interception for overlay interactions.
 * This prevents tracking scripts from capturing clicks on the overlay.
 * Only called once when creating the overlay.
 */
function setupEventBlocking(): void {
  if (eventBlockingSetup) return;
  eventBlockingSetup = true;

  const eventsToBlock = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'];

  eventsToBlock.forEach(eventType => {
    document.addEventListener(eventType, (e: Event) => {
      try {
        const path = e.composedPath();
        const isFromOverlay = path.some(
          (el) => el instanceof Element && el.id === 'datalayer-monitor-root'
        );

        if (isFromOverlay) {
          e.stopImmediatePropagation();
          interactionTime = Date.now();
        }
      } catch {
        // Ignore errors in event handling
      }
    }, true);
  });
}

/**
 * Register Web Components lazily - only when needed.
 */
async function ensureComponentsRegistered(): Promise<boolean> {
  if (componentsRegistered) return true;

  // Check if customElements is available
  if (typeof customElements === 'undefined' || customElements === null) {
    console.warn('[DataLayer Lens Overlay] customElements not available');
    return false;
  }

  try {
    const { registerComponents } = await import('@/content/overlay/components');
    registerComponents();
    componentsRegistered = true;
    return true;
  } catch (e) {
    console.error('[DataLayer Lens Overlay] Failed to register components:', e);
    return false;
  }
}

/**
 * Create the overlay.
 */
async function createOverlay(settings: Settings, events: DataLayerEvent[]): Promise<void> {
  if (overlayRoot) return;

  // Wait for document.body to be available
  if (!document.body) {
    await new Promise<void>(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      } else {
        resolve();
      }
    });
  }

  // Register Web Components lazily
  const registered = await ensureComponentsRegistered();
  if (!registered) {
    sendToContent('OVERLAY_ERROR', { error: 'Failed to register components' });
    return;
  }

  // Set up event blocking now that we have a document
  setupEventBlocking();

  // Create the overlay root element
  overlayRoot = document.createElement('div');
  overlayRoot.id = 'datalayer-monitor-root';
  overlayRoot.style.cssText = `
    all: initial;
    position: fixed;
    z-index: 2147483647;
    pointer-events: none;
  `;

  // Attach shadow DOM
  shadowRoot = overlayRoot.attachShadow({ mode: 'open' });

  // Add styles for the shadow root
  const styles = document.createElement('style');
  styles.textContent = `
    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
    }

    dl-overlay-container {
      pointer-events: auto;
    }
  `;
  shadowRoot.appendChild(styles);

  // Create the overlay container Web Component
  overlayContainer = document.createElement('dl-overlay-container') as DLOverlayContainer;
  overlayContainer.settings = settings;
  overlayContainer.events = events;
  shadowRoot.appendChild(overlayContainer);

  // Track interactions
  ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach(eventType => {
    overlayRoot!.addEventListener(eventType, () => {
      interactionTime = Date.now();
    });
  });

  // Attach event listeners
  attachEventListeners();

  // Add to document
  document.body.appendChild(overlayRoot);

  // Notify content script that overlay is ready
  sendToContent('OVERLAY_READY');
}

/**
 * Destroy the overlay.
 */
function destroyOverlay(): void {
  if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
    shadowRoot = null;
    overlayContainer = null;
  }
}

/**
 * Update the overlay with new events.
 */
function updateEvents(events: DataLayerEvent[]): void {
  if (overlayContainer) {
    overlayContainer.events = events;
  }
}

/**
 * Update the overlay with new settings.
 */
function updateSettings(settings: Settings): void {
  if (overlayContainer) {
    overlayContainer.settings = settings;
  }
}

/**
 * Set the collapsed state.
 */
function setCollapsed(collapsed: boolean): void {
  if (overlayContainer) {
    overlayContainer.collapsed = collapsed;
  }
}

/**
 * Open the filter modal.
 */
function openFilterModal(): void {
  if (overlayContainer) {
    overlayContainer.openFilterModal();
  }
}

/**
 * Close the filter modal.
 */
function closeFilterModal(): void {
  if (overlayContainer) {
    overlayContainer.closeFilterModal();
  }
}

/**
 * Check if overlay exists.
 */
function overlayExists(): boolean {
  return overlayRoot !== null;
}

/**
 * Check if a recent interaction was from the overlay.
 */
function wasRecentOverlayInteraction(withinMs: number = 100): boolean {
  return Date.now() - interactionTime < withinMs;
}

/**
 * Attach event listeners to the overlay container to relay events back to content script.
 */
function attachEventListeners(): void {
  if (!overlayContainer) return;

  // Close overlay
  overlayContainer.addEventListener('overlay-close', () => {
    sendToContent('OVERLAY_CLOSE');
  });

  // Clear events
  overlayContainer.addEventListener('clear-events', () => {
    sendToContent('OVERLAY_CLEAR_EVENTS');
  });

  // Collapse toggle
  overlayContainer.addEventListener('collapse-toggle', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    sendToContent('OVERLAY_COLLAPSE_TOGGLE', { collapsed: detail.collapsed });
  });

  // Grouping toggle
  overlayContainer.addEventListener('grouping-toggle', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    sendToContent('OVERLAY_GROUPING_TOGGLE', { enabled: detail.enabled });
  });

  // Persist toggle
  overlayContainer.addEventListener('persist-toggle', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    sendToContent('OVERLAY_PERSIST_TOGGLE', { enabled: detail.enabled });
  });

  // Resize
  overlayContainer.addEventListener('resize', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    sendToContent('OVERLAY_RESIZE', { height: detail.height });
  });

  // Filter add
  overlayContainer.addEventListener('filter-add', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const filter = detail.filter || detail.eventName;
    const mode = detail.mode || 'exclude';
    sendToContent('OVERLAY_FILTER_ADD', { filter, mode });
  });

  // Filter remove
  overlayContainer.addEventListener('filter-remove', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const filter = detail.filter || detail.name;
    sendToContent('OVERLAY_FILTER_REMOVE', { filter });
  });

  // Filter mode change
  overlayContainer.addEventListener('filter-mode-change', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    sendToContent('OVERLAY_FILTER_MODE_CHANGE', { mode: detail.mode, clearFilters: detail.clearFilters });
  });

  // Copy event
  overlayContainer.addEventListener('event-copy', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    sendToContent('OVERLAY_COPY_EVENT', { event: detail.event });
  });
}

/**
 * Handle messages from the content script.
 */
function handleMessage(event: MessageEvent): void {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const message = event.data;

  // Only process messages from our content script
  // Guard against null/undefined and non-object messages
  if (message === null || message === undefined || typeof message !== 'object') return;
  if (message.source !== 'datalayer-lens-content') return;

  switch (message.type) {
    case 'CREATE_OVERLAY': {
      const payload = message.payload as CreateOverlayPayload;
      createOverlay(payload.settings, payload.events).catch(e => {
        console.error('[DataLayer Lens Overlay] Error creating overlay:', e);
        sendToContent('OVERLAY_ERROR', { error: String(e) });
      });
      break;
    }

    case 'DESTROY_OVERLAY':
      destroyOverlay();
      break;

    case 'UPDATE_EVENTS': {
      const payload = message.payload as UpdateEventsPayload;
      updateEvents(payload.events);
      break;
    }

    case 'UPDATE_SETTINGS': {
      const payload = message.payload as UpdateSettingsPayload;
      updateSettings(payload.settings);
      break;
    }

    case 'SET_COLLAPSED': {
      const payload = message.payload as SetCollapsedPayload;
      setCollapsed(payload.collapsed);
      break;
    }

    case 'OPEN_FILTER_MODAL':
      openFilterModal();
      break;

    case 'CLOSE_FILTER_MODAL':
      closeFilterModal();
      break;

    case 'CHECK_OVERLAY_EXISTS':
      sendToContent('OVERLAY_EXISTS', { exists: overlayExists() });
      break;

    case 'CHECK_OVERLAY_READY':
      // Content script is asking if we're ready - respond that we are
      sendToContent('OVERLAY_SCRIPT_LOADED');
      break;

    case 'CHECK_RECENT_INTERACTION': {
      const payload = message.payload as { withinMs?: number };
      sendToContent('OVERLAY_RECENT_INTERACTION', {
        wasRecent: wasRecentOverlayInteraction(payload?.withinMs),
      });
      break;
    }
  }
}

// Initialize - just set up message listener, nothing else
// All heavy initialization is deferred until CREATE_OVERLAY is received
try {
  window.addEventListener('message', handleMessage);
  // Notify content script that overlay script is loaded and ready to receive messages
  sendToContent('OVERLAY_SCRIPT_LOADED');
} catch {
  // Silently fail if initialization fails - don't crash the page
}
