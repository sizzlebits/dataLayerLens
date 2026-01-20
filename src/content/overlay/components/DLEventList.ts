/**
 * DLEventList - Web Component for displaying a list of dataLayer events.
 * Handles rendering, pagination, and event interactions.
 */

import { DLBaseComponent } from './DLBaseComponent';
import type { DataLayerEvent } from '@/types';
// DLEventItem is registered by registerComponents() in index.ts

export interface EventListOptions {
  events: DataLayerEvent[];
  expandedIds?: Set<string>;
  showTimestamps?: boolean;
  compactMode?: boolean;
  pageSize?: number;
  currentPage?: number;
}

export class DLEventList extends DLBaseComponent {
  private _events: DataLayerEvent[] = [];
  private _expandedIds: Set<string> = new Set();
  private _showTimestamps = true;
  private _compactMode = false;
  private _pageSize = 50;
  private _currentPage = 0;

  static get observedAttributes(): string[] {
    return ['show-timestamps', 'compact-mode', 'page-size'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'show-timestamps':
        this._showTimestamps = newValue !== 'false';
        break;
      case 'compact-mode':
        this._compactMode = newValue !== 'false' && newValue !== null;
        break;
      case 'page-size':
        this._pageSize = parseInt(newValue || '50', 10);
        break;
    }
    this.scheduleRender();
  }

  /**
   * Set the events to display.
   */
  set events(value: DataLayerEvent[]) {
    this._events = value;
    this.scheduleRender();
  }

  get events(): DataLayerEvent[] {
    return this._events;
  }

  /**
   * Set expanded event IDs.
   */
  set expandedIds(value: Set<string>) {
    this._expandedIds = value;
    this.scheduleRender();
  }

  get expandedIds(): Set<string> {
    return this._expandedIds;
  }

  set currentPage(value: number) {
    this._currentPage = value;
    this.scheduleRender();
  }

  get currentPage(): number {
    return this._currentPage;
  }

  get totalPages(): number {
    return Math.ceil(this._events.length / this._pageSize);
  }

  protected getStyles(): string {
    return `
      :host {
        display: block;
        height: 100%;
        overflow: hidden;
      }

      .event-list-container {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .event-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .event-list::-webkit-scrollbar {
        width: 6px;
      }

      .event-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .event-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .event-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #64748b;
        text-align: center;
        padding: 20px;
      }

      .empty-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .empty-text {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .empty-hint {
        font-size: 12px;
        opacity: 0.7;
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 15, 35, 0.5);
      }

      .pagination-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        color: #e2e8f0;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s ease;
      }

      .pagination-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
      }

      .pagination-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .pagination-info {
        font-size: 11px;
        color: #94a3b8;
      }
    `;
  }

  protected render(): void {
    const start = this._currentPage * this._pageSize;
    const end = start + this._pageSize;
    const pagedEvents = this._events.slice(start, end);
    const showPagination = this._events.length > this._pageSize;

    if (this._events.length === 0) {
      this.setContent(`
        <div class="event-list-container">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">No events captured yet</div>
            <div class="empty-hint">Waiting for dataLayer pushes...</div>
          </div>
        </div>
      `);
      return;
    }

    const eventsHtml = pagedEvents.map((event, index) => {
      const expanded = this._expandedIds.has(event.id);
      // Events are sorted newest first, so invert to get original capture order
      const eventNumber = this._events.length - 1 - (start + index);
      return `
        <dl-event-item
          data-event-id="${event.id}"
          event-index="${eventNumber}"
          ${expanded ? 'expanded' : ''}
          ${this._showTimestamps ? 'show-timestamp' : ''}
          ${this._compactMode ? 'compact-mode' : ''}
        ></dl-event-item>
      `;
    }).join('');

    const paginationHtml = showPagination ? `
      <div class="pagination">
        <button class="pagination-btn" data-action="prev-page" ${this._currentPage === 0 ? 'disabled' : ''}>
          ← Prev
        </button>
        <span class="pagination-info">
          ${start + 1}-${Math.min(end, this._events.length)} of ${this._events.length}
        </span>
        <button class="pagination-btn" data-action="next-page" ${end >= this._events.length ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    ` : '';

    this.setContent(`
      <div class="event-list-container">
        <div class="event-list">${eventsHtml}</div>
        ${paginationHtml}
      </div>
    `);

    // Set event data on each event item
    this.shadow.querySelectorAll('dl-event-item').forEach((item, index) => {
      const eventItem = item as HTMLElement & { event: DataLayerEvent };
      eventItem.event = pagedEvents[index];
    });
  }

  protected setupEventListeners(): void {
    // Handle pagination clicks
    this.shadow.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');

      if (action === 'prev-page' && this._currentPage > 0) {
        this._currentPage--;
        this.render();
        this.emit('page-change', { page: this._currentPage });
      } else if (action === 'next-page' && this._currentPage < this.totalPages - 1) {
        this._currentPage++;
        this.render();
        this.emit('page-change', { page: this._currentPage });
      }
    });

    // Re-emit events from child event items
    this.shadow.addEventListener('event-toggle', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.expanded) {
        this._expandedIds.add(detail.eventId);
      } else {
        this._expandedIds.delete(detail.eventId);
      }
      this.emit('event-toggle', detail);
    });

    this.shadow.addEventListener('event-copy', (e: Event) => {
      this.emit('event-copy', (e as CustomEvent).detail);
    });

    this.shadow.addEventListener('filter-add', (e: Event) => {
      this.emit('filter-add', (e as CustomEvent).detail);
    });
  }
}

// Registration handled by registerComponents() in index.ts
