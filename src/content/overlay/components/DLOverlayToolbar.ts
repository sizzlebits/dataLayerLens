/**
 * DLOverlayToolbar - Web Component for the overlay toolbar.
 * Contains search input and filter controls.
 */

import { DLBaseComponent } from './DLBaseComponent';
import { escapeHtml } from '@/utils/html';

export interface FilterTag {
  name: string;
  count: number;
}

export interface ToolbarOptions {
  searchText: string;
  filters: FilterTag[];
  filterMode: 'include' | 'exclude';
}

export class DLOverlayToolbar extends DLBaseComponent {
  private _searchText = '';
  private _filters: FilterTag[] = [];
  private _filterMode: 'include' | 'exclude' = 'exclude';

  static get observedAttributes(): string[] {
    return ['search-text', 'filter-mode'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    switch (name) {
      case 'search-text':
        this._searchText = newValue || '';
        break;
      case 'filter-mode':
        this._filterMode = (newValue as 'include' | 'exclude') || 'exclude';
        break;
    }
    this.scheduleRender();
  }

  set searchText(value: string) {
    this._searchText = value;
    const input = this.$('.search-input') as HTMLInputElement;
    if (input && input.value !== value) {
      input.value = value;
    }
  }

  get searchText(): string {
    return this._searchText;
  }

  set filters(value: FilterTag[]) {
    this._filters = value;
    this.scheduleRender();
  }

  get filters(): FilterTag[] {
    return this._filters;
  }

  set filterMode(value: 'include' | 'exclude') {
    this._filterMode = value;
    this.scheduleRender();
  }

  get filterMode(): 'include' | 'exclude' {
    return this._filterMode;
  }

  protected getStyles(): string {
    return `
      :host {
        display: block;
      }

      .toolbar {
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 15, 35, 0.3);
      }

      .search-container {
        position: relative;
        margin-bottom: 8px;
      }

      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        pointer-events: none;
      }

      .search-icon svg {
        width: 14px;
        height: 14px;
      }

      .search-input {
        width: 100%;
        padding: 8px 10px 8px 32px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #e2e8f0;
        font-size: 12px;
        outline: none;
        transition: all 0.15s ease;
      }

      .search-input::placeholder {
        color: #64748b;
      }

      .search-input:focus {
        border-color: rgba(99, 102, 241, 0.5);
        background: rgba(255, 255, 255, 0.08);
      }

      .clear-search {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 2px;
        display: none;
      }

      .search-input:not(:placeholder-shown) ~ .clear-search {
        display: block;
      }

      .clear-search:hover {
        color: #e2e8f0;
      }

      .filter-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        flex: 1;
      }

      .filter-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
      }

      .filter-tag.include {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }

      .filter-tag.exclude {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .filter-tag-remove {
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        opacity: 0.7;
      }

      .filter-tag-remove:hover {
        opacity: 1;
      }

      .filter-tag-remove svg {
        width: 10px;
        height: 10px;
      }

      .filter-count {
        opacity: 0.7;
        margin-left: 2px;
      }

      .add-filter-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 3px 10px;
        color: #94a3b8;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }

      .add-filter-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        color: #e2e8f0;
      }

      .add-filter-btn svg {
        width: 10px;
        height: 10px;
      }

      .empty-filters {
        color: #64748b;
        font-size: 10px;
        font-style: italic;
      }
    `;
  }

  protected render(): void {
    const filterTagsHtml = this._filters.length > 0
      ? this._filters.map(filter => `
          <span class="filter-tag ${this._filterMode}">
            ${this._filterMode === 'exclude' ? '−' : '+'} ${escapeHtml(filter.name)}
            <span class="filter-count">(${filter.count})</span>
            <button class="filter-tag-remove" data-action="remove-filter" data-filter="${escapeHtml(filter.name)}" title="Remove filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </span>
        `).join('')
      : '<span class="empty-filters">No filters</span>';

    const html = `
      <div class="toolbar">
        <div class="search-container">
          <span class="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" class="search-input" placeholder="Search events..." value="${escapeHtml(this._searchText)}">
          <button class="clear-search" data-action="clear-search">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="filter-container">
          <div class="filter-tags">
            ${filterTagsHtml}
          </div>
          <button class="add-filter-btn" data-action="open-filter-modal" title="Add filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Filter
          </button>
        </div>
      </div>
    `;

    this.setContent(html);
  }

  protected setupEventListeners(): void {
    // Search input
    this.shadow.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('search-input')) {
        this._searchText = target.value;
        this.emit('search-change', { text: this._searchText });
      }
    });

    // Click handlers
    this.shadow.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const actionBtn = target.closest('[data-action]');
      if (!actionBtn) return;

      const action = actionBtn.getAttribute('data-action');

      switch (action) {
        case 'clear-search': {
          this._searchText = '';
          const input = this.$('.search-input') as HTMLInputElement;
          if (input) input.value = '';
          this.emit('search-change', { text: '' });
          break;
        }
        case 'remove-filter': {
          const filterName = actionBtn.getAttribute('data-filter');
          if (filterName) {
            this.emit('filter-remove', { name: filterName });
          }
          break;
        }
        case 'open-filter-modal':
          this.emit('filter-modal-open');
          break;
      }
    });

    // Keyboard shortcuts
    this.shadow.addEventListener('keydown', ((e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('search-input') && e.key === 'Escape') {
        target.blur();
        this._searchText = '';
        target.value = '';
        this.emit('search-change', { text: '' });
      }
    }) as EventListener);
  }
}

// Registration handled by registerComponents() in index.ts
