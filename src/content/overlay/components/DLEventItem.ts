/**
 * DLEventItem - Web Component for displaying a single dataLayer event.
 * Shows event name, timestamp, category icon, and expandable JSON details.
 */

import { DLBaseComponent, defineComponent } from './DLBaseComponent';
import type { DataLayerEvent } from '@/types';
import { getEventCategory } from '@/types';
import { escapeHtml, syntaxHighlight } from '@/utils/html';

export interface EventItemOptions {
  event: DataLayerEvent;
  expanded?: boolean;
  showTimestamp?: boolean;
  compactMode?: boolean;
}

export class DLEventItem extends DLBaseComponent {
  private _event: DataLayerEvent | null = null;
  private _expanded = false;
  private _showTimestamp = true;

  static get observedAttributes(): string[] {
    return ['expanded', 'show-timestamp', 'compact-mode'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'expanded':
        this._expanded = newValue !== 'false' && newValue !== null;
        break;
      case 'show-timestamp':
        this._showTimestamp = newValue !== 'false';
        break;
      case 'compact-mode':
        // Compact mode is applied via CSS attribute selector, no need for property
        break;
    }
    this.render();
  }

  /**
   * Set the event data to display.
   */
  set event(value: DataLayerEvent | null) {
    this._event = value;
    this.render();
  }

  get event(): DataLayerEvent | null {
    return this._event;
  }

  set expanded(value: boolean) {
    this._expanded = value;
    this.render();
  }

  get expanded(): boolean {
    return this._expanded;
  }

  protected getStyles(): string {
    return `
      :host {
        display: block;
      }

      .event-item {
        background: rgba(30, 30, 50, 0.6);
        border-radius: 8px;
        margin-bottom: 8px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.2s ease;
      }

      .event-item:hover {
        border-color: rgba(255, 255, 255, 0.15);
        background: rgba(35, 35, 55, 0.7);
      }

      .event-item.expanded {
        border-color: var(--category-color, rgba(255, 255, 255, 0.2));
      }

      .event-header {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        cursor: pointer;
        user-select: none;
        gap: 10px;
      }

      .event-header:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .event-icon {
        font-size: 16px;
        flex-shrink: 0;
      }

      .event-info {
        flex: 1;
        min-width: 0;
      }

      .event-name {
        font-weight: 600;
        color: #e2e8f0;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .event-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
        font-size: 10px;
        color: #94a3b8;
      }

      .event-timestamp {
        opacity: 0.7;
      }

      .event-source {
        color: var(--category-color, #64748b);
      }

      .event-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .event-header:hover .event-actions {
        opacity: 1;
      }

      .action-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        color: #94a3b8;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.15s ease;
      }

      .action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #e2e8f0;
      }

      .expand-indicator {
        color: #64748b;
        font-size: 10px;
        transition: transform 0.2s ease;
      }

      .expanded .expand-indicator {
        transform: rotate(90deg);
      }

      .event-content {
        display: none;
        padding: 0 12px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .expanded .event-content {
        display: block;
      }

      .json-container {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 10px;
        margin-top: 8px;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        font-size: 11px;
        line-height: 1.5;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .json-key { color: #9cdcfe; }
      .json-string { color: #ce9178; }
      .json-number { color: #b5cea8; }
      .json-boolean { color: #569cd6; }
      .json-null { color: #569cd6; font-style: italic; }

      /* Compact mode */
      :host([compact-mode]) .event-header {
        padding: 6px 10px;
      }

      :host([compact-mode]) .event-icon {
        font-size: 14px;
      }

      :host([compact-mode]) .event-name {
        font-size: 11px;
      }

      :host([compact-mode]) .event-meta {
        display: none;
      }
    `;
  }

  protected render(): void {
    if (!this._event) {
      this.setContent('');
      return;
    }

    const category = getEventCategory(this._event.event);
    const timestamp = this._showTimestamp ? this.formatTimestamp(this._event.timestamp) : '';
    const expandedClass = this._expanded ? 'expanded' : '';

    const html = `
      <div class="event-item ${expandedClass}" style="--category-color: ${category.color}">
        <div class="event-header" data-action="toggle">
          <span class="event-icon">${category.icon}</span>
          <div class="event-info">
            <div class="event-name">${escapeHtml(this._event.event)}</div>
            <div class="event-meta">
              ${timestamp ? `<span class="event-timestamp">${timestamp}</span>` : ''}
              <span class="event-source">${escapeHtml(this._event.source)}</span>
            </div>
          </div>
          <div class="event-actions">
            <button class="action-btn" data-action="copy" title="Copy JSON">Copy</button>
            <button class="action-btn" data-action="filter-include" title="Include only this event">+</button>
            <button class="action-btn" data-action="filter-exclude" title="Exclude this event">-</button>
          </div>
          <span class="expand-indicator">▶</span>
        </div>
        <div class="event-content">
          <div class="json-container">${syntaxHighlight(this._event.data)}</div>
        </div>
      </div>
    `;

    this.setContent(html);
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
  }

  protected setupEventListeners(): void {
    this.shadow.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');

      if (!action || !this._event) return;

      switch (action) {
        case 'toggle':
          this._expanded = !this._expanded;
          this.render();
          this.emit('event-toggle', { eventId: this._event.id, expanded: this._expanded });
          break;
        case 'copy':
          e.stopPropagation();
          this.emit('event-copy', { event: this._event });
          break;
        case 'filter-include':
          e.stopPropagation();
          this.emit('filter-add', { eventName: this._event.event, mode: 'include' });
          break;
        case 'filter-exclude':
          e.stopPropagation();
          this.emit('filter-add', { eventName: this._event.event, mode: 'exclude' });
          break;
      }
    });
  }
}

defineComponent('dl-event-item', DLEventItem);
