/**
 * DLOverlayContainer - Main Web Component container for the DataLayer Lens overlay.
 * Orchestrates header, toolbar, and event list components.
 */

import { DLBaseComponent } from './DLBaseComponent';
import type { DataLayerEvent, Settings } from '@/types';
// Child components are registered by registerComponents() in index.ts
import type { FilterTag } from './DLOverlayToolbar';
import type { DLFilterModal } from './DLFilterModal';

export interface OverlayState {
  events: DataLayerEvent[];
  settings: Settings;
  collapsed: boolean;
  searchText: string;
  filters: FilterTag[];
  expandedEventIds: Set<string>;
}

// Common GTM event types for filter suggestions
const COMMON_EVENTS = [
  'gtm.js', 'gtm.dom', 'gtm.load', 'gtm.click', 'gtm.linkClick', 'gtm.formSubmit',
  'gtm.historyChange', 'gtm.scrollDepth', 'gtm.timer', 'gtm.video',
  'page_view', 'view_item', 'view_item_list', 'select_item', 'add_to_cart',
  'remove_from_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info',
  'purchase', 'refund', 'view_promotion', 'select_promotion', 'sign_up', 'login',
  'search', 'share', 'select_content', 'generate_lead', 'exception',
];

export class DLOverlayContainer extends DLBaseComponent {
  private _events: DataLayerEvent[] = [];
  private _settings: Settings | null = null;
  private _collapsed = false;
  private _searchText = '';
  private _filters: FilterTag[] = [];
  private _expandedEventIds: Set<string> = new Set();
  private _anchor: { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' } = {
    vertical: 'bottom',
    horizontal: 'right',
  };
  private _height = 400;
  private _mode: 'overlay' | 'sidepanel' = 'overlay';

  static get observedAttributes(): string[] {
    return ['collapsed', 'anchor-vertical', 'anchor-horizontal', 'height', 'mode'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'collapsed':
        this._collapsed = newValue !== 'false' && newValue !== null;
        break;
      case 'anchor-vertical':
        this._anchor.vertical = (newValue as 'top' | 'bottom') || 'bottom';
        break;
      case 'anchor-horizontal':
        this._anchor.horizontal = (newValue as 'left' | 'right') || 'right';
        break;
      case 'height':
        this._height = parseInt(newValue || '400', 10);
        break;
      case 'mode':
        this._mode = (newValue as 'overlay' | 'sidepanel') || 'overlay';
        break;
    }
    this.scheduleRender();
  }

  set mode(value: 'overlay' | 'sidepanel') {
    this._mode = value;
    this.scheduleRender();
  }

  get mode(): 'overlay' | 'sidepanel' {
    return this._mode;
  }

  set events(value: DataLayerEvent[]) {
    this._events = value;
    if (this.isConnected) this.updateEventList();
  }

  get events(): DataLayerEvent[] {
    return this._events;
  }

  set settings(value: Settings | null) {
    this._settings = value;
    if (value) {
      this._collapsed = value.overlayCollapsed;
      this._anchor = value.overlayAnchor;
      this._height = value.overlayHeight || 400;
      this._filters = value.eventFilters.map(name => ({
        name,
        count: this.countEventsMatching(name),
      }));
    }
    this.scheduleRender();
  }

  get settings(): Settings | null {
    return this._settings;
  }

  set collapsed(value: boolean) {
    this._collapsed = value;
    this.scheduleRender();
  }

  get collapsed(): boolean {
    return this._collapsed;
  }

  private countEventsMatching(pattern: string): number {
    const lowerPattern = pattern.toLowerCase();
    return this._events.filter(e => e.event.toLowerCase().includes(lowerPattern)).length;
  }

  protected getStyles(): string {
    return `
      :host {
        display: block;
        position: fixed;
        z-index: 2147483647;
        pointer-events: auto;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
      }

      /* Sidepanel mode: fill the container */
      :host([mode="sidepanel"]) {
        position: relative;
        width: 100%;
        height: 100%;
        z-index: auto;
      }

      /* Component content wrapper - must fill available space */
      .component-content {
        display: contents;
      }

      :host([mode="sidepanel"]) .component-content {
        display: block;
        width: 100%;
        height: 100%;
      }

      .overlay {
        width: 400px;
        max-height: calc(100vh - 32px);
        background: rgba(15, 15, 35, 0.98);
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        backdrop-filter: blur(20px);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* Sidepanel mode: fill container, no border-radius */
      :host([mode="sidepanel"]) .overlay {
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        box-shadow: none;
      }

      .overlay.collapsed {
        height: auto !important;
        max-height: none;
      }

      .overlay.collapsed .overlay-body {
        display: none;
      }

      .overlay-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 200px;
      }

      /* Sidepanel mode: body fills available space */
      :host([mode="sidepanel"]) .overlay-body {
        height: 100% !important;
        min-height: 0;
      }

      /* Positioning based on anchor */
      :host([anchor-vertical="bottom"]) {
        bottom: 16px;
      }

      :host([anchor-vertical="top"]) {
        top: 16px;
      }

      :host([anchor-horizontal="right"]) {
        right: 16px;
      }

      :host([anchor-horizontal="left"]) {
        left: 16px;
      }

      /* Sidepanel mode: no positioning */
      :host([mode="sidepanel"]) {
        top: auto;
        bottom: auto;
        left: auto;
        right: auto;
      }

      /* Resize handle */
      .resize-handle {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 12px;
        cursor: ns-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.5;
        transition: opacity 0.2s ease;
      }

      /* Hide resize handle in sidepanel mode */
      :host([mode="sidepanel"]) .resize-handle {
        display: none;
      }

      .resize-handle:hover {
        opacity: 1;
      }

      :host([anchor-vertical="bottom"]) .resize-handle {
        top: -6px;
      }

      :host([anchor-vertical="top"]) .resize-handle {
        bottom: -6px;
      }

      .resize-handle-line {
        width: 24px;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }

      .resize-handle:hover .resize-handle-line {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
  }

  protected render(): void {
    const eventCount = this._events.length;
    const groupingEnabled = this._settings?.grouping?.enabled ?? false;
    const persistEnabled = this._settings?.persistEvents ?? false;
    const filterMode = this._settings?.filterMode ?? 'exclude';
    const showTimestamps = this._settings?.showTimestamps ?? true;
    const compactMode = this._settings?.compactMode ?? false;
    const isSidepanel = this._mode === 'sidepanel';

    // Update host attributes for CSS positioning and mode
    this.setAttribute('mode', this._mode);
    this.setAttribute('anchor-vertical', this._anchor.vertical);
    this.setAttribute('anchor-horizontal', this._anchor.horizontal);
    if (this._collapsed && !isSidepanel) {
      this.setAttribute('collapsed', '');
    } else {
      this.removeAttribute('collapsed');
    }

    // In sidepanel mode, don't use fixed height - let it fill container
    const bodyStyle = (this._collapsed && !isSidepanel) ? '' : (isSidepanel ? '' : `style="height: ${this._height}px"`);

    const html = `
      <div class="overlay ${(this._collapsed && !isSidepanel) ? 'collapsed' : ''}">
        <div class="resize-handle" data-action="resize">
          <div class="resize-handle-line"></div>
        </div>
        <dl-overlay-header
          event-count="${eventCount}"
          ${(this._collapsed && !isSidepanel) ? 'collapsed' : ''}
          ${groupingEnabled ? 'grouping-enabled' : ''}
          ${persistEnabled ? 'persist-enabled' : ''}
          ${isSidepanel ? 'sidepanel' : ''}
        ></dl-overlay-header>
        <div class="overlay-body" ${bodyStyle}>
          <dl-overlay-toolbar
            search-text="${this._searchText}"
            filter-mode="${filterMode}"
          ></dl-overlay-toolbar>
          <dl-event-list
            ${showTimestamps ? 'show-timestamps' : ''}
            ${compactMode ? 'compact-mode' : ''}
          ></dl-event-list>
        </div>
      </div>
      <dl-filter-modal filter-mode="${filterMode}"></dl-filter-modal>
    `;

    this.setContent(html);

    // Set complex data on child components
    this.updateEventList();
    this.updateToolbarFilters();
    this.updateFilterModal();
  }

  /**
   * Open the filter modal.
   */
  public openFilterModal(): void {
    const modal = this.$('dl-filter-modal') as DLFilterModal;
    if (modal) {
      modal.visible = true;
    }
  }

  /**
   * Close the filter modal.
   */
  public closeFilterModal(): void {
    const modal = this.$('dl-filter-modal') as DLFilterModal;
    if (modal) {
      modal.visible = false;
    }
  }

  private updateFilterModal(): void {
    const modal = this.$('dl-filter-modal') as DLFilterModal;
    if (modal) {
      modal.eventFilters = this._settings?.eventFilters ?? [];
      modal.filterMode = this._settings?.filterMode ?? 'exclude';
      // Get unique event names from captured events
      modal.availableEvents = [...new Set(this._events.map(e => e.event))];
      modal.commonEvents = COMMON_EVENTS;
    }
  }

  private updateEventList(): void {
    const eventList = this.$('dl-event-list') as HTMLElement & {
      events: DataLayerEvent[];
      expandedIds: Set<string>;
    };
    if (eventList) {
      // Apply search filter
      let filteredEvents = this._events;
      if (this._searchText) {
        const searchLower = this._searchText.toLowerCase();
        filteredEvents = filteredEvents.filter(e =>
          e.event.toLowerCase().includes(searchLower)
        );
      }
      eventList.events = filteredEvents;
      eventList.expandedIds = this._expandedEventIds;
    }
  }

  private updateToolbarFilters(): void {
    const toolbar = this.$('dl-overlay-toolbar') as HTMLElement & {
      filters: FilterTag[];
    };
    if (toolbar) {
      toolbar.filters = this._filters;
    }
  }

  protected setupEventListeners(): void {
    // Header events
    this.shadow.addEventListener('collapse-toggle', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this._collapsed = detail.collapsed;
      this.emit('collapse-toggle', detail);
      this.render();
    });

    this.shadow.addEventListener('grouping-toggle', (e: Event) => {
      this.emit('grouping-toggle', (e as CustomEvent).detail);
    });

    this.shadow.addEventListener('persist-toggle', (e: Event) => {
      this.emit('persist-toggle', (e as CustomEvent).detail);
    });

    this.shadow.addEventListener('clear-events', () => {
      this.emit('clear-events');
    });

    this.shadow.addEventListener('overlay-close', () => {
      this.emit('overlay-close');
    });

    // Toolbar events
    this.shadow.addEventListener('search-change', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this._searchText = detail.text;
      this.updateEventList();
      this.emit('search-change', detail);
    });

    this.shadow.addEventListener('filter-modal-open', () => {
      this.openFilterModal();
      this.emit('filter-modal-open');
    });

    // Filter modal events
    this.shadow.addEventListener('filter-modal-close', () => {
      this.closeFilterModal();
    });

    this.shadow.addEventListener('filter-mode-change', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.emit('filter-mode-change', detail);
    });

    // Event list events
    this.shadow.addEventListener('event-toggle', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.expanded) {
        this._expandedEventIds.add(detail.eventId);
      } else {
        this._expandedEventIds.delete(detail.eventId);
      }
      this.emit('event-toggle', detail);
    });

    this.shadow.addEventListener('event-copy', (e: Event) => {
      this.emit('event-copy', (e as CustomEvent).detail);
    });

    this.shadow.addEventListener('filter-add', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.emit('filter-add', detail);
      // Update the modal with new filter state
      this.updateFilterModal();
    });

    this.shadow.addEventListener('filter-remove', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.emit('filter-remove', detail);
      // Update the modal with new filter state
      this.updateFilterModal();
    });

    // Resize handling
    this.setupResizeHandler();
  }

  private setupResizeHandler(): void {
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-action="resize"]')) {
        isResizing = true;
        startY = e.clientY;
        startHeight = this._height;
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const delta = this._anchor.vertical === 'bottom'
        ? startY - e.clientY
        : e.clientY - startY;

      const newHeight = Math.max(200, Math.min(startHeight + delta, window.innerHeight - 100));
      this._height = newHeight;

      const body = this.$('.overlay-body') as HTMLElement;
      if (body) {
        body.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        this.emit('resize', { height: this._height });
      }
    };

    this.shadow.addEventListener('mousedown', handleMouseDown as EventListener);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
}

// Registration handled by registerComponents() in index.ts
