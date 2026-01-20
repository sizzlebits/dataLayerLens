/**
 * DLOverlayHeader - Web Component for the overlay header.
 * Contains title, event count, and action buttons.
 */

import { DLBaseComponent } from './DLBaseComponent';

export interface HeaderOptions {
  eventCount: number;
  collapsed: boolean;
  groupingEnabled: boolean;
  persistEnabled: boolean;
}

export class DLOverlayHeader extends DLBaseComponent {
  private _eventCount = 0;
  private _collapsed = false;
  private _groupingEnabled = false;
  private _persistEnabled = false;
  private _sidepanel = false;

  static get observedAttributes(): string[] {
    return ['event-count', 'collapsed', 'grouping-enabled', 'persist-enabled', 'sidepanel'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'event-count':
        this._eventCount = parseInt(newValue || '0', 10);
        break;
      case 'collapsed':
        this._collapsed = newValue !== 'false' && newValue !== null;
        break;
      case 'grouping-enabled':
        this._groupingEnabled = newValue !== 'false' && newValue !== null;
        break;
      case 'persist-enabled':
        this._persistEnabled = newValue !== 'false' && newValue !== null;
        break;
      case 'sidepanel':
        this._sidepanel = newValue !== 'false' && newValue !== null;
        break;
    }
    this.scheduleRender();
  }

  set eventCount(value: number) {
    this._eventCount = value;
    this.updateElement('.event-count', String(value));
  }

  get eventCount(): number {
    return this._eventCount;
  }

  set collapsed(value: boolean) {
    this._collapsed = value;
    this.scheduleRender();
  }

  get collapsed(): boolean {
    return this._collapsed;
  }

  protected getStyles(): string {
    return `
      :host {
        display: block;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo svg {
        width: 100%;
        height: 100%;
      }

      .title {
        font-weight: 600;
        font-size: 13px;
        color: #e2e8f0;
        letter-spacing: -0.01em;
      }

      .event-count {
        background: rgba(99, 102, 241, 0.3);
        color: #a5b4fc;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .action-btn {
        background: transparent;
        border: none;
        border-radius: 4px;
        padding: 4px;
        cursor: pointer;
        color: #94a3b8;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #e2e8f0;
      }

      .action-btn.active {
        color: #6366f1;
        background: rgba(99, 102, 241, 0.15);
      }

      .action-btn svg {
        width: 14px;
        height: 14px;
      }

      .collapse-btn {
        transition: transform 0.2s ease;
      }

      .collapse-btn.collapsed {
        transform: rotate(180deg);
      }

      /* Minimized state */
      :host([collapsed]) .header {
        padding: 8px 10px;
      }

      :host([collapsed]) .title,
      :host([collapsed]) .header-actions {
        display: none;
      }
    `;
  }

  protected render(): void {
    // In sidepanel mode, hide collapse and close buttons
    const collapseBtn = this._sidepanel ? '' : `
      <button class="action-btn collapse-btn ${this._collapsed ? 'collapsed' : ''}" data-action="toggle-collapse" title="${this._collapsed ? 'Expand' : 'Collapse'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18,15 12,9 6,15"/>
        </svg>
      </button>
    `;

    const closeBtn = this._sidepanel ? '' : `
      <button class="action-btn" data-action="close" title="Close overlay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    const html = `
      <div class="header">
        <div class="header-left">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6366f1"/>
            </svg>
          </div>
          <span class="title">DataLayer Lens</span>
          <span class="event-count">${this._eventCount}</span>
        </div>
        <div class="header-actions">
          <button class="action-btn ${this._groupingEnabled ? 'active' : ''}" data-action="toggle-grouping" title="Toggle grouping">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button class="action-btn ${this._persistEnabled ? 'active' : ''}" data-action="toggle-persist" title="Persist events">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </button>
          <button class="action-btn" data-action="clear" title="Clear events">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
          ${collapseBtn}
          ${closeBtn}
        </div>
      </div>
    `;

    this.setContent(html);
  }

  protected setupEventListeners(): void {
    this.shadow.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const actionBtn = target.closest('[data-action]');
      if (!actionBtn) return;

      const action = actionBtn.getAttribute('data-action');

      switch (action) {
        case 'toggle-grouping':
          this._groupingEnabled = !this._groupingEnabled;
          this.emit('grouping-toggle', { enabled: this._groupingEnabled });
          this.render();
          break;
        case 'toggle-persist':
          this._persistEnabled = !this._persistEnabled;
          this.emit('persist-toggle', { enabled: this._persistEnabled });
          this.render();
          break;
        case 'clear':
          this.emit('clear-events');
          break;
        case 'toggle-collapse':
          this._collapsed = !this._collapsed;
          this.emit('collapse-toggle', { collapsed: this._collapsed });
          this.render();
          break;
        case 'close':
          this.emit('overlay-close');
          break;
      }
    });
  }
}

// Registration handled by registerComponents() in index.ts
