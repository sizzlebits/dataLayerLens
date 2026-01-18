/**
 * DataLayer Monitor - Development Tool
 *
 * A lightweight development dependency for monitoring GTM dataLayer events.
 * Import this in your app during development to see a floating overlay
 * showing all dataLayer.push() calls in real-time.
 *
 * @example
 * // In your app's entry point (e.g., main.tsx, App.tsx)
 * if (process.env.NODE_ENV === 'development') {
 *   import('datalayerlens').then(({ initDataLayerMonitor }) => {
 *     initDataLayerMonitor();
 *   });
 * }
 *
 * @example
 * // Or with options
 * initDataLayerMonitor({
 *   dataLayerNames: ['dataLayer', 'dataLayer_v2'],
 *   position: 'bottom-right',
 *   maxEvents: 50,
 *   collapsed: false,
 * });
 */

// Global marker to detect multiple instances (extension, bookmarklet, npm package)
const GLOBAL_MARKER = '__DATALAYER_MONITOR_ACTIVE__';

export interface DataLayerEvent {
  id: string;
  timestamp: number;
  event: string;
  data: Record<string, unknown>;
  source: string;
}

export interface MonitorOptions {
  /** Array names to monitor. Default: ['dataLayer'] */
  dataLayerNames?: string[];
  /** Position of the overlay. Default: 'bottom-right' */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Maximum events to display. Default: 50 */
  maxEvents?: number;
  /** Start collapsed. Default: false */
  collapsed?: boolean;
  /** Enable console logging. Default: true */
  consoleLog?: boolean;
  /** Callback when event is captured */
  onEvent?: (event: DataLayerEvent) => void;
}

export interface MonitorInstance {
  /** Get all captured events */
  getEvents: () => DataLayerEvent[];
  /** Clear all events */
  clearEvents: () => void;
  /** Show the overlay */
  show: () => void;
  /** Hide the overlay */
  hide: () => void;
  /** Toggle overlay visibility */
  toggle: () => void;
  /** Destroy the monitor and restore original dataLayer.push */
  destroy: () => void;
  /** Update options */
  setOptions: (options: Partial<MonitorOptions>) => void;
  /** Source of this instance */
  source: 'npm' | 'extension' | 'bookmarklet';
}

const DEFAULT_OPTIONS: Required<MonitorOptions> = {
  dataLayerNames: ['dataLayer'],
  position: 'bottom-right',
  maxEvents: 50,
  collapsed: false,
  consoleLog: true,
  onEvent: () => {},
};

let instance: MonitorInstance | null = null;

/**
 * Check if another DataLayer Monitor instance is already running.
 * This prevents conflicts between the npm package, browser extension, and bookmarklet.
 */
function checkForExistingInstance(): { exists: boolean; source?: string } {
  if (typeof window === 'undefined') {
    return { exists: false };
  }

  const win = window as unknown as Record<string, unknown>;

  // Check for global marker
  if (win[GLOBAL_MARKER]) {
    const marker = win[GLOBAL_MARKER] as { source: string; version: string };
    return { exists: true, source: marker.source };
  }

  // Check for browser extension overlay
  if (document.getElementById('datalayer-monitor-root')) {
    return { exists: true, source: 'extension' };
  }

  // Check for existing npm/bookmarklet overlay
  if (document.getElementById('datalayer-monitor-overlay')) {
    return { exists: true, source: 'npm/bookmarklet' };
  }

  return { exists: false };
}

/**
 * Mark this instance as active globally.
 */
function markAsActive(source: 'npm' | 'extension' | 'bookmarklet'): void {
  if (typeof window === 'undefined') return;

  (window as unknown as Record<string, unknown>)[GLOBAL_MARKER] = {
    source,
    version: '1.0.0',
    timestamp: Date.now(),
  };
}

/**
 * Remove the global active marker.
 */
function clearActiveMarker(): void {
  if (typeof window === 'undefined') return;

  delete (window as unknown as Record<string, unknown>)[GLOBAL_MARKER];
}

/**
 * Initialise the DataLayer Monitor.
 * Safe to call multiple times - will return existing instance.
 *
 * @throws {Error} If another monitor instance (extension/bookmarklet) is already active
 */
export function initDataLayerMonitor(options: MonitorOptions = {}): MonitorInstance {
  // Return existing instance if already initialised
  if (instance) {
    instance.setOptions(options);
    return instance;
  }

  // Check for conflicting instances
  const existing = checkForExistingInstance();
  if (existing.exists) {
    const message = `DataLayer Monitor is already running (source: ${existing.source}). ` +
      'Only one instance can be active at a time to prevent duplicate event capture. ' +
      'Please disable the other instance first.';

    console.warn(
      '%c[DataLayer Monitor] %c' + message,
      'background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;',
      'color: #f59e0b;'
    );

    // Return a no-op instance instead of throwing
    return createNoOpInstance();
  }

  // Mark as active
  markAsActive('npm');

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events: DataLayerEvent[] = [];
  const originalPushMethods = new Map<string, (...args: unknown[]) => number>();
  let overlayElement: HTMLElement | null = null;
  let shadowRoot: ShadowRoot | null = null;
  let isVisible = true;
  let isCollapsed = opts.collapsed;

  // Generate unique ID
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // Check if valid GTM event
  function isValidEvent(data: unknown): data is Record<string, unknown> {
    return (
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      typeof (data as Record<string, unknown>).event === 'string' &&
      ((data as Record<string, unknown>).event as string).trim() !== ''
    );
  }

  // Get event category for styling
  function getEventCategory(eventName: string): { colour: string; icon: string } {
    const categories: Record<string, { colour: string; icon: string }> = {
      'gtm.js': { colour: '#22d3ee', icon: '🚀' },
      'gtm.dom': { colour: '#10b981', icon: '📄' },
      'gtm.load': { colour: '#8b5cf6', icon: '✅' },
      'gtm.click': { colour: '#f59e0b', icon: '👆' },
      page_view: { colour: '#3b82f6', icon: '👁️' },
      view_item: { colour: '#8b5cf6', icon: '🛍️' },
      add_to_cart: { colour: '#10b981', icon: '🛒' },
      purchase: { colour: '#22c55e', icon: '💰' },
    };

    if (categories[eventName]) return categories[eventName];

    const lower = eventName.toLowerCase();
    if (lower.includes('click')) return { colour: '#f59e0b', icon: '👆' };
    if (lower.includes('view')) return { colour: '#3b82f6', icon: '👁️' };
    if (lower.includes('cart')) return { colour: '#10b981', icon: '🛒' };
    if (lower.includes('purchase')) return { colour: '#22c55e', icon: '💰' };

    return { colour: '#64748b', icon: '📌' };
  }

  // Wrap dataLayer.push
  function wrapDataLayer(name: string): void {
    const win = window as unknown as Record<string, unknown>;
    win[name] = win[name] || [];
    const dataLayer = win[name] as unknown[];

    if (originalPushMethods.has(name)) return;

    // Check if already wrapped by another monitor
    if ((dataLayer as { __monitorWrapped?: boolean }).__monitorWrapped) {
      console.warn(
        `%c[DataLayer Monitor] %c${name}.push is already wrapped by another instance`,
        'background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px;',
        'color: #f59e0b;'
      );
      return;
    }

    const originalPush = dataLayer.push.bind(dataLayer);
    originalPushMethods.set(name, originalPush);

    const wrappedPush = function (...args: unknown[]): number {
      const result = originalPush(...args);

      for (const item of args) {
        if (isValidEvent(item)) {
          const event: DataLayerEvent = {
            id: generateId(),
            timestamp: Date.now(),
            event: item.event as string,
            data: item,
            source: name,
          };

          events.unshift(event);
          if (events.length > opts.maxEvents) {
            events.length = opts.maxEvents;
          }

          // Console log
          if (opts.consoleLog) {
            const category = getEventCategory(event.event);
            console.groupCollapsed(
              `%c📊 ${name}%c ${event.event}`,
              `background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;`,
              `color: ${category.colour}; font-weight: bold;`
            );
            console.log(item);
            console.groupEnd();
          }

          // Callback
          opts.onEvent(event);

          // Update overlay
          renderOverlay();
        }
      }

      return result;
    };

    // Mark as wrapped
    (wrappedPush as { __monitorWrapped?: boolean }).__monitorWrapped = true;

    dataLayer.push = wrappedPush;

    // Process existing events
    for (const item of dataLayer) {
      if (isValidEvent(item)) {
        events.push({
          id: generateId(),
          timestamp: Date.now(),
          event: item.event as string,
          data: item,
          source: name,
        });
      }
    }
  }

  // Unwrap dataLayer.push
  function unwrapDataLayer(name: string): void {
    const originalPush = originalPushMethods.get(name);
    if (!originalPush) return;

    const win = window as unknown as Record<string, unknown>;
    const dataLayer = win[name] as unknown[];
    if (dataLayer) {
      dataLayer.push = originalPush;
    }
    originalPushMethods.delete(name);
  }

  // Create overlay
  function createOverlay(): void {
    overlayElement = document.createElement('div');
    overlayElement.id = 'datalayer-monitor-overlay';
    overlayElement.style.cssText = `
      all: initial;
      position: fixed;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Position
    const positions: Record<string, string> = {
      'bottom-right': 'bottom: 16px; right: 16px;',
      'bottom-left': 'bottom: 16px; left: 16px;',
      'top-right': 'top: 16px; right: 16px;',
      'top-left': 'top: 16px; left: 16px;',
    };
    overlayElement.style.cssText += positions[opts.position];

    shadowRoot = overlayElement.attachShadow({ mode: 'open' });

    const styles = document.createElement('style');
    styles.textContent = getStyles();
    shadowRoot.appendChild(styles);

    const container = document.createElement('div');
    container.id = 'container';
    shadowRoot.appendChild(container);

    document.body.appendChild(overlayElement);
    renderOverlay();
  }

  // Get CSS styles
  function getStyles(): string {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }

      #container {
        width: 360px;
        max-height: 60vh;
        background: linear-gradient(145deg, rgba(15, 15, 35, 0.98), rgba(26, 26, 46, 0.98));
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(20px);
        overflow: hidden;
        font-size: 12px;
        color: #e2e8f0;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
        border-bottom: 1px solid rgba(99, 102, 241, 0.2);
        cursor: move;
        user-select: none;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .logo {
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }

      .title {
        font-weight: 600;
        font-size: 12px;
        color: #e2e8f0;
      }

      .badge {
        background: linear-gradient(135deg, #22d3ee, #10b981);
        color: #0f0f23;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 700;
      }

      .actions {
        display: flex;
        gap: 4px;
      }

      .btn {
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        font-size: 12px;
        transition: all 0.15s;
      }

      .btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #e2e8f0;
      }

      .btn.danger:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }

      .events {
        max-height: 350px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-colour: rgba(99, 102, 241, 0.3) transparent;
      }

      .events::-webkit-scrollbar {
        width: 6px;
      }

      .events::-webkit-scrollbar-thumb {
        background: rgba(99, 102, 241, 0.3);
        border-radius: 3px;
      }

      .event {
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: background 0.1s;
      }

      .event:hover {
        background: rgba(99, 102, 241, 0.05);
      }

      .event-header {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .event-icon { font-size: 12px; }

      .event-name {
        font-weight: 600;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .event-time {
        font-size: 9px;
        color: #64748b;
        font-family: monospace;
      }

      .event-source {
        font-size: 8px;
        color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
        padding: 1px 4px;
        border-radius: 3px;
      }

      .event-data {
        margin-top: 6px;
        padding: 6px 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: #94a3b8;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 100px;
        overflow-y: auto;
        display: none;
      }

      .event.expanded .event-data {
        display: block;
      }

      .empty {
        padding: 30px 20px;
        text-align: center;
        color: #64748b;
      }

      .empty-icon { font-size: 24px; opacity: 0.5; margin-bottom: 8px; }

      .collapsed .events { display: none; }
      .collapsed .header { border-bottom: none; }

      .dev-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #ef4444;
        color: white;
        font-size: 8px;
        font-weight: 700;
        padding: 2px 4px;
        border-radius: 4px;
        text-transform: uppercase;
      }
    `;
  }

  // Render overlay content
  function renderOverlay(): void {
    if (!shadowRoot || !isVisible) return;

    const container = shadowRoot.getElementById('container');
    if (!container) return;

    const filteredEvents = events.slice(0, opts.maxEvents);

    container.innerHTML = `
      <div class="${isCollapsed ? 'collapsed' : ''}">
        <div class="header" data-drag>
          <div class="header-left">
            <div class="logo">📊</div>
            <span class="title">DataLayer</span>
            <span class="badge">${filteredEvents.length}</span>
            <span class="dev-badge">DEV</span>
          </div>
          <div class="actions">
            <button class="btn" data-action="collapse" title="${isCollapsed ? 'Expand' : 'Collapse'}">
              ${isCollapsed ? '▼' : '▲'}
            </button>
            <button class="btn danger" data-action="clear" title="Clear">🗑</button>
            <button class="btn danger" data-action="close" title="Hide">✕</button>
          </div>
        </div>
        <div class="events">
          ${filteredEvents.length === 0 ? `
            <div class="empty">
              <div class="empty-icon">📭</div>
              <div>No events yet</div>
            </div>
          ` : filteredEvents.map(event => {
            const cat = getEventCategory(event.event);
            const time = new Date(event.timestamp).toLocaleTimeString();
            return `
              <div class="event" data-id="${event.id}">
                <div class="event-header">
                  <span class="event-icon">${cat.icon}</span>
                  <span class="event-name" style="color: ${cat.colour}">${escapeHtml(event.event)}</span>
                  <span class="event-source">${escapeHtml(event.source)}</span>
                  <span class="event-time">${time}</span>
                </div>
                <div class="event-data">${escapeHtml(JSON.stringify(event.data, null, 2))}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    attachEventListeners(container);
  }

  // Escape HTML
  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Attach event listeners
  function attachEventListeners(container: HTMLElement): void {
    // Action buttons
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-action]') as HTMLElement;

      if (btn) {
        const action = btn.dataset.action;
        if (action === 'collapse') {
          isCollapsed = !isCollapsed;
          renderOverlay();
        } else if (action === 'clear') {
          events.length = 0;
          renderOverlay();
        } else if (action === 'close') {
          hide();
        }
        return;
      }

      // Toggle event expansion
      const eventEl = target.closest('.event') as HTMLElement;
      if (eventEl) {
        eventEl.classList.toggle('expanded');
      }
    });

    // Dragging
    const header = container.querySelector('[data-drag]') as HTMLElement;
    if (header && overlayElement) {
      let isDragging = false;
      let startX = 0, startY = 0, initialX = 0, initialY = 0;

      header.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = overlayElement!.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        overlayElement!.style.left = `${initialX + dx}px`;
        overlayElement!.style.top = `${initialY + dy}px`;
        overlayElement!.style.right = 'auto';
        overlayElement!.style.bottom = 'auto';
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    }
  }

  // Show overlay
  function show(): void {
    isVisible = true;
    if (overlayElement) {
      overlayElement.style.display = 'block';
    } else {
      createOverlay();
    }
    renderOverlay();
  }

  // Hide overlay
  function hide(): void {
    isVisible = false;
    if (overlayElement) {
      overlayElement.style.display = 'none';
    }
  }

  // Destroy
  function destroy(): void {
    // Restore original push methods
    for (const name of originalPushMethods.keys()) {
      unwrapDataLayer(name);
    }

    // Remove overlay
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
      shadowRoot = null;
    }

    // Clear global marker
    clearActiveMarker();

    events.length = 0;
    instance = null;

    console.log('%c[DataLayer Monitor] Destroyed', 'color: #ef4444;');
  }

  // Set options
  function setOptions(newOptions: Partial<MonitorOptions>): void {
    Object.assign(opts, newOptions);

    // Update dataLayer monitoring
    if (newOptions.dataLayerNames) {
      const current = new Set(originalPushMethods.keys());
      const updated = new Set(opts.dataLayerNames);

      for (const name of current) {
        if (!updated.has(name)) unwrapDataLayer(name);
      }
      for (const name of updated) {
        if (!current.has(name)) wrapDataLayer(name);
      }
    }

    renderOverlay();
  }

  // Initialise
  for (const name of opts.dataLayerNames) {
    wrapDataLayer(name);
  }

  createOverlay();

  console.log(
    '%c[DataLayer Monitor] %cInitialised (dev mode)',
    'background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2px 8px; border-radius: 4px;',
    'color: #22d3ee;'
  );

  instance = {
    getEvents: () => [...events],
    clearEvents: () => {
      events.length = 0;
      renderOverlay();
    },
    show,
    hide,
    toggle: () => (isVisible ? hide() : show()),
    destroy,
    setOptions,
    source: 'npm',
  };

  return instance;
}

/**
 * Create a no-op instance when another monitor is already active.
 */
function createNoOpInstance(): MonitorInstance {
  return {
    getEvents: () => [],
    clearEvents: () => {},
    show: () => {},
    hide: () => {},
    toggle: () => {},
    destroy: () => {},
    setOptions: () => {},
    source: 'npm',
  };
}

/**
 * Get existing monitor instance, if any.
 */
export function getDataLayerMonitor(): MonitorInstance | null {
  return instance;
}

/**
 * Check if a DataLayer Monitor is already active (from any source).
 */
export function isMonitorActive(): boolean {
  return checkForExistingInstance().exists;
}

// Auto-initialise if imported as side-effect
if (typeof window !== 'undefined') {
  // Expose globally for easy console access
  (window as unknown as Record<string, unknown>).__dlMonitor = {
    init: initDataLayerMonitor,
    get: getDataLayerMonitor,
    isActive: isMonitorActive,
  };
}
