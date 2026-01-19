/**
 * DLFilterModal - Web Component for managing event filters.
 * Allows users to include/exclude specific event types.
 */

import { DLBaseComponent } from './DLBaseComponent';
import { escapeHtml } from '@/utils/html';

export interface FilterModalOptions {
  eventFilters: string[];
  filterMode: 'include' | 'exclude';
  availableEvents: string[];
  commonEvents: string[];
}

export class DLFilterModal extends DLBaseComponent {
  private _eventFilters: string[] = [];
  private _filterMode: 'include' | 'exclude' = 'exclude';
  private _availableEvents: string[] = [];
  private _commonEvents: string[] = [];
  private _searchText = '';
  private _visible = false;

  static get observedAttributes(): string[] {
    return ['filter-mode', 'visible'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'filter-mode':
        this._filterMode = (newValue as 'include' | 'exclude') || 'exclude';
        break;
      case 'visible':
        this._visible = newValue !== 'false' && newValue !== null;
        break;
    }
    this.scheduleRender();
  }

  set eventFilters(value: string[]) {
    this._eventFilters = value;
    this.scheduleRender();
  }

  get eventFilters(): string[] {
    return this._eventFilters;
  }

  set filterMode(value: 'include' | 'exclude') {
    this._filterMode = value;
    this.scheduleRender();
  }

  get filterMode(): 'include' | 'exclude' {
    return this._filterMode;
  }

  set availableEvents(value: string[]) {
    this._availableEvents = value;
    this.scheduleRender();
  }

  get availableEvents(): string[] {
    return this._availableEvents;
  }

  set commonEvents(value: string[]) {
    this._commonEvents = value;
  }

  get commonEvents(): string[] {
    return this._commonEvents;
  }

  set visible(value: boolean) {
    this._visible = value;
    if (value && this.isConnected) {
      this.setAttribute('visible', '');
      this._searchText = '';
      this.scheduleRender();
      // Focus search input after render
      requestAnimationFrame(() => {
        const input = this.$('.filter-search-input') as HTMLInputElement;
        if (input) input.focus();
      });
    } else {
      this.removeAttribute('visible');
    }
  }

  get visible(): boolean {
    return this._visible;
  }

  private getFilteredSuggestions(): string[] {
    // Use captured events if available, otherwise fall back to common events
    const events = this._availableEvents.length > 0 ? this._availableEvents : this._commonEvents;

    // Filter by search text
    const filtered = this._searchText
      ? events.filter(e => e.toLowerCase().includes(this._searchText.toLowerCase()))
      : events;

    // Sort alphabetically and limit
    return filtered.sort((a, b) => a.localeCompare(b)).slice(0, 50);
  }

  private countEventsMatching(pattern: string): number {
    return this._availableEvents.filter(e =>
      e.toLowerCase().includes(pattern.toLowerCase())
    ).length;
  }

  protected getStyles(): string {
    return `
      :host {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483647;
        pointer-events: auto;
      }

      :host([visible]) {
        display: flex;
      }

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
        animation: fadeIn 0.15s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
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
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      .filter-modal-close:hover {
        color: #e2e8f0;
        background: rgba(255, 255, 255, 0.1);
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
        box-sizing: border-box;
      }

      .filter-search-input::placeholder {
        color: #64748b;
      }

      .filter-search-input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
      }

      .filter-suggestions {
        flex: 1;
        max-height: 200px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
      }

      .filter-suggestions::-webkit-scrollbar {
        width: 6px;
      }

      .filter-suggestions::-webkit-scrollbar-track {
        background: transparent;
      }

      .filter-suggestions::-webkit-scrollbar-thumb {
        background: rgba(99, 102, 241, 0.3);
        border-radius: 3px;
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

      .filter-suggestion-name {
        color: #e2e8f0;
        font-size: 11px;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .filter-count {
        font-size: 9px;
        opacity: 0.6;
        margin-left: 4px;
      }

      .filter-suggestion-action {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
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
        background: rgba(34, 197, 94, 0.3);
      }

      .filter-suggestion-btn.remove {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
      }

      .filter-suggestion-btn.remove:hover {
        background: rgba(239, 68, 68, 0.3);
      }

      .filter-custom-add {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .filter-custom-add input {
        flex: 1;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #e2e8f0;
        font-size: 11px;
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
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .filter-custom-add button:hover {
        background: rgba(99, 102, 241, 0.3);
      }

      .empty-suggestions {
        padding: 20px;
        text-align: center;
        color: #64748b;
        font-size: 11px;
      }
    `;
  }

  protected render(): void {
    const suggestions = this.getFilteredSuggestions();
    const showHint = this._availableEvents.length === 0 && !this._searchText;

    const suggestionsHtml = suggestions.length > 0
      ? suggestions.map(eventName => {
          const isInFilter = this._eventFilters.includes(eventName);
          const count = this.countEventsMatching(eventName);
          return `
            <div class="filter-suggestion">
              <span class="filter-suggestion-name">${escapeHtml(eventName)}<span class="filter-count">(${count})</span></span>
              <div class="filter-suggestion-action">
                ${isInFilter
                  ? `<button class="filter-suggestion-btn remove" data-action="remove-filter" data-filter="${escapeHtml(eventName)}">Remove</button>`
                  : `<button class="filter-suggestion-btn add" data-action="add-filter" data-filter="${escapeHtml(eventName)}">Add</button>`
                }
              </div>
            </div>
          `;
        }).join('')
      : `<div class="empty-suggestions">No matching events found</div>`;

    const hintHtml = showHint
      ? `<div class="filter-hint">Common events shown as placeholders. Captured events will appear here once detected.</div>`
      : '';

    const html = `
      <div class="filter-modal-backdrop" data-action="close-backdrop">
        <div class="filter-modal">
          <div class="filter-modal-header">
            <span class="filter-modal-title">Manage Filters</span>
            <button class="filter-modal-close" data-action="close-filter-modal" title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="filter-mode-toggle">
            <button class="filter-mode-btn include ${this._filterMode === 'include' ? 'active' : ''}" data-action="set-filter-mode" data-mode="include">
              + Include Only
            </button>
            <button class="filter-mode-btn exclude ${this._filterMode === 'exclude' ? 'active' : ''}" data-action="set-filter-mode" data-mode="exclude">
              - Exclude
            </button>
          </div>
          <div class="filter-search-container">
            <input type="text" class="filter-search-input" placeholder="Search events..." value="${escapeHtml(this._searchText)}" />
          </div>
          <div class="filter-suggestions">
            ${hintHtml}
            ${suggestionsHtml}
          </div>
          <div class="filter-custom-add">
            <input type="text" class="filter-custom-input" placeholder="Custom event name..." />
            <button data-action="add-custom-filter">Add</button>
          </div>
        </div>
      </div>
    `;

    this.setContent(html);
  }

  protected setupEventListeners(): void {
    // Click handlers
    this.shadow.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const actionBtn = target.closest('[data-action]') as HTMLElement;

      if (!actionBtn) return;

      const action = actionBtn.getAttribute('data-action');

      switch (action) {
        case 'close-backdrop':
          // Only close if clicking directly on backdrop
          if (target.classList.contains('filter-modal-backdrop')) {
            this.visible = false;
            this.emit('filter-modal-close');
          }
          break;

        case 'close-filter-modal':
          this.visible = false;
          this.emit('filter-modal-close');
          break;

        case 'set-filter-mode': {
          const mode = actionBtn.getAttribute('data-mode') as 'include' | 'exclude';
          if (mode && mode !== this._filterMode) {
            this._filterMode = mode;
            this.emit('filter-mode-change', { mode, clearFilters: true });
            this.render();
          }
          break;
        }

        case 'add-filter': {
          const filter = actionBtn.getAttribute('data-filter');
          if (filter && !this._eventFilters.includes(filter)) {
            this.emit('filter-add', { filter, mode: this._filterMode });
          }
          break;
        }

        case 'remove-filter': {
          const filter = actionBtn.getAttribute('data-filter');
          if (filter) {
            this.emit('filter-remove', { filter });
          }
          break;
        }

        case 'add-custom-filter': {
          const customInput = this.$('.filter-custom-input') as HTMLInputElement;
          if (customInput && customInput.value.trim()) {
            const filter = customInput.value.trim();
            if (!this._eventFilters.includes(filter)) {
              this.emit('filter-add', { filter, mode: this._filterMode });
              customInput.value = '';
            }
          }
          break;
        }
      }
    });

    // Search input handler
    this.shadow.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('filter-search-input')) {
        this._searchText = target.value;
        // Re-render suggestions only
        const suggestionsContainer = this.$('.filter-suggestions');
        if (suggestionsContainer) {
          const suggestions = this.getFilteredSuggestions();
          const showHint = this._availableEvents.length === 0 && !this._searchText;

          const suggestionsHtml = suggestions.length > 0
            ? suggestions.map(eventName => {
                const isInFilter = this._eventFilters.includes(eventName);
                const count = this.countEventsMatching(eventName);
                return `
                  <div class="filter-suggestion">
                    <span class="filter-suggestion-name">${escapeHtml(eventName)}<span class="filter-count">(${count})</span></span>
                    <div class="filter-suggestion-action">
                      ${isInFilter
                        ? `<button class="filter-suggestion-btn remove" data-action="remove-filter" data-filter="${escapeHtml(eventName)}">Remove</button>`
                        : `<button class="filter-suggestion-btn add" data-action="add-filter" data-filter="${escapeHtml(eventName)}">Add</button>`
                      }
                    </div>
                  </div>
                `;
              }).join('')
            : `<div class="empty-suggestions">No matching events found</div>`;

          const hintHtml = showHint
            ? `<div class="filter-hint">Common events shown as placeholders. Captured events will appear here once detected.</div>`
            : '';

          suggestionsContainer.innerHTML = hintHtml + suggestionsHtml;
        }
      }
    });

    // Enter key on custom input
    this.shadow.addEventListener('keydown', ((e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('filter-custom-input') && e.key === 'Enter') {
        const filter = target.value.trim();
        if (filter && !this._eventFilters.includes(filter)) {
          this.emit('filter-add', { filter, mode: this._filterMode });
          target.value = '';
        }
      }
      // Escape to close modal
      if (e.key === 'Escape') {
        this.visible = false;
        this.emit('filter-modal-close');
      }
    }) as EventListener);
  }
}

// Registration handled by registerComponents() in index.ts
