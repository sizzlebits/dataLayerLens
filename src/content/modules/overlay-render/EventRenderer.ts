/**
 * Event rendering utilities for the DataLayer Lens overlay.
 * Handles creating event elements, HTML escaping, and JSON syntax highlighting.
 */

import { DataLayerEvent, getEventCategory } from '@/types';
import { escapeHtml, syntaxHighlight } from '@/utils/html';

// Re-export shared utilities for backwards compatibility
export { getEventCategory, escapeHtml, syntaxHighlight };

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
