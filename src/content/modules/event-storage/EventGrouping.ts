/**
 * EventGrouping module - handles grouping events by time window or trigger events.
 */

import type { DataLayerEvent, EventGroup, GroupingConfig } from '@/types';
import { generateEventId } from '@/utils/id';

export interface EventGroupingOptions {
  /** Grouping settings */
  settings: GroupingConfig;
  /** Callback when groups change */
  onGroupsChange?: (groups: EventGroup[]) => void;
}

export interface IEventGrouping {
  /** Add event to appropriate group */
  addEventToGroup(event: DataLayerEvent): void;
  /** Get all event groups */
  getGroups(): EventGroup[];
  /** Get group by ID */
  getGroupById(id: string): EventGroup | undefined;
  /** Clear all groups */
  clearGroups(): void;
  /** Rebuild groups from events */
  rebuildGroups(events: DataLayerEvent[]): void;
  /** Update grouping settings */
  updateSettings(settings: GroupingConfig): void;
  /** Get current settings */
  getSettings(): GroupingConfig;
  /** Toggle group collapsed state */
  toggleGroupCollapsed(groupId: string): void;
  /** Check if group is collapsed */
  isGroupCollapsed(groupId: string): boolean;
}

/**
 * Manages grouping of dataLayer events.
 * Supports time-based grouping and event-triggered grouping.
 */
export class EventGrouping implements IEventGrouping {
  private groups: EventGroup[] = [];
  private settings: GroupingConfig;
  private currentGroupId: string | null = null;
  private lastEventTime = 0;
  private onGroupsChange?: (groups: EventGroup[]) => void;
  private collapsedGroupIds = new Set<string>();

  constructor(options: EventGroupingOptions) {
    this.settings = { ...options.settings };
    this.onGroupsChange = options.onGroupsChange;
  }

  /**
   * Determine if a new group should start for the given event.
   */
  private shouldStartNewGroup(event: DataLayerEvent): boolean {
    if (!this.settings.enabled) {
      return false;
    }

    if (this.settings.mode === 'time') {
      // Start new group if time since last event exceeds window
      return event.timestamp - this.lastEventTime > this.settings.timeWindowMs;
    } else {
      // Start new group if this is a trigger event
      return this.settings.triggerEvents.some((trigger: string) =>
        event.event.toLowerCase().includes(trigger.toLowerCase())
      );
    }
  }

  /**
   * Add event to appropriate group.
   */
  addEventToGroup(event: DataLayerEvent): void {
    if (!this.settings.enabled) {
      event.groupId = undefined;
      return;
    }

    if (this.shouldStartNewGroup(event) || !this.currentGroupId) {
      // Create new group
      const group: EventGroup = {
        id: generateEventId(),
        events: [event],
        startTime: event.timestamp,
        endTime: event.timestamp,
        triggerEvent: this.settings.mode === 'event' ? event.event : undefined,
        collapsed: false,
      };
      this.groups.unshift(group);
      this.currentGroupId = group.id;
      event.groupId = group.id;
    } else {
      // Add to existing group
      const group = this.groups.find((g) => g.id === this.currentGroupId);
      if (group) {
        group.events.unshift(event);
        group.endTime = event.timestamp;
        event.groupId = group.id;
      }
    }

    this.lastEventTime = event.timestamp;
    this.notifyChange();
  }

  /**
   * Get all event groups.
   */
  getGroups(): EventGroup[] {
    return [...this.groups];
  }

  /**
   * Get group by ID.
   */
  getGroupById(id: string): EventGroup | undefined {
    return this.groups.find((g) => g.id === id);
  }

  /**
   * Clear all groups.
   */
  clearGroups(): void {
    this.groups = [];
    this.currentGroupId = null;
    this.lastEventTime = 0;
    this.collapsedGroupIds.clear();
    this.notifyChange();
  }

  /**
   * Rebuild groups from events.
   * Used when loading persisted events or when settings change.
   */
  rebuildGroups(events: DataLayerEvent[]): void {
    this.groups = [];
    this.currentGroupId = null;
    this.lastEventTime = 0;

    // Process events in chronological order (oldest first)
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

    // Build groups in chronological order, then reverse
    const tempGroups: EventGroup[] = [];

    sortedEvents.forEach((event) => {
      // Process events but track groups manually
      if (!this.settings.enabled) {
        event.groupId = undefined;
        return;
      }

      const shouldStart = this.shouldStartNewGroup(event) || !this.currentGroupId;

      if (shouldStart) {
        const group: EventGroup = {
          id: generateEventId(),
          events: [event],
          startTime: event.timestamp,
          endTime: event.timestamp,
          triggerEvent: this.settings.mode === 'event' ? event.event : undefined,
          collapsed: false,
        };
        tempGroups.push(group); // Use push for chronological order
        this.currentGroupId = group.id;
        event.groupId = group.id;
      } else {
        const group = tempGroups.find((g) => g.id === this.currentGroupId);
        if (group) {
          group.events.push(event); // Add to end for chronological order within group
          group.endTime = event.timestamp;
          event.groupId = group.id;
        }
      }

      this.lastEventTime = event.timestamp;
    });

    // Reverse to get newest groups first, and reverse events within each group
    this.groups = tempGroups.reverse().map((g) => ({
      ...g,
      events: g.events.reverse(), // Newest events first within group
    }));

    this.notifyChange();
  }

  /**
   * Update grouping settings.
   */
  updateSettings(settings: GroupingConfig): void {
    this.settings = { ...settings };
  }

  /**
   * Get current settings.
   */
  getSettings(): GroupingConfig {
    return { ...this.settings };
  }

  /**
   * Toggle group collapsed state.
   */
  toggleGroupCollapsed(groupId: string): void {
    if (this.collapsedGroupIds.has(groupId)) {
      this.collapsedGroupIds.delete(groupId);
    } else {
      this.collapsedGroupIds.add(groupId);
    }

    // Also update the group object
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      group.collapsed = this.collapsedGroupIds.has(groupId);
    }

    this.notifyChange();
  }

  /**
   * Check if group is collapsed.
   */
  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroupIds.has(groupId);
  }

  /**
   * Notify listeners of group change.
   */
  private notifyChange(): void {
    if (this.onGroupsChange) {
      this.onGroupsChange(this.getGroups());
    }
  }
}

/**
 * Factory function to create an EventGrouping instance.
 */
export function createEventGrouping(options: EventGroupingOptions): IEventGrouping {
  return new EventGrouping(options);
}
