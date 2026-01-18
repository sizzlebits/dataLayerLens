/**
 * FilterEngine module - handles filtering of dataLayer events.
 * Supports include/exclude mode filtering and search text filtering.
 */

import type { DataLayerEvent } from '@/types';

export type FilterMode = 'include' | 'exclude';

export interface FilterConfig {
  /** List of event names to filter */
  eventFilters: string[];
  /** Filter mode: include only matching events or exclude matching events */
  filterMode: FilterMode;
  /** Current search text filter (transient, not saved) */
  searchText: string;
}

export interface FilterEngineOptions {
  /** Initial filter configuration */
  config?: Partial<FilterConfig>;
  /** Callback when filter config changes */
  onFilterChange?: (config: FilterConfig) => void;
}

export interface IFilterEngine {
  /** Filter events based on current configuration */
  filterEvents(events: DataLayerEvent[]): DataLayerEvent[];
  /** Check if a single event passes the filter */
  eventPassesFilter(event: DataLayerEvent): boolean;
  /** Get current filter configuration */
  getConfig(): FilterConfig;
  /** Update filter configuration */
  updateConfig(config: Partial<FilterConfig>): void;
  /** Add an event name to the filter list */
  addFilter(eventName: string): void;
  /** Remove an event name from the filter list */
  removeFilter(eventName: string): void;
  /** Set the filter mode (clears existing filters when switching) */
  setFilterMode(mode: FilterMode): void;
  /** Set the search text filter */
  setSearchText(text: string): void;
  /** Clear all filters */
  clearFilters(): void;
  /** Check if an event name is in the filter list */
  hasFilter(eventName: string): boolean;
  /** Count events that would match a filter pattern */
  countMatchingEvents(events: DataLayerEvent[], pattern: string): number;
}

const DEFAULT_CONFIG: FilterConfig = {
  eventFilters: [],
  filterMode: 'exclude',
  searchText: '',
};

/**
 * Filters dataLayer events based on include/exclude patterns and search text.
 */
export class FilterEngine implements IFilterEngine {
  private config: FilterConfig;
  private onFilterChange?: (config: FilterConfig) => void;

  constructor(options: FilterEngineOptions = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options.config,
    };
    this.onFilterChange = options.onFilterChange;
  }

  /**
   * Check if a single event passes the filter.
   */
  eventPassesFilter(event: DataLayerEvent): boolean {
    const { eventFilters, filterMode, searchText } = this.config;

    // Check event filters (include/exclude mode)
    if (eventFilters.length > 0) {
      const matchesFilter = eventFilters.some((f) =>
        event.event.toLowerCase().includes(f.toLowerCase())
      );

      if (filterMode === 'include' && !matchesFilter) {
        return false;
      }
      if (filterMode === 'exclude' && matchesFilter) {
        return false;
      }
    }

    // Check search text filter
    if (searchText) {
      if (!event.event.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter events based on current configuration.
   */
  filterEvents(events: DataLayerEvent[]): DataLayerEvent[] {
    return events.filter((event) => this.eventPassesFilter(event));
  }

  /**
   * Get current filter configuration.
   */
  getConfig(): FilterConfig {
    return {
      ...this.config,
      eventFilters: [...this.config.eventFilters], // Deep copy array
    };
  }

  /**
   * Update filter configuration.
   */
  updateConfig(config: Partial<FilterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.notifyChange();
  }

  /**
   * Add an event name to the filter list.
   */
  addFilter(eventName: string): void {
    if (!this.config.eventFilters.includes(eventName)) {
      this.config.eventFilters = [...this.config.eventFilters, eventName];
      this.notifyChange();
    }
  }

  /**
   * Remove an event name from the filter list.
   */
  removeFilter(eventName: string): void {
    const index = this.config.eventFilters.indexOf(eventName);
    if (index > -1) {
      this.config.eventFilters = this.config.eventFilters.filter((f) => f !== eventName);
      this.notifyChange();
    }
  }

  /**
   * Set the filter mode.
   * Clears existing filters when switching modes.
   */
  setFilterMode(mode: FilterMode): void {
    if (this.config.filterMode !== mode) {
      this.config.filterMode = mode;
      this.config.eventFilters = []; // Clear filters when switching mode
      this.notifyChange();
    }
  }

  /**
   * Set the search text filter.
   */
  setSearchText(text: string): void {
    this.config.searchText = text;
    this.notifyChange();
  }

  /**
   * Clear all filters (both event filters and search text).
   */
  clearFilters(): void {
    this.config.eventFilters = [];
    this.config.searchText = '';
    this.notifyChange();
  }

  /**
   * Check if an event name is in the filter list.
   */
  hasFilter(eventName: string): boolean {
    return this.config.eventFilters.includes(eventName);
  }

  /**
   * Count events that would match a filter pattern.
   */
  countMatchingEvents(events: DataLayerEvent[], pattern: string): number {
    const lowerPattern = pattern.toLowerCase();
    return events.filter((e) => e.event.toLowerCase().includes(lowerPattern)).length;
  }

  /**
   * Notify listeners of filter config change.
   */
  private notifyChange(): void {
    if (this.onFilterChange) {
      this.onFilterChange(this.getConfig());
    }
  }
}

/**
 * Factory function to create a FilterEngine instance.
 */
export function createFilterEngine(options: FilterEngineOptions = {}): IFilterEngine {
  return new FilterEngine(options);
}
