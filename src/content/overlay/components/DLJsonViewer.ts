/**
 * DLJsonViewer - Web Component for displaying syntax-highlighted JSON.
 * Renders JSON objects with collapsible nested structures.
 */

import { DLBaseComponent, defineComponent } from './DLBaseComponent';
import { escapeHtml } from '@/utils/html';

export class DLJsonViewer extends DLBaseComponent {
  private _data: unknown = null;
  private _maxDepth = 10;

  static get observedAttributes(): string[] {
    return ['max-depth'];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'max-depth') {
      this._maxDepth = parseInt(newValue || '10', 10);
      this.render();
    }
  }

  /**
   * Set the data to display.
   */
  set data(value: unknown) {
    this._data = value;
    this.render();
  }

  get data(): unknown {
    return this._data;
  }

  protected getStyles(): string {
    return `
      :host {
        display: block;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        font-size: 11px;
        line-height: 1.5;
      }

      .json-viewer {
        white-space: pre-wrap;
        word-break: break-word;
      }

      .json-key {
        color: #9cdcfe;
      }

      .json-string {
        color: #ce9178;
      }

      .json-number {
        color: #b5cea8;
      }

      .json-boolean {
        color: #569cd6;
      }

      .json-null {
        color: #569cd6;
        font-style: italic;
      }

      .json-bracket {
        color: #ffd700;
      }

      .json-comma {
        color: #808080;
      }

      .json-colon {
        color: #808080;
      }

      .json-line {
        padding-left: calc(var(--indent, 0) * 12px);
      }

      .collapsible {
        cursor: pointer;
        user-select: none;
      }

      .collapsible:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .collapse-indicator {
        display: inline-block;
        width: 12px;
        text-align: center;
        color: #808080;
        margin-right: 4px;
      }

      .collapsed-content {
        display: none;
      }

      .collapsed-preview {
        color: #808080;
        font-style: italic;
      }
    `;
  }

  protected render(): void {
    if (this._data === null || this._data === undefined) {
      this.setContent('<span class="json-null">null</span>');
      return;
    }

    const html = this.renderValue(this._data, 0);
    this.setContent(`<div class="json-viewer">${html}</div>`);
  }

  private renderValue(value: unknown, depth: number): string {
    if (depth > this._maxDepth) {
      return '<span class="json-string">"[Max depth reached]"</span>';
    }

    if (value === null) {
      return '<span class="json-null">null</span>';
    }

    if (value === undefined) {
      return '<span class="json-null">undefined</span>';
    }

    switch (typeof value) {
      case 'string':
        return `<span class="json-string">"${escapeHtml(value)}"</span>`;
      case 'number':
        return `<span class="json-number">${value}</span>`;
      case 'boolean':
        return `<span class="json-boolean">${value}</span>`;
      case 'object':
        if (Array.isArray(value)) {
          return this.renderArray(value, depth);
        }
        return this.renderObject(value as Record<string, unknown>, depth);
      default:
        return `<span class="json-string">"${escapeHtml(String(value))}"</span>`;
    }
  }

  private renderArray(arr: unknown[], depth: number): string {
    if (arr.length === 0) {
      return '<span class="json-bracket">[]</span>';
    }

    const items = arr.map((item, index) => {
      const comma = index < arr.length - 1 ? '<span class="json-comma">,</span>' : '';
      return `<div class="json-line" style="--indent: ${depth + 1}">${this.renderValue(item, depth + 1)}${comma}</div>`;
    }).join('');

    return `<span class="json-bracket">[</span>${items}<div class="json-line" style="--indent: ${depth}"><span class="json-bracket">]</span></div>`;
  }

  private renderObject(obj: Record<string, unknown>, depth: number): string {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-bracket">{}</span>';
    }

    const items = keys.map((key, index) => {
      const comma = index < keys.length - 1 ? '<span class="json-comma">,</span>' : '';
      const value = this.renderValue(obj[key], depth + 1);
      return `<div class="json-line" style="--indent: ${depth + 1}"><span class="json-key">"${escapeHtml(key)}"</span><span class="json-colon">: </span>${value}${comma}</div>`;
    }).join('');

    return `<span class="json-bracket">{</span>${items}<div class="json-line" style="--indent: ${depth}"><span class="json-bracket">}</span></div>`;
  }

  protected setupEventListeners(): void {
    // Future: Add click handlers for collapsible sections
  }
}

defineComponent('dl-json-viewer', DLJsonViewer);
