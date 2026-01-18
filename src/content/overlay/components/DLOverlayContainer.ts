/**
 * DLOverlayContainer - Main Web Component container for the DataLayer Lens overlay.
 * Orchestrates header, toolbar, and event list components.
 */

import { DLBaseComponent, defineComponent } from './DLBaseComponent';
import type { DataLayerEvent, Settings } from '@/types';
import './DLOverlayHeader';
import './DLOverlayToolbar';
import './DLEventList';
import type { FilterTag } from './DLOverlayToolbar';

export interface OverlayState {
  events: DataLayerEvent[];
  settings: Settings;
  collapsed: boolean;
  searchText: string;
  filters: FilterTag[];
  expandedEventIds: Set<string>;
}

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

  static get observedAttributes(): string[] {
    return ['collapsed', 'anchor-vertical', 'anchor-horizontal', 'height'];
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
    }
    this.render();
  }

  set events(value: DataLayerEvent[]) {
    this._events = value;
    this.updateEventList();
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
    this.render();
  }

  get settings(): Settings | null {
    return this._settings;
  }

  set collapsed(value: boolean) {
    this._collapsed = value;
    this.render();
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

    // Update host attributes for CSS positioning
    this.setAttribute('anchor-vertical', this._anchor.vertical);
    this.setAttribute('anchor-horizontal', this._anchor.horizontal);
    if (this._collapsed) {
      this.setAttribute('collapsed', '');
    } else {
      this.removeAttribute('collapsed');
    }

    const bodyStyle = this._collapsed ? '' : `style="height: ${this._height}px"`;

    const html = `
      <div class="overlay ${this._collapsed ? 'collapsed' : ''}">
        <div class="resize-handle" data-action="resize">
          <div class="resize-handle-line"></div>
        </div>
        <dl-overlay-header
          event-count="${eventCount}"
          ${this._collapsed ? 'collapsed' : ''}
          ${groupingEnabled ? 'grouping-enabled' : ''}
          ${persistEnabled ? 'persist-enabled' : ''}
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
    `;

    this.setContent(html);

    // Set complex data on child components
    this.updateEventList();
    this.updateToolbarFilters();
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

    this.shadow.addEventListener('filter-remove', (e: Event) => {
      this.emit('filter-remove', (e as CustomEvent).detail);
    });

    this.shadow.addEventListener('filter-modal-open', () => {
      this.emit('filter-modal-open');
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
      this.emit('filter-add', (e as CustomEvent).detail);
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

defineComponent('dl-overlay-container', DLOverlayContainer);
