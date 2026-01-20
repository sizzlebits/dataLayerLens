/**
 * CSS Modules index for DataLayer Lens overlay components.
 *
 * Import these styles with the ?inline query to get the raw CSS string
 * for injection into Shadow DOM:
 *
 * import variablesStyles from './styles/variables.module.css?inline';
 */

// Re-export the getCombinedStyles function for easy use
export { getCombinedStyles, styleModules } from './loadStyles';
export type { StyleModuleName } from './loadStyles';

// Re-export paths for documentation purposes
export const stylePaths = {
  variables: './variables.module.css',
  animations: './animations.module.css',
  overlay: './overlay.module.css',
  header: './header.module.css',
  toolbar: './toolbar.module.css',
  eventList: './event-list.module.css',
  eventItem: './event-item.module.css',
  eventGroup: './event-group.module.css',
  filterModal: './filter-modal.module.css',
  pagination: './pagination.module.css',
  jsonViewer: './json-viewer.module.css',
} as const;

// Type for style module keys
export type StyleModuleKey = keyof typeof stylePaths;
