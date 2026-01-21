/**
 * OverlayController module - manages overlay lifecycle and rendering.
 * Handles creating/destroying the overlay, rendering events, and UI interactions.
 */

import type { DataLayerEvent, EventGroup, Settings } from '@/types';
import { getEventCategory, getCurrentDomain } from '@/types';
import { escapeHtml, syntaxHighlight } from '@/utils/html';
import { getCombinedStyles } from '../overlay/styles/loadStyles';

export interface OverlayControllerOptions {
  /** Callback when overlay is closed */
  onClose: () => void;
  /** Callback when events are cleared */
  onClearEvents: () => void;
  /** Callback when collapse state changes */
  onCollapseToggle: (collapsed: boolean) => void;
  /** Callback when grouping is toggled */
  onGroupingToggle: (enabled: boolean) => void;
  /** Callback when persist is toggled */
  onPersistToggle: (enabled: boolean) => void;
  /** Callback when overlay is resized */
  onResize: (height: number) => void;
  /** Callback when a filter is added */
  onFilterAdd: (filter: string, mode: 'include' | 'exclude') => void;
  /** Callback when a filter is removed */
  onFilterRemove: (filter: string) => void;
  /** Callback when filter mode changes */
  onFilterModeChange: (mode: 'include' | 'exclude', clearFilters: boolean) => void;
  /** Callback when an event is copied */
  onCopyEvent: (event: DataLayerEvent) => void;
  /** Get event by ID */
  getEventById: (id: string) => DataLayerEvent | undefined;
  /** Get expanded event IDs */
  getExpandedEventIds: () => Set<string>;
  /** Toggle event expanded state */
  toggleEventExpanded: (eventId: string) => void;
  /** Toggle group collapsed state */
  toggleGroupCollapsed: (groupId: string) => void;
  /** Check if group is collapsed */
  isGroupCollapsed: (groupId: string) => boolean;
  /** Debug logging */
  debugLogging?: boolean;
}

export interface IOverlayController {
  /** Create and show the overlay */
  create(settings: Settings): void;
  /** Destroy the overlay */
  destroy(): void;
  /** Check if overlay exists */
  exists(): boolean;
  /** Update events list */
  updateEvents(events: DataLayerEvent[], groups: EventGroup[], settings: Settings): void;
  /** Update collapse state */
  updateCollapseState(collapsed: boolean): void;
  /** Update settings display */
  updateSettings(settings: Settings): void;
  /** Apply position anchor */
  applyPositionAnchor(settings: Settings): void;
}

// Common event types for filter suggestions
const COMMON_EVENTS = [
  'gtm.js', 'gtm.dom', 'gtm.load', 'gtm.click', 'gtm.linkClick', 'gtm.formSubmit',
  'gtm.historyChange', 'gtm.scrollDepth', 'gtm.timer', 'gtm.video',
  'page_view', 'view_item', 'view_item_list', 'select_item', 'add_to_cart',
  'remove_from_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info',
  'purchase', 'refund', 'view_promotion', 'select_promotion', 'sign_up', 'login',
  'search', 'share', 'select_content', 'generate_lead', 'exception',
];

/**
 * Manages the overlay lifecycle and rendering.
 */
export class OverlayController implements IOverlayController {
  private options: OverlayControllerOptions;
  private overlayRoot: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private currentFilter = '';
  private currentPage = 0;
  private eventsPerPage = 50;
  private filterModalSearch = '';
  private renderScheduled = false;
  private lastRenderTime = 0;
  private minimizeTimer: number | null = null;
  private currentSettings: Settings | null = null;
  private currentEvents: DataLayerEvent[] = [];
  private currentGroups: EventGroup[] = [];
  private newEventIds: Set<string> = new Set();
  private renderedEventIds: Set<string> = new Set();
  private lastRenderContext: string = '';

  private static readonly RENDER_DEBOUNCE_MS = 16;
  private static readonly MINIMIZE_DELAY_MS = 1000;
  private static readonly NEW_EVENT_ANIMATION_MS = 2000;

  constructor(options: OverlayControllerOptions) {
    this.options = options;
  }

  /**
   * Create and show the overlay.
   */
  create(settings: Settings): void {
    console.debug('[DataLayer Lens] OverlayController.create called', { alreadyExists: !!this.overlayRoot });
    if (this.overlayRoot) return;

    this.currentSettings = settings;

    this.overlayRoot = document.createElement('div');
    this.overlayRoot.id = 'datalayer-monitor-root';
    this.overlayRoot.style.cssText = `
      all: initial;
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
    `;

    this.shadowRoot = this.overlayRoot.attachShadow({ mode: 'open' });

    document.body.appendChild(this.overlayRoot);
    console.debug('[DataLayer Lens] Overlay root added to DOM');

    // Inject styles
    const styles = document.createElement('style');
    styles.textContent = getCombinedStyles();
    this.shadowRoot.appendChild(styles);
    console.debug('[DataLayer Lens] Styles injected, length:', styles.textContent.length);

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'overlay-container';
    overlay.className = 'overlay-container';
    this.shadowRoot.appendChild(overlay);

    this.renderOverlayStructure();
    this.attachOverlayListeners();
    console.debug('[DataLayer Lens] Overlay structure rendered');

    // If created in collapsed state, schedule transition to minimized
    if (settings.overlayCollapsed) {
      const overlay = this.shadowRoot.getElementById('overlay-main');
      const container = this.shadowRoot.getElementById('overlay-container');

      this.minimizeTimer = window.setTimeout(() => {
        overlay?.classList.add('minimized');
        container?.classList.add('minimized');
      }, OverlayController.MINIMIZE_DELAY_MS);
    }
  }

  /**
   * Destroy the overlay.
   */
  destroy(): void {
    console.debug('[DataLayer Lens] OverlayController.destroy called');
    if (this.minimizeTimer) {
      clearTimeout(this.minimizeTimer);
      this.minimizeTimer = null;
    }
    if (this.overlayRoot) {
      this.overlayRoot.remove();
      this.overlayRoot = null;
      this.shadowRoot = null;
    }
    // Reset render tracking state
    this.renderedEventIds.clear();
    this.lastRenderContext = '';
    this.newEventIds.clear();
  }

  /**
   * Check if overlay exists.
   */
  exists(): boolean {
    return this.overlayRoot !== null;
  }

  /**
   * Update events list.
   */
  updateEvents(events: DataLayerEvent[], groups: EventGroup[], settings: Settings): void {
    // Detect new events by comparing with previous events
    const previousEventIds = new Set(this.currentEvents.map(e => e.id));
    for (const event of events) {
      if (!previousEventIds.has(event.id)) {
        // This is a new event - add to newEventIds and schedule removal
        this.newEventIds.add(event.id);
        const eventId = event.id;
        setTimeout(() => {
          this.newEventIds.delete(eventId);
          // Remove 'new' class directly from DOM element without full re-render
          // This prevents interrupting other animations
          const element = this.shadowRoot?.querySelector(`[data-event-id="${eventId}"]`);
          if (element) {
            element.classList.remove('new');
          }
        }, OverlayController.NEW_EVENT_ANIMATION_MS);
      }
    }

    this.currentEvents = events;
    this.currentGroups = groups;
    this.currentSettings = settings;
    this.scheduleRender();
  }

  /**
   * Update collapse state.
   */
  updateCollapseState(collapsed: boolean): void {
    if (!this.shadowRoot || !this.currentSettings) return;

    const overlay = this.shadowRoot.getElementById('overlay-main');
    const container = this.shadowRoot.getElementById('overlay-container');

    if (overlay && container) {
      if (collapsed) {
        // Reset to anchor position when collapsing (in case it was dragged)
        this.applyPositionAnchor(this.currentSettings);

        // Clear inline dimensions so CSS auto can take effect
        container.style.width = '';
        container.style.height = '';

        overlay.classList.add('collapsed');
        overlay.classList.remove('minimized');
        container.classList.add('collapsed');
        container.classList.remove('minimized');

        if (this.minimizeTimer) {
          clearTimeout(this.minimizeTimer);
        }

        this.minimizeTimer = window.setTimeout(() => {
          overlay.classList.add('minimized');
          container.classList.add('minimized');
        }, OverlayController.MINIMIZE_DELAY_MS);
      } else {
        overlay.classList.remove('collapsed', 'minimized');
        container.classList.remove('collapsed', 'minimized');

        if (this.minimizeTimer) {
          clearTimeout(this.minimizeTimer);
          this.minimizeTimer = null;
        }

        // Restore custom height if set
        if (this.currentSettings.overlayHeight > 0) {
          container.style.height = `${this.currentSettings.overlayHeight}px`;
        }

        this.applyPositionAnchor(this.currentSettings);
      }
    }

    const collapseBtn = this.shadowRoot.getElementById('collapse-btn');
    if (collapseBtn) {
      collapseBtn.title = collapsed ? 'Expand' : 'Collapse';
      const svg = collapseBtn.querySelector('polyline');
      if (svg) {
        svg.setAttribute('points', collapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15');
      }
    }
  }

  /**
   * Update settings display.
   */
  updateSettings(settings: Settings): void {
    this.currentSettings = settings;

    // Update grouping button
    const groupingBtn = this.shadowRoot?.getElementById('grouping-btn');
    if (groupingBtn) {
      groupingBtn.classList.toggle('active', settings.grouping.enabled);
    }

    // Update persist toggle
    const toggle = this.shadowRoot?.getElementById('persist-toggle');
    if (toggle) {
      toggle.classList.toggle('active', settings.persistEvents);
      const label = settings.persistEvents ? 'Persisting events' : 'Persist events across refreshes';
      toggle.setAttribute('title', label);
      toggle.setAttribute('aria-label', label);
    }

    this.updateFilterTags();
  }

  /**
   * Apply position anchor.
   */
  applyPositionAnchor(settings: Settings): void {
    if (!this.shadowRoot) return;

    const container = this.shadowRoot.getElementById('overlay-container');
    if (!container) {
      console.debug('[DataLayer Lens] applyPositionAnchor: container not found');
      return;
    }

    const anchor = settings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' };
    console.debug('[DataLayer Lens] applyPositionAnchor:', anchor);

    container.style.top = 'auto';
    container.style.bottom = 'auto';
    container.style.left = 'auto';
    container.style.right = 'auto';

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

    console.debug('[DataLayer Lens] Container styles applied:', {
      position: container.style.position,
      bottom: container.style.bottom,
      right: container.style.right,
      width: container.style.width,
      height: container.style.height,
      computedPosition: getComputedStyle(container).position,
    });

    const resizeHandle = this.shadowRoot.getElementById('resize-handle');
    if (resizeHandle) {
      resizeHandle.classList.remove('top', 'bottom');
      resizeHandle.classList.add(anchor.vertical === 'bottom' ? 'top' : 'bottom');
    }
  }

  // Private methods

  private scheduleRender(): void {
    if (this.renderScheduled) return;

    const now = performance.now();
    const timeSinceLastRender = now - this.lastRenderTime;

    if (timeSinceLastRender >= OverlayController.RENDER_DEBOUNCE_MS) {
      this.performRender();
    } else {
      this.renderScheduled = true;
      requestAnimationFrame(() => {
        this.renderScheduled = false;
        this.performRender();
      });
    }
  }

  private performRender(): void {
    if (!this.shadowRoot || !this.currentSettings) return;

    this.lastRenderTime = performance.now();

    const container = this.shadowRoot.getElementById('events-container');
    if (!container) return;

    const filteredEvents = this.getFilteredEvents();
    const { grouping } = this.currentSettings;

    if (grouping.enabled) {
      this.renderGroupedEvents(container, filteredEvents);
    } else {
      this.renderFlatEvents(container, filteredEvents);
    }

    this.updateEventCount();
    this.updateFilterTags();
    this.updatePagination();
  }

  private getFilteredEvents(): DataLayerEvent[] {
    if (!this.currentSettings) return [];

    const { eventFilters, filterMode } = this.currentSettings;
    let filtered = this.currentEvents;

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

    if (this.currentFilter) {
      filtered = filtered.filter(e =>
        e.event.toLowerCase().includes(this.currentFilter.toLowerCase())
      );
    }

    return filtered;
  }

  private renderFlatEvents(container: HTMLElement, filteredEvents: DataLayerEvent[]): void {
    const pagedEvents = filteredEvents.slice(
      this.currentPage * this.eventsPerPage,
      (this.currentPage + 1) * this.eventsPerPage
    );

    if (pagedEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No events captured yet</div>
          <div class="empty-state-hint">Waiting for dataLayer pushes...</div>
        </div>
      `;
      this.renderedEventIds.clear();
      this.lastRenderContext = '';
      return;
    }

    const showTime = this.currentSettings?.showTimestamps ?? true;
    const expandedIds = this.options.getExpandedEventIds();
    const persistEnabled = this.currentSettings?.persistEvents ?? false;

    // Create a render context hash to detect when we need a full re-render
    const renderContext = `${this.currentPage}|${this.currentFilter}|${this.currentSettings?.eventFilters.join(',')}|${this.currentSettings?.filterMode}|${persistEnabled}`;
    const needsFullRender = renderContext !== this.lastRenderContext;

    // Check if we can do an incremental update (only new events added at the start)
    const pagedEventIds = pagedEvents.map(e => e.id);
    const canDoIncrementalUpdate = !needsFullRender &&
      this.renderedEventIds.size > 0 &&
      pagedEventIds.every((id, idx) => {
        // New events should be at the start, existing events should follow
        if (this.newEventIds.has(id)) return true;
        // After new events, the rest should match what was rendered
        const existingStartIdx = pagedEventIds.findIndex(eid => this.renderedEventIds.has(eid));
        if (existingStartIdx === -1) return false;
        return idx >= existingStartIdx;
      });

    if (canDoIncrementalUpdate) {
      // Only prepend new events
      const newEvents = pagedEvents.filter(e => !this.renderedEventIds.has(e.id));
      if (newEvents.length > 0) {
        const newHtmlParts: string[] = [];
        for (const event of newEvents) {
          newHtmlParts.push(this.createEventItemHtml(event, showTime, expandedIds, true));
          this.renderedEventIds.add(event.id);
        }

        // Check if we need to add a separator between new events and existing persisted events
        if (persistEnabled) {
          // Only add separator if one doesn't already exist
          const existingSeparator = container.querySelector('.persisted-separator');
          if (!existingSeparator) {
            // Find first event that's already rendered in the DOM
            const firstExistingEvent = pagedEvents.find(e => this.renderedEventIds.has(e.id));
            const firstExistingIsPersisted = firstExistingEvent?.source.includes('(persisted)');
            const hasNonPersistedNewEvents = newEvents.some(e => !e.source.includes('(persisted)'));

            // Add separator if we're adding non-persisted events before persisted ones
            if (firstExistingIsPersisted && hasNonPersistedNewEvents) {
              newHtmlParts.push(`
                <div class="persisted-separator">
                  <span>Persisted Events</span>
                </div>
              `);
            }
          }
          // If separator exists, leave it - new events prepended will naturally go above it
        }

        // Prepend to container
        container.insertAdjacentHTML('afterbegin', newHtmlParts.join(''));
      }
      return;
    }

    // Full re-render needed
    const htmlParts: string[] = [];
    for (let i = 0; i < pagedEvents.length; i++) {
      const event = pagedEvents[i];

      // Check if persisted and show separator
      const isPersisted = event.source.includes('(persisted)');
      const prevEvent = i > 0 ? pagedEvents[i - 1] : null;
      const prevIsPersisted = prevEvent?.source.includes('(persisted)');
      const showSeparator = persistEnabled && isPersisted && !prevIsPersisted && i > 0;

      if (showSeparator) {
        htmlParts.push(`
          <div class="persisted-separator">
            <span>Persisted Events</span>
          </div>
        `);
      }

      const isNew = this.newEventIds.has(event.id);
      htmlParts.push(this.createEventItemHtml(event, showTime, expandedIds, isNew));
    }

    container.innerHTML = htmlParts.join('');
    this.renderedEventIds = new Set(pagedEvents.map(e => e.id));
    this.lastRenderContext = renderContext;
  }

  private createEventItemHtml(
    event: DataLayerEvent,
    showTime: boolean,
    expandedIds: Set<string>,
    isNew: boolean
  ): string {
    const category = getEventCategory(event.event);
    const time = new Date(event.timestamp).toLocaleTimeString();
    const isExpanded = expandedIds.has(event.id);
    const cleanSource = event.source.replace(' (persisted)', '').replace('(persisted)', '');

    return `
      <div class="event-item${isNew ? ' new' : ''}${isExpanded ? ' expanded' : ''}" data-event-id="${escapeHtml(event.id)}">
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
          <span class="event-source">${escapeHtml(cleanSource)}</span>
          ${showTime ? `<span class="event-time">${time}</span>` : ''}
        </div>
        <div class="event-data">${syntaxHighlight(event.data)}</div>
      </div>
    `;
  }

  private renderGroupedEvents(container: HTMLElement, filteredEvents: DataLayerEvent[]): void {
    const filteredEventIds = new Set(filteredEvents.map(e => e.id));
    const filteredGroups = this.currentGroups
      .map(group => ({
        ...group,
        events: group.events.filter(e => filteredEventIds.has(e.id)),
      }))
      .filter(group => group.events.length > 0);

    if (filteredGroups.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No events captured yet</div>
          <div class="empty-state-hint">Waiting for dataLayer pushes...</div>
        </div>
      `;
      return;
    }

    const showTime = this.currentSettings?.showTimestamps ?? true;
    const expandedEventIds = this.options.getExpandedEventIds();

    const htmlParts: string[] = [];
    for (const group of filteredGroups) {
      const isCollapsed = this.options.isGroupCollapsed(group.id);
      const startTime = new Date(group.startTime).toLocaleTimeString();
      const triggerInfo = group.triggerEvent
        ? `<span class="group-trigger">triggered by ${escapeHtml(group.triggerEvent)}</span>`
        : '';

      const eventsHtml = group.events.map((event) => {
        const category = getEventCategory(event.event);
        const time = new Date(event.timestamp).toLocaleTimeString();
        const isExpanded = expandedEventIds.has(event.id);
        const isNew = this.newEventIds.has(event.id);

        // Clean source by removing "(persisted)" marker
        const cleanSource = event.source.replace(' (persisted)', '').replace('(persisted)', '');

        return `
          <div class="event-item${isNew ? ' new' : ''}${isExpanded ? ' expanded' : ''} grouped" data-event-id="${escapeHtml(event.id)}">
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
              <span class="event-source">${escapeHtml(cleanSource)}</span>
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

  private updateEventCount(): void {
    if (!this.shadowRoot) return;
    const countEl = this.shadowRoot.getElementById('event-count');
    if (!countEl) return;

    const totalCount = this.currentEvents.length;
    countEl.textContent = String(totalCount);

    countEl.classList.add('bump');
    setTimeout(() => countEl.classList.remove('bump'), 200);
  }

  private updateFilterTags(): void {
    if (!this.shadowRoot || !this.currentSettings) return;

    const container = this.shadowRoot.getElementById('status-filters');
    if (!container) return;

    const { eventFilters, filterMode } = this.currentSettings;

    const filterTagsHtml = eventFilters.map(filter => {
      const count = this.countEventsMatchingFilter(filter);
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

  private countEventsMatchingFilter(filter: string): number {
    return this.currentEvents.filter(e =>
      e.event.toLowerCase().includes(filter.toLowerCase())
    ).length;
  }

  private updatePagination(): void {
    if (!this.shadowRoot) return;

    const paginationEl = this.shadowRoot.getElementById('pagination');
    const infoEl = this.shadowRoot.getElementById('pagination-info');
    const prevBtn = this.shadowRoot.querySelector('[data-action="prev-page"]') as HTMLButtonElement;
    const nextBtn = this.shadowRoot.querySelector('[data-action="next-page"]') as HTMLButtonElement;
    const perPageSelect = this.shadowRoot.getElementById('per-page-select') as HTMLSelectElement;

    if (!paginationEl || !infoEl) return;

    const totalEvents = this.getFilteredEvents().length;
    const totalPages = Math.ceil(totalEvents / this.eventsPerPage);

    // Use class toggle instead of inline style to allow CSS to override in collapsed/minimized states
    if (totalEvents > this.eventsPerPage) {
      paginationEl.classList.add('has-pages');
    } else {
      paginationEl.classList.remove('has-pages');
      this.currentPage = 0;
      return;
    }

    if (this.currentPage >= totalPages) {
      this.currentPage = Math.max(0, totalPages - 1);
    }

    const start = this.currentPage * this.eventsPerPage + 1;
    const end = Math.min((this.currentPage + 1) * this.eventsPerPage, totalEvents);
    infoEl.textContent = `${start}-${end} of ${totalEvents}`;

    if (prevBtn) prevBtn.disabled = this.currentPage === 0;
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages - 1;
    if (perPageSelect) perPageSelect.value = String(this.eventsPerPage);
  }

  private renderOverlayStructure(): void {
    if (!this.shadowRoot || !this.currentSettings) return;

    const container = this.shadowRoot.getElementById('overlay-container');
    if (!container) return;

    this.applyPositionAnchor(this.currentSettings);

    // Apply collapsed class to container if needed (for proper width/height: auto)
    if (this.currentSettings.overlayCollapsed) {
      container.classList.add('collapsed');
    }

    if (this.currentSettings.overlayHeight > 0 && !this.currentSettings.overlayCollapsed) {
      container.style.height = `${this.currentSettings.overlayHeight}px`;
    }

    const currentDomain = getCurrentDomain();

    container.innerHTML = `
      <div class="overlay ${this.currentSettings.overlayCollapsed ? 'collapsed' : ''}" id="overlay-main">
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
            <button class="action-btn ${this.currentSettings.grouping.enabled ? 'active' : ''}" data-action="toggle-grouping" title="Toggle grouping" id="grouping-btn">
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
          <div class="persist-toggle${this.currentSettings.persistEvents ? ' active' : ''}" data-action="toggle-persist" id="persist-toggle" title="${this.currentSettings.persistEvents ? 'Persisting events' : 'Persist events across refreshes'}">
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
        <div class="pagination" id="pagination">
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
            <button class="filter-mode-btn include ${this.currentSettings.filterMode === 'include' ? 'active' : ''}" data-action="set-filter-mode" data-mode="include">
              ✓ Include Only
            </button>
            <button class="filter-mode-btn exclude ${this.currentSettings.filterMode === 'exclude' ? 'active' : ''}" data-action="set-filter-mode" data-mode="exclude">
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

    const overlay = container.querySelector('.overlay') as HTMLElement;
    if (overlay) {
      this.makeDraggable(overlay);
    }

    this.updateFilterTags();
  }

  private attachOverlayListeners(): void {
    if (!this.shadowRoot || !this.overlayRoot) return;

    const container = this.shadowRoot.getElementById('overlay-container');
    if (!container) return;

    const handleClick = (target: HTMLElement) => {
      const actionBtn = target.closest('[data-action]') as HTMLElement;
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;
      this.handleAction(action!, actionBtn, target);
    };

    container.addEventListener('overlay-click', ((e: CustomEvent) => {
      const target = e.detail.originalTarget as HTMLElement;
      if (target) handleClick(target);
    }) as EventListener);

    container.addEventListener('click', (e) => {
      handleClick(e.target as HTMLElement);
    });

    // Pagination buttons
    const prevPageBtn = this.shadowRoot.querySelector('[data-action="prev-page"]') as HTMLButtonElement;
    const nextPageBtn = this.shadowRoot.querySelector('[data-action="next-page"]') as HTMLButtonElement;

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentPage > 0) {
          this.currentPage--;
          this.scheduleRender();
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const totalEvents = this.getFilteredEvents().length;
        const totalPages = Math.ceil(totalEvents / this.eventsPerPage);
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
          this.scheduleRender();
        }
      });
    }

    // Per-page select
    const perPageSelect = this.shadowRoot.getElementById('per-page-select') as HTMLSelectElement;
    if (perPageSelect) {
      perPageSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        this.eventsPerPage = parseInt(perPageSelect.value, 10);
        this.currentPage = 0;
        this.scheduleRender();
      });
    }

    // Filter modal backdrop
    const modalBackdrop = this.shadowRoot.getElementById('filter-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.closeFilterModal();
        }
      });
    }

    // Resize handle
    this.setupResizeHandle();

    // Filter inputs
    let filterTimeout: number;
    container.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'filter-input') {
        clearTimeout(filterTimeout);
        filterTimeout = window.setTimeout(() => {
          this.currentFilter = (target as HTMLInputElement).value.trim();
          this.currentPage = 0;
          this.scheduleRender();
        }, 150);
      } else if (target.id === 'filter-modal-search') {
        clearTimeout(filterTimeout);
        filterTimeout = window.setTimeout(() => {
          this.filterModalSearch = (target as HTMLInputElement).value.trim();
          this.updateFilterModalSuggestions();
        }, 100);
      }
    });
  }

  private handleAction(action: string, actionBtn: HTMLElement, target: HTMLElement): void {
    if (!this.currentSettings) return;

    switch (action) {
      case 'collapse':
        this.options.onCollapseToggle(true);
        break;

      case 'expand-collapsed':
        if (this.currentSettings.overlayCollapsed) {
          this.options.onCollapseToggle(false);
        }
        break;

      case 'clear':
        this.options.onClearEvents();
        break;

      case 'close':
        this.options.onClose();
        break;

      case 'expand': {
        const eventItem = target.closest('.event-item') as HTMLElement;
        if (eventItem) {
          const eventId = eventItem.dataset.eventId;
          if (eventId) {
            this.options.toggleEventExpanded(eventId);
            eventItem.classList.toggle('expanded', this.options.getExpandedEventIds().has(eventId));
          }
        }
        break;
      }

      case 'copy-event': {
        const eventId = actionBtn.dataset.eventId;
        if (eventId) {
          const event = this.options.getEventById(eventId);
          if (event) {
            this.options.onCopyEvent(event);
            actionBtn.classList.add('copied');
            setTimeout(() => actionBtn.classList.remove('copied'), 1000);
          }
        }
        break;
      }

      case 'toggle-group': {
        const groupEl = target.closest('.event-group') as HTMLElement;
        if (groupEl) {
          const groupId = groupEl.dataset.groupId;
          if (groupId) {
            this.options.toggleGroupCollapsed(groupId);
            groupEl.classList.toggle('collapsed', this.options.isGroupCollapsed(groupId));
          }
        }
        break;
      }

      case 'toggle-grouping':
        this.options.onGroupingToggle(!this.currentSettings.grouping.enabled);
        break;

      case 'toggle-persist':
        this.options.onPersistToggle(!this.currentSettings.persistEvents);
        break;

      case 'filter-exclude': {
        const eventName = actionBtn.dataset.eventName;
        if (eventName) {
          this.options.onFilterAdd(eventName, 'exclude');
        }
        break;
      }

      case 'filter-include': {
        const eventName = actionBtn.dataset.eventName;
        if (eventName) {
          this.options.onFilterAdd(eventName, 'include');
        }
        break;
      }

      case 'remove-filter': {
        const filter = actionBtn.dataset.filter;
        if (filter) {
          this.options.onFilterRemove(filter);
        }
        break;
      }

      case 'open-filter-modal':
        this.openFilterModal();
        break;

      case 'close-filter-modal':
        this.closeFilterModal();
        break;

      case 'set-filter-mode': {
        const mode = actionBtn.dataset.mode as 'include' | 'exclude';
        if (mode && mode !== this.currentSettings.filterMode) {
          this.options.onFilterModeChange(mode, true);
          this.updateFilterModalSuggestions();
        }
        break;
      }

      case 'add-filter-modal': {
        const filter = actionBtn.dataset.filter;
        if (filter) {
          this.options.onFilterAdd(filter, this.currentSettings.filterMode);
          this.updateFilterModalSuggestions();
        }
        break;
      }

      case 'remove-filter-modal': {
        const filter = actionBtn.dataset.filter;
        if (filter) {
          this.options.onFilterRemove(filter);
          this.updateFilterModalSuggestions();
        }
        break;
      }

      case 'add-custom-filter': {
        const customInput = this.shadowRoot?.getElementById('filter-custom-input') as HTMLInputElement;
        if (customInput && customInput.value.trim()) {
          const filter = customInput.value.trim();
          this.options.onFilterAdd(filter, this.currentSettings.filterMode);
          customInput.value = '';
          this.updateFilterModalSuggestions();
        }
        break;
      }

      case 'prev-page':
        if (this.currentPage > 0) {
          this.currentPage--;
          this.scheduleRender();
        }
        break;

      case 'next-page': {
        const totalEvents = this.getFilteredEvents().length;
        const totalPages = Math.ceil(totalEvents / this.eventsPerPage);
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
          this.scheduleRender();
        }
        break;
      }
    }
  }

  private openFilterModal(): void {
    if (!this.shadowRoot) return;

    this.filterModalSearch = '';

    const backdrop = this.shadowRoot.getElementById('filter-modal-backdrop');
    if (backdrop) {
      backdrop.style.display = 'flex';
    }

    if (this.currentSettings) {
      const includeBtn = this.shadowRoot.querySelector('[data-mode="include"]');
      const excludeBtn = this.shadowRoot.querySelector('[data-mode="exclude"]');
      if (includeBtn && excludeBtn) {
        includeBtn.classList.toggle('active', this.currentSettings.filterMode === 'include');
        excludeBtn.classList.toggle('active', this.currentSettings.filterMode === 'exclude');
      }
    }

    const searchInput = this.shadowRoot.getElementById('filter-modal-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }

    this.updateFilterModalSuggestions();
  }

  private closeFilterModal(): void {
    if (!this.shadowRoot) return;

    const backdrop = this.shadowRoot.getElementById('filter-modal-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
    }
  }

  private updateFilterModalSuggestions(): void {
    if (!this.shadowRoot || !this.currentSettings) return;

    const container = this.shadowRoot.getElementById('filter-suggestions');
    if (!container) return;

    const { eventFilters } = this.currentSettings;
    const capturedEventNames = [...new Set(this.currentEvents.map(e => e.event))];
    const availableEvents = capturedEventNames.length > 0 ? capturedEventNames : COMMON_EVENTS;

    const filtered = this.filterModalSearch
      ? availableEvents.filter(e => e.toLowerCase().includes(this.filterModalSearch.toLowerCase()))
      : availableEvents;

    const sorted = filtered.sort((a, b) => a.localeCompare(b)).slice(0, 50);

    const hintHtml = capturedEventNames.length === 0 && !this.filterModalSearch
      ? `<div class="filter-hint">Common events shown as placeholders. Captured events will appear here once detected.</div>`
      : '';

    container.innerHTML = hintHtml + sorted.map(eventName => {
      const isInFilter = eventFilters.includes(eventName);
      const count = this.countEventsMatchingFilter(eventName);
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

  private setupResizeHandle(): void {
    if (!this.shadowRoot) return;

    const resizeHandle = this.shadowRoot.getElementById('resize-handle');
    const container = this.shadowRoot.getElementById('overlay-container');
    if (!resizeHandle || !container) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    const MIN_HEIGHT = 280;
    const MAX_HEIGHT = window.innerHeight - 32;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing || !this.currentSettings) return;
      e.preventDefault();
      e.stopPropagation();

      const anchor = this.currentSettings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' };
      const deltaY = anchor.vertical === 'bottom' ? (startY - e.clientY) : (e.clientY - startY);
      let newHeight = startHeight + deltaY;
      newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
      container.style.height = `${newHeight}px`;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      e.stopPropagation();
      isResizing = false;
      resizeHandle.classList.remove('dragging');

      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);

      const currentHeight = container.offsetHeight;
      this.options.onResize(currentHeight);
    };

    const startResize = (clientY: number) => {
      isResizing = true;
      startY = clientY;
      startHeight = container.offsetHeight;
      resizeHandle.classList.add('dragging');

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';

      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('mouseup', onMouseUp, true);
    };

    resizeHandle.addEventListener('overlay-mousedown', ((e: CustomEvent) => {
      e.stopPropagation();
      startResize(e.detail.clientY);
    }) as EventListener);

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(e.clientY);
    });
  }

  private makeDraggable(element: HTMLElement): void {
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
      }
    });
  }
}

/**
 * Factory function to create an OverlayController instance.
 */
export function createOverlayController(options: OverlayControllerOptions): IOverlayController {
  return new OverlayController(options);
}
