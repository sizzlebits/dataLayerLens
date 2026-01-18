/**
 * DataLayer Lens Overlay Web Components
 * Export all overlay components for use in the content script.
 */

export { DLBaseComponent, defineComponent } from './DLBaseComponent';
export { DLJsonViewer } from './DLJsonViewer';
export { DLEventItem } from './DLEventItem';
export { DLEventList } from './DLEventList';
export { DLOverlayHeader } from './DLOverlayHeader';
export { DLOverlayToolbar } from './DLOverlayToolbar';
export type { FilterTag } from './DLOverlayToolbar';
export { DLOverlayContainer } from './DLOverlayContainer';
export type { OverlayState } from './DLOverlayContainer';

// Re-export component registration for convenience
export function registerAllComponents(): void {
  // Components auto-register when imported via defineComponent
  // This function exists for explicit registration if needed
  import('./DLOverlayContainer');
}
