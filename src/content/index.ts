/**
 * Content script that bridges the injected page script and the extension.
 * Handles overlay rendering, event grouping, persistence, and message passing.
 */


import {
  DataLayerEvent,
  EventGroup,
  Settings,
  DEFAULT_SETTINGS,
  DEFAULT_GROUPING,
  getCurrentDomain,
} from '@/types';

// Feature flag for Web Components overlay
// When true, uses MAIN world overlay script for Web Components (customElements access)
// When false, uses legacy inline HTML in ISOLATED world
// NOTE: Web Components overlay disabled due to CSP/MAIN world injection issues
// Using sidebar panel instead for a better experience
const USE_WEB_COMPONENTS_OVERLAY = false;

// Type for the overlay bridge that communicates with MAIN world
type OverlayBridgeType = import('./modules/overlay').OverlayBridge;
type OverlayCallbacksType = import('./modules/overlay').OverlayCallbacks;

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Track if extension context is still valid
let extensionContextValid = true;

// Check if extension context is still valid
function isExtensionContextValid(): boolean {
  try {
    // Accessing runtime.id will throw if context is invalidated
    return extensionContextValid && !!browserAPI.runtime?.id;
  } catch {
    extensionContextValid = false;
    return false;
  }
}

// Safe wrapper for runtime.sendMessage that handles invalidated context
function safeSendMessage(message: unknown): Promise<unknown> {
  if (!isExtensionContextValid()) {
    return Promise.resolve(undefined);
  }
  return browserAPI.runtime.sendMessage(message).catch((error: Error) => {
    // Check if error is due to invalidated context
    if (error?.message?.includes('Extension context invalidated')) {
      extensionContextValid = false;
      console.debug('[DataLayer Lens] Extension context invalidated - please reload the page');
    }
    // Ignore other errors (no listeners, etc.)
  });
}

// Current domain for per-domain settings
const currentDomain = getCurrentDomain();

let currentSettings: Settings = DEFAULT_SETTINGS;

function debugError(...args: unknown[]): void {
  if (currentSettings.debugLogging) {
    console.error('[DataLayer Lens]', ...args);
  }
}

// Legacy variables - kept for compatibility when not using Web Components
let overlayRoot: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

// Track when user is interacting with our overlay to filter out those events
let overlayInteractionTime = 0;
const INTERACTION_DEBOUNCE_MS = 100; // Ignore events within 100ms of overlay interaction

// Web Components overlay bridge (communicates with MAIN world overlay script)
let overlayBridge: OverlayBridgeType | null = null;

// Create overlay callbacks that wire up to existing state management
function createOverlayCallbacks(): OverlayCallbacksType {
  return {
    onClose: () => {
      currentSettings.overlayEnabled = false;
      saveSettingsToStorage();
      destroyOverlay();
    },
    onClearEvents: () => {
      events.length = 0;
      eventGroups.length = 0;
      currentGroupId = null;
      lastEventTime = 0;
      expandedEventIds.clear();
      expandedGroupIds.clear();
      clearPersistedEvents();
      updateOverlayEvents();
      notifyDevTools();
    },
    onCollapseToggle: (collapsed: boolean) => {
      currentSettings.overlayCollapsed = collapsed;
      saveSettingsToStorage();
    },
    onGroupingToggle: (enabled: boolean) => {
      currentSettings.grouping.enabled = enabled;
      saveSettingsToStorage();
      if (enabled) {
        rebuildEventGroups();
      }
      updateOverlayEvents();
    },
    onPersistToggle: (enabled: boolean) => {
      currentSettings.persistEvents = enabled;
      saveSettingsToStorage();
      if (enabled) {
        savePersistedEvents();
      }
    },
    onResize: (height: number) => {
      currentSettings.overlayHeight = height;
      saveSettingsToStorage();
    },
    onFilterAdd: (filter: string, mode: 'include' | 'exclude') => {
      if (currentSettings.filterMode !== mode) {
        currentSettings.eventFilters = [];
        currentSettings.filterMode = mode;
      }
      if (!currentSettings.eventFilters.includes(filter)) {
        currentSettings.eventFilters.push(filter);
      }
      saveSettingsToStorage();
      updateOverlayEvents();
      safeSendMessage({
        type: 'SETTINGS_CHANGED',
        payload: currentSettings,
      });
    },
    onFilterRemove: (filter: string) => {
      currentSettings.eventFilters = currentSettings.eventFilters.filter(f => f !== filter);
      saveSettingsToStorage();
      updateOverlayEvents();
      safeSendMessage({
        type: 'SETTINGS_CHANGED',
        payload: currentSettings,
      });
    },
    onFilterModeChange: (mode: 'include' | 'exclude', clearFilters: boolean) => {
      currentSettings.filterMode = mode;
      if (clearFilters) {
        currentSettings.eventFilters = [];
      }
      saveSettingsToStorage();
      updateOverlayEvents();
      safeSendMessage({
        type: 'SETTINGS_CHANGED',
        payload: currentSettings,
      });
    },
    onCopyEvent: (event: DataLayerEvent) => {
      const eventData = {
        event: event.event,
        ...event.data,
      };
      navigator.clipboard.writeText(JSON.stringify(eventData, null, 2)).catch(() => {
        debugError('Failed to copy to clipboard');
      });
    },
  };
}

// Helper to update overlay with current events (Web Components mode)
function updateOverlayEvents(): void {
  if (USE_WEB_COMPONENTS_OVERLAY && overlayBridge) {
    overlayBridge.updateSettings(currentSettings);
    overlayBridge.updateEvents(getAllFilteredEvents());
  } else {
    updateEventsList();
  }
}

// Helper to destroy overlay
function destroyOverlay(): void {
  if (USE_WEB_COMPONENTS_OVERLAY && overlayBridge) {
    overlayBridge.destroy();
    overlayBridge = null;
  } else if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
    shadowRoot = null;
  }
}

// Track whether we've detected any dataLayer activity
let hasDataLayerActivity = false;

// Set up document-level event interception as early as possible
// This runs before tracking scripts can register their listeners
const setupEventBlocking = () => {
  const eventsToBlock = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'];

  eventsToBlock.forEach(eventType => {
    // Use capture phase with highest priority
    document.addEventListener(eventType, (e: Event) => {
      // Check if event is from our overlay
      const path = e.composedPath();
      const isFromOverlay = path.some(
        (el) => el instanceof Element && el.id === 'datalayer-monitor-root'
      );

      if (isFromOverlay) {
        // Stop the event from reaching any other listeners
        e.stopImmediatePropagation();

        // For click and mousedown events, dispatch custom events to our shadow DOM
        if ((eventType === 'click' || eventType === 'mousedown') && shadowRoot) {
          const target = path[0] as HTMLElement;
          if (target) {
            const customEventName = eventType === 'click' ? 'overlay-click' : 'overlay-mousedown';
            const mouseEvent = e as MouseEvent;
            const customEvent = new CustomEvent(customEventName, {
              bubbles: true,
              detail: {
                originalTarget: target,
                clientX: mouseEvent.clientX,
                clientY: mouseEvent.clientY
              }
            });
            target.dispatchEvent(customEvent);
          }
        }
      }
    }, true); // Capture phase
  });
};

// Run immediately
setupEventBlocking();

// Store events for this tab
const events: DataLayerEvent[] = [];

// Event groups for grouped display
const eventGroups: EventGroup[] = [];
let currentGroupId: string | null = null;
let lastEventTime = 0;

// Track expanded events/groups to preserve state
const expandedEventIds = new Set<string>();
const expandedGroupIds = new Set<string>();

// Current filter value (transient, not saved)
let currentFilter = '';

// Pagination state
let currentPage = 0;
let eventsPerPage = 50;

// Filter modal state
let filterModalSearch = '';

// Render optimization
let renderScheduled = false;
let lastRenderTime = 0;
const RENDER_DEBOUNCE_MS = 16; // ~60fps

// Common event types for suggestions
const COMMON_EVENTS = [
  'gtm.js', 'gtm.dom', 'gtm.load', 'gtm.click', 'gtm.linkClick', 'gtm.formSubmit',
  'gtm.historyChange', 'gtm.scrollDepth', 'gtm.timer', 'gtm.video',
  'page_view', 'view_item', 'view_item_list', 'select_item', 'add_to_cart',
  'remove_from_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info',
  'purchase', 'refund', 'view_promotion', 'select_promotion', 'sign_up', 'login',
  'search', 'share', 'select_content', 'generate_lead', 'exception',
];

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Inject the page script
function injectScript(): void {
  const script = document.createElement('script');
  script.src = browserAPI.runtime.getURL('injected.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// Initialize monitoring with current settings
function initializeMonitoring(): void {
  window.postMessage(
    {
      type: 'DATALAYER_MONITOR_INIT',
      payload: {
        dataLayerNames: currentSettings.dataLayerNames,
        consoleLogging: currentSettings.consoleLogging,
      },
    },
    '*'
  );
}

// Update monitoring config
function updateMonitoringConfig(): void {
  window.postMessage(
    {
      type: 'DATALAYER_MONITOR_UPDATE_CONFIG',
      payload: {
        dataLayerNames: currentSettings.dataLayerNames,
        consoleLogging: currentSettings.consoleLogging,
      },
    },
    '*'
  );
}

// Load persisted events from storage
async function loadPersistedEvents(): Promise<void> {
  if (!currentSettings.persistEvents) return;

  try {
    const key = `persisted_events_${currentDomain}`;
    const result = await browserAPI.storage.local.get(key);
    const persisted = result[key];

    if (persisted?.events?.length > 0) {
      const maxAge = currentSettings.persistEventsMaxAge;
      const now = Date.now();

      // Filter out expired events
      const validEvents = maxAge > 0
        ? persisted.events.filter((e: DataLayerEvent) => now - e.timestamp < maxAge)
        : persisted.events;

      if (validEvents.length > 0) {
        // Mark persisted events
        validEvents.forEach((e: DataLayerEvent) => {
          e.source = `${e.source} (persisted)`;
        });

        // Add to events array (at the end, as they're older)
        events.push(...validEvents);

        // Rebuild groups if grouping is enabled
        if (currentSettings.grouping.enabled) {
          rebuildEventGroups();
        }

        updateEventsList();
        notifyDevTools();
      }
    }
  } catch (error) {
    debugError(' Failed to load persisted events:', error);
  }
}

// Save events to persistent storage
async function savePersistedEvents(): Promise<void> {
  if (!currentSettings.persistEvents) return;

  try {
    const key = `persisted_events_${currentDomain}`;
    // Save all events, but strip "(persisted)" marker to avoid double-marking on next load
    const eventsToSave = events.map(e => ({
      ...e,
      source: e.source.replace(' (persisted)', '').replace('(persisted)', ''),
    }));

    await browserAPI.storage.local.set({
      [key]: {
        events: eventsToSave.slice(0, currentSettings.maxEvents),
        lastUpdated: Date.now(),
      },
    });
  } catch (error) {
    debugError(' Failed to save persisted events:', error);
  }
}

// Clear persisted events
async function clearPersistedEvents(): Promise<void> {
  try {
    const key = `persisted_events_${currentDomain}`;
    await browserAPI.storage.local.remove(key);
  } catch (error) {
    debugError(' Failed to clear persisted events:', error);
  }
}

// Determine if a new group should start
function shouldStartNewGroup(event: DataLayerEvent): boolean {
  const { grouping } = currentSettings;

  if (!grouping.enabled) return false;

  if (grouping.mode === 'time') {
    // Start new group if time since last event exceeds window
    return event.timestamp - lastEventTime > grouping.timeWindowMs;
  } else {
    // Start new group if this is a trigger event
    return grouping.triggerEvents.some(
      trigger => event.event.toLowerCase().includes(trigger.toLowerCase())
    );
  }
}

// Add event to appropriate group
function addEventToGroup(event: DataLayerEvent): void {
  const { grouping } = currentSettings;

  if (!grouping.enabled) {
    event.groupId = undefined;
    return;
  }

  if (shouldStartNewGroup(event) || !currentGroupId) {
    // Create new group
    const group: EventGroup = {
      id: generateId(),
      events: [event],
      startTime: event.timestamp,
      endTime: event.timestamp,
      triggerEvent: grouping.mode === 'event' ? event.event : undefined,
      collapsed: false,
    };
    eventGroups.unshift(group);
    currentGroupId = group.id;
    event.groupId = group.id;
  } else {
    // Add to existing group
    const group = eventGroups.find(g => g.id === currentGroupId);
    if (group) {
      group.events.unshift(event);
      group.endTime = event.timestamp;
      event.groupId = group.id;
    }
  }

  lastEventTime = event.timestamp;
}

// Rebuild all event groups (used when loading persisted events)
function rebuildEventGroups(): void {
  eventGroups.length = 0;
  currentGroupId = null;
  lastEventTime = 0;

  // Process events in chronological order (oldest first)
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  sortedEvents.forEach(event => {
    addEventToGroup(event);
  });

  // Reverse groups so newest is first
  eventGroups.reverse();
}

// Create shadow DOM container for overlay
async function createOverlayContainer(): Promise<void> {
  // Use Web Components via MAIN world bridge if feature flag is enabled
  if (USE_WEB_COMPONENTS_OVERLAY) {
    if (overlayBridge) return;

    try {
      // Import and create the bridge that communicates with MAIN world overlay script
      const { OverlayBridge } = await import('./modules/overlay');
      overlayBridge = new OverlayBridge(createOverlayCallbacks());
      await overlayBridge.create(currentSettings, getAllFilteredEvents());
      return;
    } catch (error) {
      // Fall through to legacy implementation
      console.warn('[DataLayer Lens] OverlayBridge failed, falling back to legacy:', error);
    }
  }

  // Legacy inline HTML implementation below
  if (overlayRoot) return;

  overlayRoot = document.createElement('div');
  overlayRoot.id = 'datalayer-monitor-root';
  overlayRoot.style.cssText = `
    all: initial;
    position: fixed;
    z-index: 2147483647;
    pointer-events: none;
  `;

  shadowRoot = overlayRoot.attachShadow({ mode: 'open' });

  // Track when user interacts with overlay so we can filter out resulting dataLayer events
  const root = overlayRoot;
  ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach(eventType => {
    root.addEventListener(eventType, () => {
      overlayInteractionTime = Date.now();
    });
  });

  document.body.appendChild(overlayRoot);

  // Inject styles into shadow DOM
  const styles = document.createElement('style');
  styles.textContent = getOverlayStyles();
  shadowRoot.appendChild(styles);

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'overlay-container';
  overlay.className = 'overlay-container';
  shadowRoot.appendChild(overlay);

  renderOverlayStructure();
  attachOverlayListeners();
  updateEventsList();
}

// Get CSS styles for the overlay
function getOverlayStyles(): string {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .overlay-container {
      position: fixed;
      /* Position is set via JavaScript based on overlayAnchor setting */
      width: 400px;
      max-height: calc(100vh - 32px);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      pointer-events: none; /* Let clicks pass through container */
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      transition: width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                  top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                  bottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                  left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                  right 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .overlay-container .overlay {
      pointer-events: auto; /* Only the actual overlay captures clicks */
    }

    .overlay-container .filter-modal-backdrop {
      pointer-events: auto; /* Modal backdrop needs to capture clicks */
    }

    .overlay-container.collapsed {
      height: auto !important;
    }

    .overlay-container.minimized {
      width: auto;
      height: auto !important;
    }

    .overlay-container.minimized:hover {
      width: auto;
    }

    /* Resize handle - floats outside overlay, position set via JS based on anchor */
    .resize-handle {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 18px;
      cursor: ns-resize;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      z-index: 10;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      pointer-events: auto; /* Ensure resize handle can receive clicks */
    }

    .resize-handle.top {
      top: -14px;
      bottom: auto;
    }

    .resize-handle.bottom {
      top: auto;
      bottom: -14px;
    }

    .overlay:hover .resize-handle,
    .resize-handle.dragging {
      opacity: 1;
    }

    .resize-handle::before,
    .resize-handle::after {
      content: '';
      width: 24px;
      height: 3px;
      background: rgba(99, 102, 241, 0.8);
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    }

    .resize-handle:hover::before,
    .resize-handle:hover::after,
    .resize-handle.dragging::before,
    .resize-handle.dragging::after {
      background: rgba(99, 102, 241, 1);
      width: 30px;
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
    }

    .collapsed .resize-handle,
    .minimized .resize-handle {
      display: none;
    }

    .overlay {
      position: relative;
      background: linear-gradient(145deg, rgba(15, 15, 35, 0.98), rgba(26, 26, 46, 0.98));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 16px;
      box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      overflow: hidden;
      animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      max-height: 100%;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes highlightFade {
      0% {
        background-color: rgba(99, 102, 241, 0.25);
      }
      70% {
        background-color: rgba(99, 102, 241, 0.25);
      }
      100% {
        background-color: transparent;
      }
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
      }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
      border-bottom: 1px solid rgba(99, 102, 241, 0.2);
      cursor: grab;
      user-select: none;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .header:active {
      cursor: grabbing;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      transition: gap 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .logo {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      flex-shrink: 0;
    }

    .logo svg {
      width: 14px;
      height: 14px;
      fill: white;
      stroke: none;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .title {
      font-weight: 600;
      font-size: 13px;
      color: #e2e8f0;
      letter-spacing: -0.01em;
      transition: width 0.2s ease, opacity 0.2s ease;
      white-space: nowrap;
    }

    .event-count {
      background: linear-gradient(135deg, #22d3ee, #10b981);
      color: #0f0f23;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      transition: transform 0.2s ease, width 0.2s ease, opacity 0.2s ease;
      white-space: nowrap;
    }

    .event-count.bump {
      transform: scale(1.2);
    }

    .persist-badge {
      background: rgba(251, 191, 36, 0.2);
      color: #fbbf24;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 6px;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: #94a3b8;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      transform: scale(1.05);
    }

    .action-btn.active {
      background: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }

    .action-btn.danger:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .action-btn svg {
      width: 14px;
      height: 14px;
    }

    .toolbar {
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .filter-input {
      flex: 1;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 11px;
      outline: none;
      transition: all 0.2s ease;
    }

    .filter-input::placeholder {
      color: #64748b;
    }

    .filter-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    .toolbar-btn {
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #94a3b8;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }

    .toolbar-btn.active {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }

    .persist-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .persist-toggle:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .persist-icon {
      color: #64748b;
      transition: color 0.15s ease;
    }

    .persist-toggle.active .persist-icon {
      color: #a5b4fc;
    }

    .persist-toggle-switch {
      width: 28px;
      height: 14px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 7px;
      position: relative;
      transition: background 0.15s ease;
    }

    .persist-toggle.active .persist-toggle-switch {
      background: rgba(99, 102, 241, 0.5);
    }

    .persist-toggle-knob {
      width: 10px;
      height: 10px;
      background: #64748b;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: all 0.15s ease;
    }

    .persist-toggle.active .persist-toggle-knob {
      background: #a5b4fc;
      left: 16px;
    }

    .events-container {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
    }

    .events-container::-webkit-scrollbar {
      width: 6px;
    }

    .events-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .events-container::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.3);
      border-radius: 3px;
    }

    .events-container::-webkit-scrollbar-thumb:hover {
      background: rgba(99, 102, 241, 0.5);
    }

    /* Event Groups */
    .event-group {
      border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(99, 102, 241, 0.08);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .group-header:hover {
      background: rgba(99, 102, 241, 0.12);
    }

    .group-chevron {
      width: 16px;
      height: 16px;
      color: #64748b;
      transition: transform 0.2s ease;
    }

    .event-group.collapsed .group-chevron {
      transform: rotate(-90deg);
    }

    .group-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .group-count {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .group-trigger {
      color: #64748b;
      font-size: 10px;
    }

    .group-time {
      color: #64748b;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
    }

    .group-events {
      display: block;
    }

    .event-group.collapsed .group-events {
      display: none;
    }

    /* Event Items */
    .event-item {
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: background 0.15s ease;
    }

    .event-item:hover {
      background: rgba(99, 102, 241, 0.05);
    }

    .event-item.new {
      animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1), highlightFade 2s ease-out;
    }

    .event-item.grouped {
      padding-left: 30px;
      border-left: 2px solid rgba(99, 102, 241, 0.2);
      margin-left: 14px;
    }

    .event-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .event-icon {
      font-size: 14px;
    }

    .event-name {
      font-weight: 600;
      color: #f8fafc;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .event-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .event-item:hover .event-actions {
      opacity: 1;
    }

    .event-action-btn {
      width: 22px;
      height: 22px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.15s ease;
      font-size: 10px;
    }

    .event-action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }

    .event-action-btn.filter-exclude:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .event-action-btn.filter-include:hover {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
    }

    .event-action-btn.copy-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .event-action-btn.copy-btn.copied {
      background: rgba(34, 197, 94, 0.3);
      color: #4ade80;
    }

    .event-action-btn svg {
      width: 12px;
      height: 12px;
    }

    .expand-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s ease;
    }

    .expand-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }

    .expand-btn svg {
      width: 12px;
      height: 12px;
      transition: transform 0.2s ease;
    }

    .event-item.expanded .expand-btn svg {
      transform: rotate(180deg);
    }

    .event-meta {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .event-time {
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    .event-source {
      font-size: 9px;
      color: #6366f1;
      background: rgba(99, 102, 241, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .event-index {
      opacity: 0.6;
      margin-right: 4px;
    }

    .event-data {
      margin-top: 6px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 10px;
      color: #cbd5e1;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
      display: none;
    }

    .event-item.expanded .event-data {
      display: block;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #64748b;
    }

    .empty-state-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: 13px;
      margin-bottom: 4px;
      color: #94a3b8;
    }

    .empty-state-hint {
      font-size: 11px;
      color: #64748b;
    }

    /* Collapsed state - initial bar view */
    .collapsed .events-container,
    .collapsed .toolbar,
    .collapsed .pagination,
    .collapsed .status-bar {
      display: none;
    }

    .collapsed .header {
      border-bottom: none;
      padding: 6px 10px;
      cursor: pointer;
    }

    .collapsed .header-actions {
      display: none;
    }

    .collapsed .logo {
      width: 28px;
      height: 28px;
    }

    .collapsed .logo svg {
      width: 16px;
      height: 16px;
    }

    .collapsed .header-left .title,
    .collapsed .header-left .event-count {
      opacity: 1;
      transition: opacity 0.2s ease;
    }

    .collapsed .close-collapsed {
      display: flex;
    }

    /* Minimized state - icon only, after delay */
    .collapsed.minimized .overlay {
      /* Squircle border-radius using modern CSS, with circular fallback */
      border-radius: 50%;
      border-radius: 22px; /* Fallback */
    }

    @supports (border-radius: mod(1px, 1px)) {
      .collapsed.minimized .overlay {
        /* True squircle approximation */
        border-radius: 30%;
      }
    }

    .collapsed.minimized .header {
      padding: 6px;
      border-radius: inherit;
    }

    .collapsed.minimized .header-left {
      gap: 0;
    }

    .collapsed.minimized .header-left .title,
    .collapsed.minimized .header-left .event-count {
      width: 0;
      overflow: hidden;
      opacity: 0;
      margin: 0;
      padding: 0;
    }

    .collapsed.minimized .close-collapsed {
      width: 0;
      overflow: hidden;
      opacity: 0;
      margin: 0;
      padding: 0;
    }

    .collapsed.minimized .logo {
      /* Squircle for logo too */
      border-radius: 50%;
      border-radius: 30%;
    }

    /* Hover on minimized - match the first collapsed state styling */
    .collapsed.minimized:hover .overlay {
      border-radius: 16px;
    }

    .collapsed.minimized:hover .header {
      padding: 6px 10px;
      border-radius: 0;
    }

    .collapsed.minimized:hover .header-left {
      gap: 10px;
    }

    .collapsed.minimized:hover .header-left .title,
    .collapsed.minimized:hover .header-left .event-count {
      width: auto;
      opacity: 1;
    }

    .collapsed.minimized:hover .header-left .event-count {
      padding: 2px 8px;
    }

    .collapsed.minimized:hover .close-collapsed {
      width: 18px;
      opacity: 1;
    }

    .collapsed.minimized:hover .logo {
      border-radius: 6px;
    }

    /* Close button for collapsed state */
    .close-collapsed {
      display: flex;
      width: 20px;
      height: 20px;
      border: none;
      background: rgba(239, 68, 68, 0.2);
      border-radius: 4px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      color: #f87171;
      transition: all 0.2s ease, width 0.2s ease, opacity 0.2s ease;
      margin-left: auto;
      flex-shrink: 0;
    }

    .collapsed:not(.minimized) .close-collapsed {
      display: flex;
    }

    .overlay:not(.collapsed) .close-collapsed {
      display: none;
    }

    .close-collapsed:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .close-collapsed svg {
      width: 12px;
      height: 12px;
    }

    .json-key {
      color: #f472b6;
    }

    .json-string {
      color: #22d3ee;
    }

    .json-number {
      color: #fbbf24;
    }

    .json-boolean {
      color: #a78bfa;
    }

    .json-null {
      color: #64748b;
    }

    .status-bar {
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }

    .status-filters {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 500;
    }

    .filter-tag.exclude {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .filter-tag.include {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .filter-tag button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0;
      display: flex;
      opacity: 0.7;
    }

    .filter-tag button:hover {
      opacity: 1;
    }

    .filter-count {
      font-size: 8px;
      opacity: 0.7;
      margin-left: 2px;
    }

    .filter-add-btn {
      width: 18px;
      height: 18px;
      border: 1px dashed rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.1);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #a5b4fc;
      transition: all 0.15s ease;
    }

    .filter-add-btn:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.6);
    }

    .filter-add-btn.no-filters {
      border-style: solid;
      width: auto;
      padding: 0 6px;
      gap: 4px;
    }

    .filter-add-btn svg {
      width: 12px;
      height: 12px;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 10px;
      color: #94a3b8;
    }

    .pagination-btn {
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      flex: 1;
      text-align: center;
    }

    .per-page-select {
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 10px;
      cursor: pointer;
    }

    .per-page-select option {
      background: #1a1a2e;
      color: #e2e8f0;
    }

    /* Filter Modal */
    .filter-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .filter-modal {
      background: linear-gradient(145deg, rgba(15, 15, 35, 0.98), rgba(26, 26, 46, 0.98));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 16px;
      width: 320px;
      max-height: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.2s ease;
    }

    .filter-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .filter-modal-title {
      font-weight: 600;
      font-size: 13px;
      color: #e2e8f0;
    }

    .filter-modal-close {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
    }

    .filter-modal-close:hover {
      color: #e2e8f0;
    }

    .filter-modal-close svg {
      width: 16px;
      height: 16px;
    }

    .filter-mode-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .filter-mode-btn {
      flex: 1;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-mode-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .filter-mode-btn.active.include {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.4);
      color: #4ade80;
    }

    .filter-mode-btn.active.exclude {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .filter-search-container {
      position: relative;
      margin-bottom: 8px;
    }

    .filter-search-input {
      width: 100%;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 11px;
      outline: none;
    }

    .filter-search-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    .filter-suggestions {
      max-height: 200px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
    }

    .filter-suggestion {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .filter-suggestion:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .filter-hint {
      padding: 8px 10px;
      margin-bottom: 8px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px dashed rgba(99, 102, 241, 0.3);
      border-radius: 6px;
      color: #94a3b8;
      font-size: 10px;
      text-align: center;
      line-height: 1.4;
    }

    .filter-suggestion-name {
      color: #e2e8f0;
      font-size: 11px;
    }

    .filter-suggestion-action {
      display: flex;
      gap: 4px;
    }

    .filter-suggestion-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 9px;
      cursor: pointer;
      transition: all 0.1s ease;
    }

    .filter-suggestion-btn.add {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .filter-suggestion-btn.add:hover {
      background: rgba(34, 197, 94, 0.25);
    }

    .filter-suggestion-btn.remove {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .filter-suggestion-btn.remove:hover {
      background: rgba(239, 68, 68, 0.25);
    }

    .filter-custom-add {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: 8px;
    }

    .filter-custom-add input {
      flex: 1;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 10px;
      outline: none;
    }

    .filter-custom-add input:focus {
      border-color: #6366f1;
    }

    .filter-custom-add button {
      padding: 6px 12px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 4px;
      color: #a5b4fc;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-custom-add button:hover {
      background: rgba(99, 102, 241, 0.3);
    }
  `;
}

// Apply position anchor to the overlay container
function applyPositionAnchor(): void {
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('overlay-container');
  if (!container) return;

  const anchor = currentSettings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' };

  // Clear all position styles first
  container.style.top = 'auto';
  container.style.bottom = 'auto';
  container.style.left = 'auto';
  container.style.right = 'auto';

  // Apply the configured anchor position
  if (anchor.vertical === 'top') {
    container.style.top = '16px';
  } else {
    container.style.bottom = '16px';
  }

  if (anchor.horizontal === 'left') {
    container.style.left = '16px';
  } else {
    container.style.right = '16px';
  }

  // Update resize handle position - should be on opposite side of anchor
  const resizeHandle = shadowRoot.getElementById('resize-handle');
  if (resizeHandle) {
    resizeHandle.classList.remove('top', 'bottom');
    // Resize handle goes on opposite side: if anchored bottom, handle at top (and vice versa)
    resizeHandle.classList.add(anchor.vertical === 'bottom' ? 'top' : 'bottom');
  }
}

// Render the static overlay structure (only called once)
function renderOverlayStructure(): void {
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('overlay-container');
  if (!container) return;

  // Apply position anchor settings
  applyPositionAnchor();

  // Apply custom height if set
  if (currentSettings.overlayHeight > 0) {
    container.style.height = `${currentSettings.overlayHeight}px`;
  }

  container.innerHTML = `
    <div class="overlay ${currentSettings.overlayCollapsed ? 'collapsed' : ''}" id="overlay-main">
      <div class="resize-handle" id="resize-handle" title="Drag to resize"></div>
      <div class="header" data-drag-handle data-action="expand-collapsed">
        <div class="header-left">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="4" rx="1"/>
              <rect x="3" y="10" width="18" height="4" rx="1"/>
              <rect x="3" y="17" width="18" height="4" rx="1"/>
            </svg>
          </div>
          <span class="title">DataLayer Lens</span>
          <span class="event-count" id="event-count">0</span>
          <button class="close-collapsed" data-action="close" title="Close overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="header-actions">
          <button class="action-btn ${currentSettings.grouping.enabled ? 'active' : ''}" data-action="toggle-grouping" title="Toggle grouping" id="grouping-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button class="action-btn" data-action="collapse" title="Collapse" id="collapse-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button class="action-btn danger" data-action="clear" title="Clear events">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button class="action-btn danger" data-action="close" title="Close overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="toolbar">
        <input
          type="text"
          class="filter-input"
          placeholder="Filter events..."
          id="filter-input"
        />
        <select class="per-page-select" id="per-page-select" title="Events per page">
          <option value="25">25</option>
          <option value="50" selected>50</option>
          <option value="100">100</option>
          <option value="200">200</option>
        </select>
        <div class="persist-toggle${currentSettings.persistEvents ? ' active' : ''}" data-action="toggle-persist" id="persist-toggle" title="${currentSettings.persistEvents ? 'Persisting events' : 'Persist events across refreshes'}" aria-label="${currentSettings.persistEvents ? 'Persisting events' : 'Persist events across refreshes'}">
          <svg class="persist-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <div class="persist-toggle-switch">
            <div class="persist-toggle-knob"></div>
          </div>
        </div>
      </div>
      <div class="events-container" id="events-container">
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No events captured yet</div>
          <div class="empty-state-hint">Waiting for dataLayer pushes...</div>
        </div>
      </div>
      <div class="pagination" id="pagination" style="display: none;">
        <button class="pagination-btn" data-action="prev-page" disabled>← Prev</button>
        <span class="pagination-info" id="pagination-info">1-50 of 0</span>
        <button class="pagination-btn" data-action="next-page" disabled>Next →</button>
      </div>
      <div class="status-bar" id="status-bar">
        <div class="status-filters" id="status-filters"></div>
        <span id="status-domain">${currentDomain}</span>
      </div>
    </div>
    <div class="filter-modal-backdrop" id="filter-modal-backdrop" style="display: none;">
      <div class="filter-modal" id="filter-modal">
        <div class="filter-modal-header">
          <span class="filter-modal-title">Manage Filters</span>
          <button class="filter-modal-close" data-action="close-filter-modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="filter-mode-toggle">
          <button class="filter-mode-btn include ${currentSettings.filterMode === 'include' ? 'active' : ''}" data-action="set-filter-mode" data-mode="include">
            ✓ Include Only
          </button>
          <button class="filter-mode-btn exclude ${currentSettings.filterMode === 'exclude' ? 'active' : ''}" data-action="set-filter-mode" data-mode="exclude">
            ✗ Exclude
          </button>
        </div>
        <div class="filter-search-container">
          <input type="text" class="filter-search-input" id="filter-modal-search" placeholder="Search events..." />
        </div>
        <div class="filter-suggestions" id="filter-suggestions"></div>
        <div class="filter-custom-add">
          <input type="text" id="filter-custom-input" placeholder="Custom event name..." />
          <button data-action="add-custom-filter">Add</button>
        </div>
      </div>
    </div>
  `;

  // Set up drag
  const overlay = container.querySelector('.overlay') as HTMLElement;
  if (overlay) {
    makeDraggable(overlay);
  }

  updateFilterTags();
}

// Count events matching a filter
function countEventsMatchingFilter(filter: string): number {
  return events.filter(e => e.event.toLowerCase().includes(filter.toLowerCase())).length;
}

// Update filter tags in status bar
function updateFilterTags(): void {
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('status-filters');
  if (!container) return;

  const { eventFilters, filterMode } = currentSettings;

  // Build filter tags HTML with event counts
  const filterTagsHtml = eventFilters.map(filter => {
    const count = countEventsMatchingFilter(filter);
    return `
    <span class="filter-tag ${filterMode}">
      ${filterMode === 'exclude' ? '−' : '+'} ${escapeHtml(filter)}<span class="filter-count">(${count})</span>
      <button data-action="remove-filter" data-filter="${escapeHtml(filter)}" title="Remove filter">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </span>
  `;
  }).join('');

  // Show filter/funnel icon when no filters, + icon when filters exist
  const hasFilters = eventFilters.length > 0;
  const iconSvg = hasFilters
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>`;

  const addButtonHtml = `
    <button class="filter-add-btn${hasFilters ? '' : ' no-filters'}" data-action="open-filter-modal" title="${hasFilters ? 'Add filter' : 'Manage filters'}">
      ${iconSvg}
    </button>
  `;

  container.innerHTML = filterTagsHtml + addButtonHtml;
}

// Update just the event count badge - always shows total events (not filtered)
function updateEventCount(): void {
  if (!shadowRoot) return;
  const countEl = shadowRoot.getElementById('event-count');
  if (!countEl) return;

  // Show total event count (not filtered count)
  const totalCount = events.length;
  countEl.textContent = String(totalCount);

  // Animate bump
  countEl.classList.add('bump');
  setTimeout(() => countEl.classList.remove('bump'), 200);
}

// Update persist toggle switch without full re-render
function updatePersistToggle(): void {
  if (!shadowRoot) return;

  const toggle = shadowRoot.getElementById('persist-toggle');
  if (toggle) {
    toggle.classList.toggle('active', currentSettings.persistEvents);
    const label = currentSettings.persistEvents ? 'Persisting events' : 'Persist events across refreshes';
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-label', label);
  }
}

// Update filter modal suggestions
function updateFilterModalSuggestions(): void {
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('filter-suggestions');
  if (!container) return;

  const { eventFilters } = currentSettings;

  // Get unique events from captured events
  const capturedEventNames = [...new Set(events.map(e => e.event))];

  // Only use common events as fallback when no events have been captured
  const availableEvents = capturedEventNames.length > 0
    ? capturedEventNames
    : COMMON_EVENTS;

  // Filter by search term
  const filtered = filterModalSearch
    ? availableEvents.filter(e => e.toLowerCase().includes(filterModalSearch.toLowerCase()))
    : availableEvents;

  // Sort alphabetically
  const sorted = filtered.sort((a, b) => a.localeCompare(b));

  // Limit to 50 results
  const limited = sorted.slice(0, 50);

  // Show a hint if using fallback events
  const hintHtml = capturedEventNames.length === 0 && !filterModalSearch
    ? `<div class="filter-hint">Common events shown as placeholders. Captured events will appear here once detected.</div>`
    : '';

  container.innerHTML = hintHtml + limited.map(eventName => {
    const isInFilter = eventFilters.includes(eventName);
    const count = countEventsMatchingFilter(eventName);
    return `
      <div class="filter-suggestion">
        <span class="filter-suggestion-name">${escapeHtml(eventName)}<span class="filter-count">(${count})</span></span>
        <div class="filter-suggestion-action">
          ${isInFilter
            ? `<button class="filter-suggestion-btn remove" data-action="remove-filter-modal" data-filter="${escapeHtml(eventName)}">Remove</button>`
            : `<button class="filter-suggestion-btn add" data-action="add-filter-modal" data-filter="${escapeHtml(eventName)}">Add</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

// Open filter modal
function openFilterModal(): void {
  if (!shadowRoot) return;

  filterModalSearch = '';

  const backdrop = shadowRoot.getElementById('filter-modal-backdrop');
  if (backdrop) {
    backdrop.style.display = 'flex';
  }

  // Update mode buttons
  const includeBtn = shadowRoot.querySelector('[data-mode="include"]');
  const excludeBtn = shadowRoot.querySelector('[data-mode="exclude"]');
  if (includeBtn && excludeBtn) {
    includeBtn.classList.toggle('active', currentSettings.filterMode === 'include');
    excludeBtn.classList.toggle('active', currentSettings.filterMode === 'exclude');
  }

  // Clear and focus search
  const searchInput = shadowRoot.getElementById('filter-modal-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }

  updateFilterModalSuggestions();
}

// Close filter modal
function closeFilterModal(): void {
  if (!shadowRoot) return;

  const backdrop = shadowRoot.getElementById('filter-modal-backdrop');
  if (backdrop) {
    backdrop.style.display = 'none';
  }
}

// Update pagination UI
function updatePagination(): void {
  if (!shadowRoot) return;

  const paginationEl = shadowRoot.getElementById('pagination');
  const infoEl = shadowRoot.getElementById('pagination-info');
  const prevBtn = shadowRoot.querySelector('[data-action="prev-page"]') as HTMLButtonElement;
  const nextBtn = shadowRoot.querySelector('[data-action="next-page"]') as HTMLButtonElement;
  const perPageSelect = shadowRoot.getElementById('per-page-select') as HTMLSelectElement;

  if (!paginationEl || !infoEl) return;

  const totalEvents = getAllFilteredEvents().length;
  const totalPages = Math.ceil(totalEvents / eventsPerPage);

  // Show/hide pagination based on event count
  if (totalEvents > eventsPerPage) {
    paginationEl.style.display = 'flex';
  } else {
    paginationEl.style.display = 'none';
    currentPage = 0; // Reset to first page
    return;
  }

  // Ensure current page is valid
  if (currentPage >= totalPages) {
    currentPage = Math.max(0, totalPages - 1);
  }

  const start = currentPage * eventsPerPage + 1;
  const end = Math.min((currentPage + 1) * eventsPerPage, totalEvents);
  infoEl.textContent = `${start}-${end} of ${totalEvents}`;

  if (prevBtn) prevBtn.disabled = currentPage === 0;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
  if (perPageSelect) perPageSelect.value = String(eventsPerPage);
}

// Get all filtered events (no pagination)
function getAllFilteredEvents(): DataLayerEvent[] {
  const { eventFilters, filterMode } = currentSettings;

  let filtered = events;

  // Apply saved filters (include/exclude)
  if (eventFilters.length > 0) {
    if (filterMode === 'include') {
      filtered = filtered.filter(e =>
        eventFilters.some(f => e.event.toLowerCase().includes(f.toLowerCase()))
      );
    } else {
      filtered = filtered.filter(e =>
        !eventFilters.some(f => e.event.toLowerCase().includes(f.toLowerCase()))
      );
    }
  }

  // Apply current search filter
  if (currentFilter) {
    filtered = filtered.filter(e =>
      e.event.toLowerCase().includes(currentFilter.toLowerCase())
    );
  }

  // Don't limit by maxEvents here - that's for storage, not display
  // Pagination handles limiting displayed events
  return filtered;
}

// Get filtered events based on current filter and settings (with pagination)
function getFilteredEvents(): DataLayerEvent[] {
  const allFiltered = getAllFilteredEvents();
  const start = currentPage * eventsPerPage;
  const end = start + eventsPerPage;
  return allFiltered.slice(start, end);
}

// Get filtered groups
function getFilteredGroups(): EventGroup[] {
  const filteredEvents = getFilteredEvents();
  const filteredEventIds = new Set(filteredEvents.map(e => e.id));

  return eventGroups
    .map(group => ({
      ...group,
      events: group.events.filter(e => filteredEventIds.has(e.id)),
    }))
    .filter(group => group.events.length > 0);
}

// Schedule a render update (debounced for performance)
function scheduleRender(): void {
  if (renderScheduled) return;

  const now = performance.now();
  const timeSinceLastRender = now - lastRenderTime;

  if (timeSinceLastRender >= RENDER_DEBOUNCE_MS) {
    // Render immediately if enough time has passed
    performRender();
  } else {
    // Schedule render for next frame
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      performRender();
    });
  }
}

// Perform the actual render
function performRender(): void {
  if (!shadowRoot) return;

  lastRenderTime = performance.now();

  const container = shadowRoot.getElementById('events-container');
  if (!container) return;

  const { grouping } = currentSettings;

  if (grouping.enabled) {
    renderGroupedEvents(container);
  } else {
    renderFlatEvents(container);
  }

  updateEventCount();
  updateFilterTags();
  updatePagination();
}

// Update the events list (public API that schedules render)
function updateEventsList(): void {
  scheduleRender();
}

// Render events in flat list (no grouping) - optimized for performance
function renderFlatEvents(container: HTMLElement): void {
  const filteredEvents = getFilteredEvents();

  if (filteredEvents.length === 0) {
    if (!container.querySelector('.empty-state')) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No events captured yet</div>
          <div class="empty-state-hint">Waiting for dataLayer pushes...</div>
        </div>
      `;
    }
    return;
  }

  // Build HTML string for better performance with large lists
  // Using innerHTML with a single string is faster than many DOM operations
  const htmlParts: string[] = [];

  for (let i = 0; i < filteredEvents.length; i++) {
    const event = filteredEvents[i];
    const category = getEventCategory(event.event);
    const time = new Date(event.timestamp).toLocaleTimeString();
    const isExpanded = expandedEventIds.has(event.id);
    const showTime = currentSettings.showTimestamps;

    htmlParts.push(`
      <div class="event-item${i === 0 && currentPage === 0 ? ' new' : ''}${isExpanded ? ' expanded' : ''}" data-event-id="${escapeHtml(event.id)}">
        <div class="event-header">
          <span class="event-icon">${category.icon}</span>
          <span class="event-name" style="color: ${category.color}">${escapeHtml(event.event)}</span>
          <div class="event-actions">
            <button class="event-action-btn copy-btn" data-action="copy-event" data-event-id="${escapeHtml(event.id)}" title="Copy event to clipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
            <button class="event-action-btn filter-exclude" data-action="filter-exclude" data-event-name="${escapeHtml(event.event)}" title="Hide events like this">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </button>
            <button class="event-action-btn filter-include" data-action="filter-include" data-event-name="${escapeHtml(event.event)}" title="Only show events like this">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
          <button class="expand-btn" data-action="expand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
        <div class="event-meta">
          <span class="event-source">${escapeHtml(event.source)}</span>
          ${showTime ? `<span class="event-time">${time}</span>` : ''}
        </div>
        <div class="event-data">${syntaxHighlight(event.data)}</div>
      </div>
    `);
  }

  container.innerHTML = htmlParts.join('');
}

// Render events grouped - optimized for performance
function renderGroupedEvents(container: HTMLElement): void {
  const filteredGroups = getFilteredGroups();

  if (filteredGroups.length === 0) {
    if (!container.querySelector('.empty-state')) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No events captured yet</div>
          <div class="empty-state-hint">Waiting for dataLayer pushes...</div>
        </div>
      `;
    }
    return;
  }

  // Build HTML string for better performance
  const htmlParts: string[] = [];

  for (const group of filteredGroups) {
    const isCollapsed = expandedGroupIds.has(group.id) ? false : group.collapsed;
    const startTime = new Date(group.startTime).toLocaleTimeString();
    const triggerInfo = group.triggerEvent
      ? `<span class="group-trigger">triggered by ${escapeHtml(group.triggerEvent)}</span>`
      : '';

    const eventsHtml = group.events.map((event, i) => {
      const category = getEventCategory(event.event);
      const time = new Date(event.timestamp).toLocaleTimeString();
      const isExpanded = expandedEventIds.has(event.id);
      const showTime = currentSettings.showTimestamps;

      return `
        <div class="event-item${i === 0 ? ' new' : ''}${isExpanded ? ' expanded' : ''} grouped" data-event-id="${escapeHtml(event.id)}">
          <div class="event-header">
            <span class="event-icon">${category.icon}</span>
            <span class="event-name" style="color: ${category.color}">${escapeHtml(event.event)}</span>
            <div class="event-actions">
              <button class="event-action-btn copy-btn" data-action="copy-event" data-event-id="${escapeHtml(event.id)}" title="Copy event to clipboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="event-action-btn filter-exclude" data-action="filter-exclude" data-event-name="${escapeHtml(event.event)}" title="Hide events like this">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </button>
              <button class="event-action-btn filter-include" data-action="filter-include" data-event-name="${escapeHtml(event.event)}" title="Only show events like this">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
            <button class="expand-btn" data-action="expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
          <div class="event-meta">
            <span class="event-source">${escapeHtml(event.source)}</span>
            ${showTime ? `<span class="event-time">${time}</span>` : ''}
          </div>
          <div class="event-data">${syntaxHighlight(event.data)}</div>
        </div>
      `;
    }).join('');

    htmlParts.push(`
      <div class="event-group${isCollapsed ? ' collapsed' : ''}" data-group-id="${escapeHtml(group.id)}">
        <div class="group-header" data-action="toggle-group">
          <svg class="group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <div class="group-info">
            <span class="group-count">${group.events.length} events</span>
            ${triggerInfo}
          </div>
          <span class="group-time">${startTime}</span>
        </div>
        <div class="group-events">
          ${eventsHtml}
        </div>
      </div>
    `);
  }

  container.innerHTML = htmlParts.join('');
}

// Add a single new event to the top (no full re-render)
function addEventToList(event: DataLayerEvent): void {
  // For Web Components mode, just update the overlay with all filtered events
  if (USE_WEB_COMPONENTS_OVERLAY) {
    updateOverlayEvents();
    return;
  }

  // Legacy implementation below
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('events-container');
  if (!container) return;

  // Check if event passes filters
  const { eventFilters, filterMode, grouping } = currentSettings;
  let passesFilter = true;

  if (eventFilters.length > 0) {
    const matchesFilter = eventFilters.some(f =>
      event.event.toLowerCase().includes(f.toLowerCase())
    );
    passesFilter = filterMode === 'include' ? matchesFilter : !matchesFilter;
  }

  if (currentFilter) {
    passesFilter = passesFilter && event.event.toLowerCase().includes(currentFilter.toLowerCase());
  }

  // Always update filter tags since counts may have changed
  updateFilterTags();

  if (!passesFilter) {
    return; // Event filtered out, don't add to UI
  }

  // Remove empty state if present
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  if (grouping.enabled) {
    // For grouped view, do a full re-render to handle group changes
    updateEventsList();
  } else {
    // Check if we need pagination (more than one page of events)
    const totalFiltered = getAllFilteredEvents().length;
    if (totalFiltered > eventsPerPage) {
      // With pagination active, do a full re-render to properly paginate
      updateEventsList();
    } else {
      // For flat view without pagination, just prepend the new event
      const eventEl = createEventElement(event, true, false);
      container.insertBefore(eventEl, container.firstChild);

      // Remove excess events from bottom based on eventsPerPage
      const eventItems = container.querySelectorAll('.event-item');
      if (eventItems.length > eventsPerPage) {
        for (let i = eventsPerPage; i < eventItems.length; i++) {
          eventItems[i].remove();
        }
      }
    }
  }

  updateEventCount();
  updatePagination();
}

// Create a single event element
function createEventElement(event: DataLayerEvent, isNew: boolean, isGrouped: boolean): HTMLElement {
  const category = getEventCategory(event.event);
  const time = new Date(event.timestamp).toLocaleTimeString();
  const isExpanded = expandedEventIds.has(event.id);
  const showTime = currentSettings.showTimestamps;

  const div = document.createElement('div');
  div.className = `event-item${isNew ? ' new' : ''}${isExpanded ? ' expanded' : ''}${isGrouped ? ' grouped' : ''}`;
  div.dataset.eventId = event.id;

  div.innerHTML = `
    <div class="event-header">
      <span class="event-icon">${category.icon}</span>
      <span class="event-name" style="color: ${category.color}">${escapeHtml(event.event)}</span>
      <div class="event-actions">
        <button class="event-action-btn copy-btn" data-action="copy-event" data-event-id="${escapeHtml(event.id)}" title="Copy event to clipboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="event-action-btn filter-exclude" data-action="filter-exclude" data-event-name="${escapeHtml(event.event)}" title="Hide events like this">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </button>
        <button class="event-action-btn filter-include" data-action="filter-include" data-event-name="${escapeHtml(event.event)}" title="Only show events like this">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
      <button class="expand-btn" data-action="expand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>
    <div class="event-meta">
      <span class="event-source">${event.dataLayerIndex !== undefined ? `<span class="event-index">#${event.dataLayerIndex}</span>` : ''}${escapeHtml(event.source)}</span>
      ${showTime ? `<span class="event-time">${time}</span>` : ''}
    </div>
    <div class="event-data">${syntaxHighlight(event.data)}</div>
  `;

  return div;
}

// Get event category
function getEventCategory(eventName: string): { color: string; icon: string } {
  const categories: Record<string, { color: string; icon: string }> = {
    'gtm.js': { color: '#22d3ee', icon: '🚀' },
    'gtm.dom': { color: '#10b981', icon: '📄' },
    'gtm.load': { color: '#8b5cf6', icon: '✅' },
    'gtm.click': { color: '#f59e0b', icon: '👆' },
    'gtm.linkClick': { color: '#f59e0b', icon: '🔗' },
    'gtm.formSubmit': { color: '#ef4444', icon: '📝' },
    page_view: { color: '#3b82f6', icon: '👁️' },
    view_item: { color: '#8b5cf6', icon: '🛍️' },
    add_to_cart: { color: '#10b981', icon: '🛒' },
    purchase: { color: '#22c55e', icon: '💰' },
  };

  if (categories[eventName]) return categories[eventName];

  const lower = eventName.toLowerCase();
  if (lower.includes('click')) return { color: '#f59e0b', icon: '👆' };
  if (lower.includes('view')) return { color: '#3b82f6', icon: '👁️' };
  if (lower.includes('cart')) return { color: '#10b981', icon: '🛒' };

  return { color: '#64748b', icon: '📌' };
}

// Escape HTML
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Syntax highlight JSON
function syntaxHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

// Attach overlay event listeners (once)
function attachOverlayListeners(): void {
  if (!shadowRoot || !overlayRoot) return;

  const container = shadowRoot.getElementById('overlay-container');
  if (!container) return;

  // Handle clicks via our custom event (which bypasses tracking scripts)
  const handleClick = (target: HTMLElement) => {
    const actionBtn = target.closest('[data-action]') as HTMLElement;
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;

    switch (action) {
      case 'collapse':
        currentSettings.overlayCollapsed = true;
        saveSettingsToStorage();
        updateCollapseState();
        break;

      case 'expand-collapsed':
        // Only expand if currently collapsed (clicking header in collapsed state)
        if (currentSettings.overlayCollapsed) {
          currentSettings.overlayCollapsed = false;
          saveSettingsToStorage();
          updateCollapseState();
        }
        break;

      case 'clear':
        events.length = 0;
        eventGroups.length = 0;
        currentGroupId = null;
        lastEventTime = 0;
        expandedEventIds.clear();
        expandedGroupIds.clear();
        clearPersistedEvents();
        updateEventsList();
        notifyDevTools();
        break;

      case 'close':
        currentSettings.overlayEnabled = false;
        saveSettingsToStorage();
        if (overlayRoot) {
          overlayRoot.remove();
          overlayRoot = null;
          shadowRoot = null;
        }
        break;

      case 'expand': {
        const eventItem = target.closest('.event-item') as HTMLElement;
        if (eventItem) {
          const eventId = eventItem.dataset.eventId;
          if (eventId) {
            if (expandedEventIds.has(eventId)) {
              expandedEventIds.delete(eventId);
              eventItem.classList.remove('expanded');
            } else {
              expandedEventIds.add(eventId);
              eventItem.classList.add('expanded');
            }
          }
        }
        break;
      }

      case 'copy-event': {
        const eventId = actionBtn.dataset.eventId;
        if (eventId) {
          const event = events.find(e => e.id === eventId);
          if (event) {
            const eventData = {
              event: event.event,
              ...event.data,
            };
            navigator.clipboard.writeText(JSON.stringify(eventData, null, 2)).then(() => {
              // Show brief success feedback
              actionBtn.classList.add('copied');
              setTimeout(() => actionBtn.classList.remove('copied'), 1000);
            }).catch(() => {
              // Fallback for older browsers or permission issues
              debugError(' Failed to copy to clipboard');
            });
          }
        }
        break;
      }

      case 'toggle-group': {
        const groupEl = target.closest('.event-group') as HTMLElement;
        if (groupEl) {
          const groupId = groupEl.dataset.groupId;
          if (groupId) {
            // Check current visual state
            const isCurrentlyCollapsed = groupEl.classList.contains('collapsed');
            if (isCurrentlyCollapsed) {
              // Expand it
              expandedGroupIds.add(groupId);
              groupEl.classList.remove('collapsed');
            } else {
              // Collapse it
              expandedGroupIds.delete(groupId);
              groupEl.classList.add('collapsed');
            }
          }
        }
        break;
      }

      case 'toggle-grouping': {
        currentSettings.grouping.enabled = !currentSettings.grouping.enabled;
        saveSettingsToStorage();

        // Update button state
        const btn = shadowRoot?.getElementById('grouping-btn');
        if (btn) {
          btn.classList.toggle('active', currentSettings.grouping.enabled);
        }

        // Rebuild groups if enabling
        if (currentSettings.grouping.enabled) {
          rebuildEventGroups();
        }

        updateEventsList();
        break;
      }

      case 'toggle-persist': {
        currentSettings.persistEvents = !currentSettings.persistEvents;
        saveSettingsToStorage();

        // Update the toggle switch state
        updatePersistToggle();

        // Save current events if enabling
        if (currentSettings.persistEvents) {
          savePersistedEvents();
        }
        break;
      }

      case 'filter-exclude': {
        const eventName = actionBtn.dataset.eventName;
        if (eventName) {
          addToFilter(eventName, 'exclude');
        }
        break;
      }

      case 'filter-include': {
        const eventName = actionBtn.dataset.eventName;
        if (eventName) {
          addToFilter(eventName, 'include');
        }
        break;
      }

      case 'remove-filter': {
        const filter = actionBtn.dataset.filter;
        if (filter) {
          removeFromFilter(filter);
        }
        break;
      }

      // Filter modal actions
      case 'open-filter-modal':
        openFilterModal();
        break;

      case 'close-filter-modal':
        closeFilterModal();
        break;

      case 'set-filter-mode': {
        const mode = actionBtn.dataset.mode as 'include' | 'exclude';
        if (mode && mode !== currentSettings.filterMode) {
          currentSettings.filterMode = mode;
          currentSettings.eventFilters = []; // Clear filters when switching mode
          saveSettingsToStorage();
          updateEventsList();
          updateFilterModalSuggestions();

          // Update mode button states
          const includeBtn = shadowRoot?.querySelector('[data-mode="include"]');
          const excludeBtn = shadowRoot?.querySelector('[data-mode="exclude"]');
          if (includeBtn && excludeBtn) {
            includeBtn.classList.toggle('active', mode === 'include');
            excludeBtn.classList.toggle('active', mode === 'exclude');
          }

          safeSendMessage({
            type: 'SETTINGS_CHANGED',
            payload: currentSettings,
          });
        }
        break;
      }

      case 'add-filter-modal': {
        const filter = actionBtn.dataset.filter;
        if (filter && !currentSettings.eventFilters.includes(filter)) {
          currentSettings.eventFilters.push(filter);
          saveSettingsToStorage();
          updateEventsList();
          updateFilterModalSuggestions();

          safeSendMessage({
            type: 'SETTINGS_CHANGED',
            payload: currentSettings,
          });
        }
        break;
      }

      case 'remove-filter-modal': {
        const filter = actionBtn.dataset.filter;
        if (filter) {
          currentSettings.eventFilters = currentSettings.eventFilters.filter(f => f !== filter);
          saveSettingsToStorage();
          updateEventsList();
          updateFilterModalSuggestions();

          safeSendMessage({
            type: 'SETTINGS_CHANGED',
            payload: currentSettings,
          });
        }
        break;
      }

      case 'add-custom-filter': {
        const customInput = shadowRoot?.getElementById('filter-custom-input') as HTMLInputElement;
        if (customInput && customInput.value.trim()) {
          const filter = customInput.value.trim();
          if (!currentSettings.eventFilters.includes(filter)) {
            currentSettings.eventFilters.push(filter);
            saveSettingsToStorage();
            updateEventsList();
            updateFilterModalSuggestions();
            customInput.value = '';

            safeSendMessage({
              type: 'SETTINGS_CHANGED',
              payload: currentSettings,
            });
          }
        }
        break;
      }

      // Pagination actions
      case 'prev-page':
        if (currentPage > 0) {
          currentPage--;
          updateEventsList();
        }
        break;

      case 'next-page': {
        const totalEvents = getAllFilteredEvents().length;
        const totalPages = Math.ceil(totalEvents / eventsPerPage);
        if (currentPage < totalPages - 1) {
          currentPage++;
          updateEventsList();
        }
        break;
      }
    }
  };

  // Listen for our custom overlay-click event (dispatched by the event blocker)
  container.addEventListener('overlay-click', ((e: CustomEvent) => {
    const target = e.detail.originalTarget as HTMLElement;
    if (target) {
      handleClick(target);
    }
  }) as EventListener);

  // Also listen for regular clicks as fallback (in case blocking isn't active)
  container.addEventListener('click', (e) => {
    handleClick(e.target as HTMLElement);
  });

  // Pagination button handlers - direct listeners for reliability
  const prevPageBtn = shadowRoot.querySelector('[data-action="prev-page"]') as HTMLButtonElement;
  const nextPageBtn = shadowRoot.querySelector('[data-action="next-page"]') as HTMLButtonElement;

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentPage > 0) {
        currentPage--;
        updateEventsList();
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const totalEvents = getAllFilteredEvents().length;
      const totalPages = Math.ceil(totalEvents / eventsPerPage);
      if (currentPage < totalPages - 1) {
        currentPage++;
        updateEventsList();
      }
    });
  }

  // Per-page select change handler
  const perPageSelect = shadowRoot.getElementById('per-page-select') as HTMLSelectElement;
  if (perPageSelect) {
    perPageSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      eventsPerPage = parseInt(perPageSelect.value, 10);
      currentPage = 0; // Reset to first page
      updateEventsList();
    });
  }

  // Filter modal backdrop click to close
  const modalBackdrop = shadowRoot.getElementById('filter-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeFilterModal();
      }
    });
  }

  // Resize handle functionality
  const resizeHandle = shadowRoot.getElementById('resize-handle');
  if (resizeHandle) {
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    const MIN_HEIGHT = 280;
    const MAX_HEIGHT = window.innerHeight - 32;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      e.stopPropagation();

      const anchor = currentSettings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' };

      // Calculate new height based on anchor position
      // If anchored at bottom, dragging handle UP (smaller Y) = taller overlay
      // If anchored at top, dragging handle DOWN (larger Y) = taller overlay
      const deltaY = anchor.vertical === 'bottom'
        ? (startY - e.clientY)  // Handle at top, drag up to grow
        : (e.clientY - startY); // Handle at bottom, drag down to grow

      let newHeight = startHeight + deltaY;

      // Clamp to min/max
      newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));

      container.style.height = `${newHeight}px`;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      e.stopPropagation();
      isResizing = false;
      resizeHandle.classList.remove('dragging');

      // Re-enable text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Remove listeners from window
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);

      // Save the new height
      const currentHeight = container.offsetHeight;
      currentSettings.overlayHeight = currentHeight;
      saveSettingsToStorage();
    };

    const startResize = (clientY: number) => {
      isResizing = true;
      startY = clientY;
      startHeight = container.offsetHeight;
      resizeHandle.classList.add('dragging');

      // Prevent text selection on the page while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';

      // Use window with capture phase to ensure we get events even if blocked elsewhere
      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('mouseup', onMouseUp, true);
    };

    // Listen for our custom overlay-mousedown event (dispatched by event blocker)
    resizeHandle.addEventListener('overlay-mousedown', ((e: CustomEvent) => {
      e.stopPropagation();
      startResize(e.detail.clientY);
    }) as EventListener);

    // Also listen for native mousedown as fallback
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(e.clientY);
    });
  }

  // Filter inputs - use event delegation for robustness
  let filterTimeout: number;
  container.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'filter-input') {
      clearTimeout(filterTimeout);
      filterTimeout = window.setTimeout(() => {
        currentFilter = (target as HTMLInputElement).value.trim();
        currentPage = 0; // Reset to first page when filtering
        updateEventsList();
      }, 150);
    } else if (target.id === 'filter-modal-search') {
      clearTimeout(filterTimeout);
      filterTimeout = window.setTimeout(() => {
        filterModalSearch = (target as HTMLInputElement).value.trim();
        updateFilterModalSuggestions();
      }, 100);
    }
  });
}

// Add event name to filters
function addToFilter(eventName: string, mode: 'include' | 'exclude'): void {
  // If switching modes, clear existing filters
  if (currentSettings.filterMode !== mode) {
    currentSettings.eventFilters = [];
    currentSettings.filterMode = mode;
  }

  // Add to filters if not already present
  if (!currentSettings.eventFilters.includes(eventName)) {
    currentSettings.eventFilters.push(eventName);
  }

  saveSettingsToStorage();
  updateEventsList();

  // Notify popup/devtools of settings change
  safeSendMessage({
    type: 'SETTINGS_CHANGED',
    payload: currentSettings,
  });
}

// Remove filter
function removeFromFilter(filter: string): void {
  currentSettings.eventFilters = currentSettings.eventFilters.filter(f => f !== filter);
  saveSettingsToStorage();
  updateEventsList();

  safeSendMessage({
    type: 'SETTINGS_CHANGED',
    payload: currentSettings,
  });
}

// Timer for minimized state
let minimizeTimer: number | null = null;
const MINIMIZE_DELAY_MS = 1000; // 1 second before shrinking to icon

// Update collapse state without full re-render
function updateCollapseState(): void {
  if (!shadowRoot) return;

  const overlay = shadowRoot.getElementById('overlay-main');
  const collapseBtn = shadowRoot.getElementById('collapse-btn');
  const container = shadowRoot.getElementById('overlay-container');

  if (overlay) {
    if (currentSettings.overlayCollapsed) {
      overlay.classList.add('collapsed');
      overlay.classList.remove('minimized');
      container?.classList.add('collapsed');
      container?.classList.remove('minimized');

      // Clear any existing timer
      if (minimizeTimer) {
        clearTimeout(minimizeTimer);
      }

      // Start timer to minimize to icon after delay
      minimizeTimer = window.setTimeout(() => {
        overlay.classList.add('minimized');
        container?.classList.add('minimized');
      }, MINIMIZE_DELAY_MS);
    } else {
      overlay.classList.remove('collapsed', 'minimized');
      container?.classList.remove('collapsed', 'minimized');

      // Clear minimize timer when expanding
      if (minimizeTimer) {
        clearTimeout(minimizeTimer);
        minimizeTimer = null;
      }

      // Reapply position anchor to restore resize handle position
      applyPositionAnchor();
    }
  }

  if (collapseBtn) {
    collapseBtn.title = currentSettings.overlayCollapsed ? 'Expand' : 'Collapse';
    const svg = collapseBtn.querySelector('polyline');
    if (svg) {
      svg.setAttribute('points', currentSettings.overlayCollapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15');
    }
  }
}

// Make element draggable
function makeDraggable(element: HTMLElement): void {
  const handle = element.querySelector('[data-drag-handle]') as HTMLElement;
  if (!handle) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  handle.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.parentElement!.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    handle.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newX = initialX + dx;
    const newY = initialY + dy;

    const parent = element.parentElement!;
    parent.style.left = `${newX}px`;
    parent.style.top = `${newY}px`;
    parent.style.right = 'auto';
    parent.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';

      // Save position
      const parent = element.parentElement!;
      const rect = parent.getBoundingClientRect();
      currentSettings.overlayPosition = { x: rect.left, y: rect.top };
      saveSettingsToStorage();
    }
  });
}

// Save settings to storage (supports per-domain)
async function saveSettingsToStorage(): Promise<void> {
  try {
    // For now, save to single key. Per-domain support can be added later via popup UI
    await browserAPI.storage.local.set({ datalayer_monitor_settings: currentSettings });
  } catch (error) {
    debugError(' Failed to save settings:', error);
  }
}

// Save overlay enabled state to domain-specific settings
async function saveDomainOverlayEnabled(enabled: boolean): Promise<void> {
  try {
    await browserAPI.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      domain: currentDomain,
      saveGlobal: false, // Save to domain-specific settings
      payload: { overlayEnabled: enabled },
    });
  } catch (error) {
    debugError('Failed to save domain overlay setting:', error);
    // Fallback to global settings
    saveSettingsToStorage();
  }
}

// Notify DevTools panel of event changes
function notifyDevTools(): void {
  safeSendMessage({
    type: 'EVENTS_UPDATED',
    payload: events,
  });
}

// Handle messages from injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data || typeof event.data !== 'object') return;

  const { type, payload } = event.data;

  if (type === 'DATALAYER_MONITOR_EVENT') {
    // Mark that we've detected dataLayer activity
    hasDataLayerActivity = true;

    // Filter out click-related events that were triggered by interacting with our overlay
    const isClickEvent = payload.event?.includes('click') ||
                         payload.event?.includes('intent.gtm') ||
                         payload.data?.event_type === 'click';
    const isFromOverlayInteraction = Date.now() - overlayInteractionTime < INTERACTION_DEBOUNCE_MS;

    if (isClickEvent && isFromOverlayInteraction) {
      return; // Ignore this event - it was triggered by clicking in our overlay
    }

    // Add event to list (newest first)
    events.unshift(payload);

    // Handle grouping
    addEventToGroup(payload);

    // Limit stored events
    if (events.length > currentSettings.maxEvents * 2) {
      events.length = currentSettings.maxEvents * 2;
    }

    // Save to persistence if enabled
    if (currentSettings.persistEvents) {
      savePersistedEvents();
    }

    // Incrementally add to UI (no full re-render for flat view)
    addEventToList(payload);

    // Notify background/devtools
    safeSendMessage({
      type: 'DATALAYER_EVENT',
      payload,
    });
  }

  if (type === 'DATALAYER_MONITOR_READY') {
    initializeMonitoring();
  }
});

// Handle messages from popup/background
browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_EVENTS':
      sendResponse({ events });
      break;
    case 'CLEAR_EVENTS':
      events.length = 0;
      eventGroups.length = 0;
      currentGroupId = null;
      lastEventTime = 0;
      expandedEventIds.clear();
      expandedGroupIds.clear();
      clearPersistedEvents();
      updateOverlayEvents();
      sendResponse({ success: true });
      break;
    case 'TOGGLE_OVERLAY':
      currentSettings.overlayEnabled = message.payload?.enabled ?? !currentSettings.overlayEnabled;
      // Save to domain-specific settings so visibility is per-domain
      saveDomainOverlayEnabled(currentSettings.overlayEnabled);
      if (currentSettings.overlayEnabled) {
        createOverlayContainer();
      } else {
        destroyOverlay();
      }
      sendResponse({ enabled: currentSettings.overlayEnabled });
      break;
    case 'UPDATE_SETTINGS':
      currentSettings = { ...currentSettings, ...message.payload };
      // Merge grouping settings properly
      if (message.payload.grouping) {
        currentSettings.grouping = { ...currentSettings.grouping, ...message.payload.grouping };
      }
      // Merge anchor settings properly
      if (message.payload.overlayAnchor) {
        currentSettings.overlayAnchor = { ...currentSettings.overlayAnchor, ...message.payload.overlayAnchor };
        applyPositionAnchor();
      }
      // Save settings to storage so they persist
      saveSettingsToStorage();
      updateMonitoringConfig();
      if (message.payload.grouping?.enabled !== undefined) {
        rebuildEventGroups();
        // Sync grouping button state (legacy mode only)
        if (!USE_WEB_COMPONENTS_OVERLAY) {
          const groupingBtn = shadowRoot?.getElementById('grouping-btn');
          if (groupingBtn) {
            groupingBtn.classList.toggle('active', currentSettings.grouping.enabled);
          }
        }
      }
      // Always re-render to pick up settings changes like showTimestamps
      updateOverlayEvents();
      // Handle persist toggle changes
      if (message.payload.persistEvents !== undefined) {
        // Update persist toggle UI (legacy mode only)
        if (!USE_WEB_COMPONENTS_OVERLAY) {
          updatePersistToggle();
        }
        // Save current events if enabling persist
        if (message.payload.persistEvents) {
          savePersistedEvents();
        }
      }
      // Broadcast settings change to other extension parts (sidepanel, devtools)
      safeSendMessage({
        type: 'SETTINGS_UPDATED',
        payload: message.payload,
      });
      sendResponse({ success: true });
      break;
    case 'GET_SETTINGS':
      sendResponse({ settings: currentSettings });
      break;
  }
  return true; // Keep channel open for async response
});

// Load settings and initialize
async function initialize(): Promise<void> {
  try {
    // Check if extension context is still valid before making API calls
    if (!isExtensionContextValid()) {
      throw new Error('Extension context invalidated');
    }
    // Request domain-specific settings from background script
    const response = await browserAPI.runtime.sendMessage({
      type: 'GET_SETTINGS',
      domain: currentDomain,
    });

    if (response?.settings) {
      currentSettings = {
        ...DEFAULT_SETTINGS,
        ...response.settings,
        grouping: { ...DEFAULT_GROUPING, ...response.settings.grouping },
      };
    }
  } catch (error) {
    // Check if it's an invalidated context error
    if (error instanceof Error && error.message?.includes('Extension context invalidated')) {
      extensionContextValid = false;
      console.debug('[DataLayer Lens] Extension context invalidated - please reload the page');
    }
    // Fallback to direct storage access if background script isn't ready
    try {
      if (isExtensionContextValid()) {
        const result = await browserAPI.storage.local.get('datalayer_monitor_settings');
        const savedSettings = result.datalayer_monitor_settings || {};

        currentSettings = {
          ...DEFAULT_SETTINGS,
          ...savedSettings,
          grouping: { ...DEFAULT_GROUPING, ...savedSettings.grouping },
        };
      }
    } catch (storageError) {
      debugError(' Failed to load settings:', storageError);
    }
  }

  // Inject the page script
  injectScript();

  // Load persisted events if enabled
  await loadPersistedEvents();

  // If we have persisted events, we know dataLayer was active
  if (events.length > 0) {
    hasDataLayerActivity = true;
  }

  // Create overlay if enabled for this domain
  if (currentSettings.overlayEnabled) {
    // Wait for body to be available
    if (document.body) {
      createOverlayContainer();
      // Check for dataLayer activity after a short delay
      setTimeout(checkDataLayerActivity, 1500);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        createOverlayContainer();
        setTimeout(checkDataLayerActivity, 1500);
      });
    }
  }
}

// Check if dataLayer exists and show/hide overlay accordingly
function checkDataLayerActivity(): void {
  // If we've already received events, we're good
  if (hasDataLayerActivity || events.length > 0) {
    return;
  }

  // Check if any of the configured dataLayer arrays exist on the page
  const dataLayerExists = currentSettings.dataLayerNames.some(name => {
    const dl = (window as unknown as Record<string, unknown>)[name];
    return Array.isArray(dl) && dl.length > 0;
  });

  if (dataLayerExists) {
    hasDataLayerActivity = true;
    return;
  }

  // No dataLayer detected - collapse to minimized state
  if (overlayRoot && shadowRoot) {
    currentSettings.overlayCollapsed = true;
    updateCollapseState();
    // Force immediate minimize (skip the delay)
    const overlay = shadowRoot.getElementById('overlay-main');
    const container = shadowRoot.getElementById('overlay-container');
    if (overlay && container) {
      overlay.classList.add('minimized');
      container.classList.add('minimized');
    }
  }
}

// Start
initialize();
