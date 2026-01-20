/**
 * CSS Loader utility for DataLayer Lens overlay.
 *
 * Combines all CSS modules into a single string for injection into Shadow DOM.
 * The ?inline query is used by Vite to get the raw CSS string.
 */

import variablesCSS from './variables.module.css?inline';
import animationsCSS from './animations.module.css?inline';
import overlayCSS from './overlay.module.css?inline';
import headerCSS from './header.module.css?inline';
import toolbarCSS from './toolbar.module.css?inline';
import eventListCSS from './event-list.module.css?inline';
import eventItemCSS from './event-item.module.css?inline';
import eventGroupCSS from './event-group.module.css?inline';
import filterModalCSS from './filter-modal.module.css?inline';
import paginationCSS from './pagination.module.css?inline';
import jsonViewerCSS from './json-viewer.module.css?inline';

/**
 * Returns all CSS modules combined in the correct order.
 * Variables and animations should come first as they define
 * custom properties and keyframes used by other modules.
 */
export function getCombinedStyles(): string {
  return [
    variablesCSS,
    animationsCSS,
    overlayCSS,
    headerCSS,
    toolbarCSS,
    eventListCSS,
    eventItemCSS,
    eventGroupCSS,
    filterModalCSS,
    paginationCSS,
    jsonViewerCSS,
  ].join('\n');
}

/**
 * Gets individual style modules for more granular loading.
 */
export const styleModules = {
  variables: variablesCSS,
  animations: animationsCSS,
  overlay: overlayCSS,
  header: headerCSS,
  toolbar: toolbarCSS,
  eventList: eventListCSS,
  eventItem: eventItemCSS,
  eventGroup: eventGroupCSS,
  filterModal: filterModalCSS,
  pagination: paginationCSS,
  jsonViewer: jsonViewerCSS,
} as const;

export type StyleModuleName = keyof typeof styleModules;
