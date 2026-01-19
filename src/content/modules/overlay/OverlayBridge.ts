/**
 * OverlayBridge - Communicates with the overlay script running in MAIN world.
 * Uses postMessage to send commands and receive events.
 *
 * This replaces direct OverlayManager usage when Web Components need MAIN world access.
 * The overlay script is dynamically injected only when needed (not on every page).
 */

import type { DataLayerEvent, Settings } from '@/types';
import type { OverlayCallbacks } from './OverlayManager';

// Browser API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Bridge for communicating with the MAIN world overlay script.
 */
export class OverlayBridge {
  private callbacks: OverlayCallbacks;
  private overlayReady = false;
  private overlayExists = false;
  private interactionTime = 0;
  private scriptInjected = false;
  private pendingCreate: { settings: Settings; events: DataLayerEvent[] } | null = null;

  constructor(callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
    this.setupMessageListener();
  }

  /**
   * Set up listener for messages from the MAIN world overlay script.
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Only accept messages from the same window
      if (event.source !== window) return;

      const message = event.data;

      // Only process messages from our overlay script
      // Guard against null/undefined and non-object messages
      if (message === null || message === undefined || typeof message !== 'object') return;
      if (message.source !== 'datalayer-lens-overlay') return;

      this.handleOverlayMessage(message);
    });
  }

  /**
   * Inject the overlay script into MAIN world using script.src.
   * We use script.src (not inline) to comply with CSP policies that block inline scripts.
   * The script will notify us when loaded via OVERLAY_SCRIPT_LOADED message.
   */
  private injectOverlayScript(): void {
    if (this.scriptInjected) return;
    this.scriptInjected = true;

    try {
      const script = document.createElement('script');
      script.src = browserAPI.runtime.getURL('overlay.js');

      // Handle load errors
      script.onerror = () => {
        console.error('[DataLayer Lens] Failed to load overlay script');
        this.scriptInjected = false; // Allow retry
      };

      // Inject into page (runs in MAIN world)
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      this.scriptInjected = false; // Allow retry
      console.error('[DataLayer Lens] Error injecting overlay script:', error);
    }
  }

  /**
   * Handle messages from the overlay script.
   */
  private handleOverlayMessage(message: { type: string; payload?: unknown }): void {
    switch (message.type) {
      case 'OVERLAY_SCRIPT_LOADED':
        this.overlayReady = true;
        // If we have a pending create, send it now (deferred to avoid blocking)
        if (this.pendingCreate) {
          const pending = this.pendingCreate;
          this.pendingCreate = null;
          // Use setTimeout to avoid blocking the message handler
          setTimeout(() => {
            this.sendToOverlay('CREATE_OVERLAY', pending);
          }, 0);
        }
        break;

      case 'OVERLAY_READY':
        this.overlayExists = true;
        break;

      case 'OVERLAY_EXISTS': {
        const payload = message.payload as { exists: boolean };
        this.overlayExists = payload.exists;
        break;
      }

      case 'OVERLAY_RECENT_INTERACTION': {
        const payload = message.payload as { wasRecent: boolean };
        if (payload.wasRecent) {
          this.interactionTime = Date.now();
        }
        break;
      }

      case 'OVERLAY_CLOSE':
        this.overlayExists = false;
        this.callbacks.onClose();
        break;

      case 'OVERLAY_CLEAR_EVENTS':
        this.callbacks.onClearEvents();
        break;

      case 'OVERLAY_COLLAPSE_TOGGLE': {
        const payload = message.payload as { collapsed: boolean };
        this.callbacks.onCollapseToggle(payload.collapsed);
        break;
      }

      case 'OVERLAY_GROUPING_TOGGLE': {
        const payload = message.payload as { enabled: boolean };
        this.callbacks.onGroupingToggle(payload.enabled);
        break;
      }

      case 'OVERLAY_PERSIST_TOGGLE': {
        const payload = message.payload as { enabled: boolean };
        this.callbacks.onPersistToggle(payload.enabled);
        break;
      }

      case 'OVERLAY_RESIZE': {
        const payload = message.payload as { height: number };
        this.callbacks.onResize(payload.height);
        break;
      }

      case 'OVERLAY_FILTER_ADD': {
        const payload = message.payload as { filter: string; mode: 'include' | 'exclude' };
        this.callbacks.onFilterAdd(payload.filter, payload.mode);
        break;
      }

      case 'OVERLAY_FILTER_REMOVE': {
        const payload = message.payload as { filter: string };
        this.callbacks.onFilterRemove(payload.filter);
        break;
      }

      case 'OVERLAY_FILTER_MODE_CHANGE': {
        const payload = message.payload as { mode: 'include' | 'exclude'; clearFilters: boolean };
        this.callbacks.onFilterModeChange(payload.mode, payload.clearFilters);
        break;
      }

      case 'OVERLAY_COPY_EVENT': {
        const payload = message.payload as { event: DataLayerEvent };
        this.callbacks.onCopyEvent(payload.event);
        break;
      }
    }
  }

  /**
   * Send a message to the MAIN world overlay script.
   */
  private sendToOverlay(type: string, payload?: unknown): void {
    window.postMessage({
      type,
      source: 'datalayer-lens-content',
      payload,
    }, '*');
  }

  /**
   * Create the overlay.
   * Injects the overlay script if not already done.
   */
  public create(settings: Settings, events: DataLayerEvent[]): void {
    if (this.overlayExists) return;

    const createPayload = { settings, events };

    // Inject the overlay script if not already done
    if (!this.scriptInjected) {
      this.pendingCreate = createPayload;
      this.injectOverlayScript();
      // The script will send OVERLAY_SCRIPT_LOADED when ready, then we'll send CREATE_OVERLAY
      return;
    }

    if (this.overlayReady) {
      this.sendToOverlay('CREATE_OVERLAY', createPayload);
    } else {
      // Store for when overlay script loads
      this.pendingCreate = createPayload;
    }
  }

  /**
   * Destroy the overlay.
   */
  public destroy(): void {
    if (this.overlayExists) {
      this.sendToOverlay('DESTROY_OVERLAY');
      this.overlayExists = false;
    }
  }

  /**
   * Check if overlay exists.
   */
  public exists(): boolean {
    return this.overlayExists;
  }

  /**
   * Update the overlay with new settings.
   */
  public updateSettings(settings: Settings): void {
    if (this.overlayExists) {
      this.sendToOverlay('UPDATE_SETTINGS', { settings });
    }
  }

  /**
   * Update the overlay with new events.
   */
  public updateEvents(events: DataLayerEvent[]): void {
    if (this.overlayExists) {
      this.sendToOverlay('UPDATE_EVENTS', { events });
    }
  }

  /**
   * Set the collapsed state.
   */
  public setCollapsed(collapsed: boolean): void {
    if (this.overlayExists) {
      this.sendToOverlay('SET_COLLAPSED', { collapsed });
    }
  }

  /**
   * Open the filter modal.
   */
  public openFilterModal(): void {
    if (this.overlayExists) {
      this.sendToOverlay('OPEN_FILTER_MODAL');
    }
  }

  /**
   * Close the filter modal.
   */
  public closeFilterModal(): void {
    if (this.overlayExists) {
      this.sendToOverlay('CLOSE_FILTER_MODAL');
    }
  }

  /**
   * Check if a recent interaction was from the overlay.
   */
  public wasRecentOverlayInteraction(withinMs: number = 100): boolean {
    if (this.overlayExists) {
      // Request the latest interaction time from overlay
      this.sendToOverlay('CHECK_RECENT_INTERACTION', { withinMs });
    }
    // Use cached value for now (async updates will be received via message)
    return Date.now() - this.interactionTime < withinMs;
  }
}
