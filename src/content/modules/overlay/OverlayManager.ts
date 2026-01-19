/**
 * OverlayManager - Manages the DataLayer Lens overlay using Web Components.
 * This replaces the inline HTML rendering with proper Web Components.
 */

import type { DataLayerEvent, Settings } from '@/types';
import type { DLOverlayContainer } from '@/content/overlay/components/DLOverlayContainer';
import type { FilterTag } from '@/content/overlay/components/DLOverlayToolbar';
import { registerComponents, areComponentsRegistered } from '@/content/overlay/components';

/**
 * Ensure Web Components are registered.
 * The customElements registry should already be set via setCustomElementsRegistry()
 * in index.ts before this is called.
 */
async function ensureComponentsRegistered(): Promise<void> {
  if (areComponentsRegistered()) return;

  // Wait for DOM to be ready if still loading
  if (document.readyState === 'loading') {
    await new Promise<void>((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
  }

  // Register all components using the registry that was set in index.ts
  // registerComponents() will use the captured customElements registry
  registerComponents();
}

export interface OverlayCallbacks {
  onClose: () => void;
  onClearEvents: () => void;
  onCollapseToggle: (collapsed: boolean) => void;
  onGroupingToggle: (enabled: boolean) => void;
  onPersistToggle: (enabled: boolean) => void;
  onResize: (height: number) => void;
  onFilterAdd: (filter: string, mode: 'include' | 'exclude') => void;
  onFilterRemove: (filter: string) => void;
  onFilterModeChange: (mode: 'include' | 'exclude', clearFilters: boolean) => void;
  onCopyEvent: (event: DataLayerEvent) => void;
}

export class OverlayManager {
  private overlayRoot: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private overlayContainer: DLOverlayContainer | null = null;
  private callbacks: OverlayCallbacks;
  private interactionTime = 0;

  constructor(callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
    this.setupEventBlocking();
  }

  /**
   * Set up document-level event interception for overlay interactions.
   * This prevents tracking scripts from capturing clicks on the overlay.
   */
  private setupEventBlocking(): void {
    const eventsToBlock = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'];

    eventsToBlock.forEach(eventType => {
      document.addEventListener(eventType, (e: Event) => {
        const path = e.composedPath();
        const isFromOverlay = path.some(
          (el) => el instanceof Element && el.id === 'datalayer-monitor-root'
        );

        if (isFromOverlay) {
          e.stopImmediatePropagation();
          this.interactionTime = Date.now();
        }
      }, true);
    });
  }

  /**
   * Check if a recent interaction was from the overlay.
   * Useful for filtering out resulting dataLayer events.
   */
  public wasRecentOverlayInteraction(withinMs: number = 100): boolean {
    return Date.now() - this.interactionTime < withinMs;
  }

  /**
   * Create and show the overlay.
   */
  public async create(settings: Settings, events: DataLayerEvent[]): Promise<void> {
    if (this.overlayRoot) return;

    // Ensure Web Components are registered before creating
    await ensureComponentsRegistered();

    // Create the overlay root element
    this.overlayRoot = document.createElement('div');
    this.overlayRoot.id = 'datalayer-monitor-root';
    this.overlayRoot.style.cssText = `
      all: initial;
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
    `;

    // Attach shadow DOM
    this.shadowRoot = this.overlayRoot.attachShadow({ mode: 'open' });

    // Add styles for the shadow root
    const styles = document.createElement('style');
    styles.textContent = `
      :host {
        all: initial;
      }

      * {
        box-sizing: border-box;
      }

      dl-overlay-container {
        pointer-events: auto;
      }
    `;
    this.shadowRoot.appendChild(styles);

    // Create the overlay container Web Component
    this.overlayContainer = document.createElement('dl-overlay-container') as DLOverlayContainer;
    this.overlayContainer.settings = settings;
    this.overlayContainer.events = events;
    this.shadowRoot.appendChild(this.overlayContainer);

    // Track interactions
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach(eventType => {
      this.overlayRoot!.addEventListener(eventType, () => {
        this.interactionTime = Date.now();
      });
    });

    // Attach event listeners
    this.attachEventListeners();

    // Add to document
    document.body.appendChild(this.overlayRoot);
  }

  /**
   * Remove the overlay from the DOM.
   */
  public destroy(): void {
    if (this.overlayRoot) {
      this.overlayRoot.remove();
      this.overlayRoot = null;
      this.shadowRoot = null;
      this.overlayContainer = null;
    }
  }

  /**
   * Check if overlay exists.
   */
  public exists(): boolean {
    return this.overlayRoot !== null;
  }

  /**
   * Update the overlay with new settings.
   */
  public updateSettings(settings: Settings): void {
    if (this.overlayContainer) {
      this.overlayContainer.settings = settings;
    }
  }

  /**
   * Update the overlay with new events.
   */
  public updateEvents(events: DataLayerEvent[]): void {
    if (this.overlayContainer) {
      this.overlayContainer.events = events;
    }
  }

  /**
   * Update filter tags with counts.
   * Filters are derived from settings in the container,
   * so this triggers a settings update.
   */
  public updateFilters(_filters: FilterTag[]): void {
    // Filters are derived from settings in the container
    // No separate update needed - settings include eventFilters
  }

  /**
   * Set the collapsed state.
   */
  public setCollapsed(collapsed: boolean): void {
    if (this.overlayContainer) {
      this.overlayContainer.collapsed = collapsed;
    }
  }

  /**
   * Open the filter modal.
   */
  public openFilterModal(): void {
    if (this.overlayContainer) {
      this.overlayContainer.openFilterModal();
    }
  }

  /**
   * Close the filter modal.
   */
  public closeFilterModal(): void {
    if (this.overlayContainer) {
      this.overlayContainer.closeFilterModal();
    }
  }

  /**
   * Attach event listeners to the overlay container.
   */
  private attachEventListeners(): void {
    if (!this.overlayContainer) return;

    // Close overlay
    this.overlayContainer.addEventListener('overlay-close', () => {
      this.callbacks.onClose();
    });

    // Clear events
    this.overlayContainer.addEventListener('clear-events', () => {
      this.callbacks.onClearEvents();
    });

    // Collapse toggle
    this.overlayContainer.addEventListener('collapse-toggle', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.callbacks.onCollapseToggle(detail.collapsed);
    });

    // Grouping toggle
    this.overlayContainer.addEventListener('grouping-toggle', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.callbacks.onGroupingToggle(detail.enabled);
    });

    // Persist toggle
    this.overlayContainer.addEventListener('persist-toggle', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.callbacks.onPersistToggle(detail.enabled);
    });

    // Resize
    this.overlayContainer.addEventListener('resize', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.callbacks.onResize(detail.height);
    });

    // Filter add
    this.overlayContainer.addEventListener('filter-add', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const filter = detail.filter || detail.eventName;
      const mode = detail.mode || 'exclude';
      this.callbacks.onFilterAdd(filter, mode);
    });

    // Filter remove
    this.overlayContainer.addEventListener('filter-remove', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const filter = detail.filter || detail.name;
      this.callbacks.onFilterRemove(filter);
    });

    // Filter mode change
    this.overlayContainer.addEventListener('filter-mode-change', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.callbacks.onFilterModeChange(detail.mode, detail.clearFilters);
    });

    // Copy event
    this.overlayContainer.addEventListener('event-copy', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      this.callbacks.onCopyEvent(detail.event);
    });
  }
}
