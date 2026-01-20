/**
 * Event rendering utilities for the DataLayer Lens overlay.
 * Handles creating event elements, HTML escaping, and JSON syntax highlighting.
 */

import { DataLayerEvent } from '@/types';

// Event categories for colorful display
const EVENT_CATEGORIES: Record<string, { color: string; icon: string }> = {
  'gtm.js': { color: '#22d3ee', icon: '🚀' },
  'gtm.dom': { color: '#10b981', icon: '📄' },
  'gtm.load': { color: '#8b5cf6', icon: '✅' },
  'gtm.click': { color: '#f59e0b', icon: '👆' },
  'gtm.linkClick': { color: '#f59e0b', icon: '🔗' },
  'gtm.formSubmit': { color: '#ef4444', icon: '📝' },
  'gtm.historyChange': { color: '#ec4899', icon: '🔄' },
  'gtm.scrollDepth': { color: '#14b8a6', icon: '📜' },
  'gtm.timer': { color: '#6366f1', icon: '⏱️' },
  'gtm.video': { color: '#dc2626', icon: '🎬' },
  page_view: { color: '#3b82f6', icon: '👁️' },
  view_item: { color: '#8b5cf6', icon: '🛍️' },
  add_to_cart: { color: '#10b981', icon: '🛒' },
  purchase: { color: '#22c55e', icon: '💰' },
  begin_checkout: { color: '#f59e0b', icon: '💳' },
  sign_up: { color: '#06b6d4', icon: '✨' },
  login: { color: '#6366f1', icon: '🔐' },
  search: { color: '#a855f7', icon: '🔍' },
};

const DEFAULT_CATEGORY = { color: '#64748b', icon: '📌' };

/**
 * Get event category info (color and icon) for an event name.
 */
export function getEventCategory(eventName: string): { color: string; icon: string } {
  // Check for exact match
  if (EVENT_CATEGORIES[eventName]) {
    return EVENT_CATEGORIES[eventName];
  }

  // Check for partial matches
  const lower = eventName.toLowerCase();
  if (lower.includes('click')) return EVENT_CATEGORIES['gtm.click'];
  if (lower.includes('view')) return EVENT_CATEGORIES['page_view'];
  if (lower.includes('cart')) return EVENT_CATEGORIES['add_to_cart'];
  if (lower.includes('purchase') || lower.includes('transaction')) return EVENT_CATEGORIES['purchase'];
  if (lower.includes('search')) return EVENT_CATEGORIES['search'];
  if (lower.includes('scroll')) return EVENT_CATEGORIES['gtm.scrollDepth'];
  if (lower.includes('video')) return EVENT_CATEGORIES['gtm.video'];
  if (lower.includes('form') || lower.includes('submit')) return EVENT_CATEGORIES['gtm.formSubmit'];

  return DEFAULT_CATEGORY;
}

/**
 * Escape HTML to prevent XSS.
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Syntax highlight a JSON object for display.
 */
export function syntaxHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

export interface CreateEventElementOptions {
  isNew: boolean;
  isGrouped: boolean;
  showTimestamps: boolean;
  isExpanded: boolean;
}

/**
 * Create a DOM element for displaying a single event.
 */
export function createEventElement(
  event: DataLayerEvent,
  options: CreateEventElementOptions
): HTMLElement {
  const { isNew, isGrouped, showTimestamps, isExpanded } = options;
  const category = getEventCategory(event.event);
  const time = new Date(event.timestamp).toLocaleTimeString();

  const div = document.createElement('div');
  div.className = `event-item${isNew ? ' new' : ''}${isExpanded ? ' expanded' : ''}${isGrouped ? ' grouped' : ''}`;
  div.dataset.eventId = event.id;

  div.innerHTML = `
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
      <span class="event-source">${event.dataLayerIndex !== undefined ? `<span class="event-index">#${event.dataLayerIndex}</span>` : ''}${escapeHtml(event.source)}</span>
      ${showTimestamps ? `<span class="event-time">${time}</span>` : ''}
    </div>
    <div class="event-data">${syntaxHighlight(event.data)}</div>
  `;

  return div;
}
