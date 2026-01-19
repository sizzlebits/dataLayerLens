/**
 * DataLayer Lens Overlay Web Components
 * Export all overlay components for use in the content script.
 *
 * IMPORTANT: Components do NOT auto-register on import.
 * You must call registerComponents() when customElements is available.
 */

export { DLBaseComponent, defineComponent } from './DLBaseComponent';
export { DLJsonViewer } from './DLJsonViewer';
export { DLEventItem } from './DLEventItem';
export { DLEventList } from './DLEventList';
export { DLOverlayHeader } from './DLOverlayHeader';
export { DLOverlayToolbar } from './DLOverlayToolbar';
export type { FilterTag } from './DLOverlayToolbar';
export { DLFilterModal } from './DLFilterModal';
export { DLOverlayContainer } from './DLOverlayContainer';
export type { OverlayState } from './DLOverlayContainer';

// Import component classes for registration
import { DLJsonViewer } from './DLJsonViewer';
import { DLOverlayHeader } from './DLOverlayHeader';
import { DLOverlayToolbar } from './DLOverlayToolbar';
import { DLEventItem } from './DLEventItem';
import { DLEventList } from './DLEventList';
import { DLFilterModal } from './DLFilterModal';
import { DLOverlayContainer } from './DLOverlayContainer';

let componentsRegistered = false;

// Store reference to customElements - can be set externally if page modifies window.customElements
let customElementsRegistry: CustomElementRegistry | null = null;

/**
 * Set the customElements registry to use.
 * Call this early in the content script to capture the reference before page scripts can modify it.
 */
export function setCustomElementsRegistry(registry: CustomElementRegistry): void {
  customElementsRegistry = registry;
}

/**
 * Register all Web Components with the custom elements registry.
 * Must be called when customElements API is available.
 * Safe to call multiple times - components are only registered once.
 */
export function registerComponents(): void {
  if (componentsRegistered) {
    return;
  }

  // Use the stored registry, or fall back to window.customElements
  const ce = customElementsRegistry || (typeof window !== 'undefined' ? window.customElements : undefined);

  if (!ce) {
    console.error('[DataLayer Lens] Cannot register components: customElements API not available');
    return;
  }

  // Register components in dependency order (children first, then containers)
  const components: [string, CustomElementConstructor][] = [
    ['dl-json-viewer', DLJsonViewer],
    ['dl-overlay-header', DLOverlayHeader],
    ['dl-overlay-toolbar', DLOverlayToolbar],
    ['dl-event-item', DLEventItem],
    ['dl-event-list', DLEventList],
    ['dl-filter-modal', DLFilterModal],
    ['dl-overlay-container', DLOverlayContainer],
  ];

  for (const [tagName, componentClass] of components) {
    if (!ce.get(tagName)) {
      ce.define(tagName, componentClass);
    }
  }

  componentsRegistered = true;
}

/**
 * Check if components have been registered.
 */
export function areComponentsRegistered(): boolean {
  return componentsRegistered;
}
