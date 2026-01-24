export interface DataLayerEvent {
  id: string;
  timestamp: number;
  event: string;
  data: Record<string, unknown>;
  source: string; // Which dataLayer array it came from
  raw: unknown;
  groupId?: string; // For event grouping
  dataLayerIndex: number; // Original index in the dataLayer array at capture time
}

// Event group for displaying grouped events
export interface EventGroup {
  id: string;
  events: DataLayerEvent[];
  startTime: number;
  endTime: number;
  triggerEvent?: string; // The event that started this group
  collapsed: boolean;
}

// Grouping configuration
export interface GroupingConfig {
  enabled: boolean;
  mode: 'time' | 'event'; // Group by time window or by trigger events
  timeWindowMs: number; // For time mode: 200, 500, 1000ms etc.
  triggerEvents: string[]; // For event mode: events that start a new group
}

// Per-domain settings override
export interface DomainSettings {
  domain: string;
  settings: Partial<Settings>;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  // Event settings
  maxEvents: number;
  dataLayerNames: string[];
  eventFilters: string[];
  filterMode: 'include' | 'exclude';

  // Grouping settings
  grouping: GroupingConfig;

  // Persistence settings
  persistEvents: boolean; // Keep events across page refreshes
  persistEventsMaxAge: number; // Max age in ms (0 = forever until cleared)

  // Display settings
  theme: 'system' | 'light' | 'dark';
  showTimestamps: boolean;
  showEmojis: boolean;
  compactMode: boolean;

  // Source colors (user-selected colors for dataLayer sources)
  sourceColors: Record<string, string>;

  // Developer settings
  debugLogging: boolean;
  consoleLogging: boolean; // Log dataLayer events to browser console
}

// Storage structure
export interface StorageData {
  // Global settings (fallback)
  globalSettings: Settings;

  // Per-domain settings overrides
  domainSettings: Record<string, DomainSettings>;

  // Persisted events per domain
  persistedEvents: Record<string, {
    events: DataLayerEvent[];
    lastUpdated: number;
  }>;
}

// Type for settings input that allows partial grouping config
// This is used by mergeSettings/mergeSettingsUpdate where nested partial grouping is valid
export type PartialSettingsInput = Partial<Omit<Settings, 'grouping'>> & {
  grouping?: Partial<GroupingConfig>;
};

export const DEFAULT_GROUPING: GroupingConfig = {
  enabled: false,
  mode: 'time',
  timeWindowMs: 500,
  triggerEvents: ['gtm.js', 'page_view', 'virtualPageView'],
};

export const DEFAULT_SETTINGS: Settings = {
  maxEvents: 500,
  dataLayerNames: ['dataLayer'],
  eventFilters: [],
  filterMode: 'exclude',
  grouping: DEFAULT_GROUPING,
  persistEvents: false,
  persistEventsMaxAge: 300000, // 5 minutes default
  theme: 'system', // Default to system preference
  showTimestamps: true,
  showEmojis: true,
  compactMode: false,
  sourceColors: {}, // User-selected colors for dataLayer sources
  debugLogging: false,
  consoleLogging: false, // Off by default
};

export type MessageType =
  | 'DATALAYER_EVENT'
  | 'GET_EVENTS'
  | 'CLEAR_EVENTS'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'INJECT_MONITOR'
  | 'SETTINGS_CHANGED'
  | 'EXPORT_SETTINGS'
  | 'IMPORT_SETTINGS'
  | 'GET_PERSISTED_EVENTS'
  | 'CLEAR_PERSISTED_EVENTS';

export interface Message {
  type: MessageType;
  payload?: unknown;
  tabId?: number;
}

export interface DataLayerEventMessage extends Message {
  type: 'DATALAYER_EVENT';
  payload: DataLayerEvent;
}

export interface SettingsMessage extends Message {
  type: 'GET_SETTINGS' | 'UPDATE_SETTINGS';
  payload?: Partial<Settings>;
}

// Color pool for dataLayer sources (10 colors with good contrast against dark backgrounds)
export const SOURCE_COLOR_POOL: string[] = [
  '#6366f1', // Indigo
  '#22d3ee', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Blue
];

// Get a color for a source from the pool
// If the source doesn't have a persisted color, one will be auto-assigned based on index
export function getSourceColor(source: string, sourceColors: Record<string, string>): string {
  // Check if user/system has assigned a color
  if (sourceColors[source]) {
    return sourceColors[source];
  }
  // Fallback to first color (shouldn't happen if colors are properly auto-assigned)
  return SOURCE_COLOR_POOL[0];
}

// Auto-assign colors for any sources that don't have one yet
// Returns a new sourceColors object with any new assignments, or null if no changes needed
export function autoAssignSourceColors(
  sources: string[],
  currentSourceColors: Record<string, string>
): Record<string, string> | null {
  let hasNewAssignments = false;
  const newSourceColors = { ...currentSourceColors };

  // Count how many colors are already assigned to determine next color index
  const assignedCount = Object.keys(currentSourceColors).length;
  let nextColorIndex = assignedCount;

  for (const source of sources) {
    if (!newSourceColors[source]) {
      // Assign next color from pool
      newSourceColors[source] = SOURCE_COLOR_POOL[nextColorIndex % SOURCE_COLOR_POOL.length];
      nextColorIndex++;
      hasNewAssignments = true;
    }
  }

  return hasNewAssignments ? newSourceColors : null;
}

// Special event name for pushes without an 'event' property
export const DATA_UPDATE_EVENT = '(data)';

// Event categories for colorful display
export const EVENT_CATEGORIES: Record<string, { color: string; icon: string }> = {
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
  [DATA_UPDATE_EVENT]: { color: '#94a3b8', icon: '📦' }, // Data-only pushes (no event property)
  default: { color: '#64748b', icon: '📌' },
};

export function getEventCategory(eventName: string): { color: string; icon: string } {
  // Check for exact match
  if (EVENT_CATEGORIES[eventName]) {
    return EVENT_CATEGORIES[eventName];
  }

  // Check for partial matches
  const lowerName = eventName.toLowerCase();
  if (lowerName.includes('click')) return EVENT_CATEGORIES['gtm.click'];
  if (lowerName.includes('view')) return EVENT_CATEGORIES['page_view'];
  if (lowerName.includes('cart')) return EVENT_CATEGORIES['add_to_cart'];
  if (lowerName.includes('purchase') || lowerName.includes('transaction')) return EVENT_CATEGORIES['purchase'];
  if (lowerName.includes('search')) return EVENT_CATEGORIES['search'];
  if (lowerName.includes('scroll')) return EVENT_CATEGORIES['gtm.scrollDepth'];
  if (lowerName.includes('video')) return EVENT_CATEGORIES['gtm.video'];
  if (lowerName.includes('form') || lowerName.includes('submit')) return EVENT_CATEGORIES['gtm.formSubmit'];

  return EVENT_CATEGORIES['default'];
}

// Helper to get current domain
export function getCurrentDomain(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

// Helper to merge settings with domain overrides
export function mergeSettingsWithDomain(
  globalSettings: Settings,
  domainSettings?: Partial<Settings>
): Settings {
  if (!domainSettings) return globalSettings;
  return { ...globalSettings, ...domainSettings };
}

/**
 * Merge partial settings with defaults, properly handling nested grouping config.
 * This is the canonical way to merge settings across the codebase.
 */
export function mergeSettings(
  defaults: Settings,
  partial?: PartialSettingsInput
): Settings {
  if (!partial) return defaults;

  return {
    ...defaults,
    ...partial,
    grouping: {
      ...defaults.grouping,
      ...(partial.grouping || {}),
    },
  };
}

/**
 * Merge partial settings into existing settings (for updates).
 * Preserves existing values not specified in the partial.
 */
export function mergeSettingsUpdate(
  current: Settings,
  update: PartialSettingsInput
): Settings {
  return {
    ...current,
    ...update,
    grouping: update.grouping
      ? { ...current.grouping, ...update.grouping }
      : current.grouping,
  };
}
