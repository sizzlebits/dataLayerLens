/**
 * Hook for managing SidePanel component actions.
 */

import { useCallback } from 'react';
import { DataLayerEvent, Settings, DEFAULT_GROUPING } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export interface UseSidePanelActionsProps {
  settings: Settings;
  setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
  events: DataLayerEvent[];
  setEvents: (events: DataLayerEvent[] | ((prev: DataLayerEvent[]) => DataLayerEvent[])) => void;
  activeTabId: number | null;
  expandedEvents: Set<string>;
  setExpandedEvents: (events: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setCopiedId: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setNewEventIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setFilterMenuEvent: (id: string | null) => void;
  collapsedGroups: Set<string>;
  setCollapsedGroups: (groups: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  clearingRef: React.MutableRefObject<boolean>;
  eventsVersion: React.MutableRefObject<number>;
}

export function useSidePanelActions({
  settings,
  setSettings,
  events,
  setEvents,
  activeTabId,
  expandedEvents,
  setExpandedEvents,
  setCopiedId,
  setCurrentPage,
  setNewEventIds,
  setFilterMenuEvent,
  collapsedGroups,
  setCollapsedGroups,
  clearingRef,
  eventsVersion,
}: UseSidePanelActionsProps) {
  // Load events from content script
  const loadEvents = useCallback(async (tabId: number) => {
    try {
      const response = await browserAPI.tabs.sendMessage(tabId, { type: 'GET_EVENTS' });
      if (response?.events) {
        const sortedEvents = [...response.events].sort(
          (a: DataLayerEvent, b: DataLayerEvent) => b.timestamp - a.timestamp
        );
        eventsVersion.current += 1;
        setEvents(sortedEvents);
        setCurrentPage(0);
      }
    } catch (err) {
      console.debug('Could not load events:', err);
    }
  }, [setEvents, setCurrentPage, eventsVersion]);

  // Update settings
  const handleUpdateSettings = useCallback(async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (activeTabId) {
      try {
        await browserAPI.tabs.sendMessage(activeTabId, {
          type: 'UPDATE_SETTINGS',
          payload: updates,
        });
      } catch (err) {
        console.debug('Could not update settings:', err);
      }
    }
  }, [settings, setSettings, activeTabId]);

  // Toggle event expansion
  const toggleExpanded = useCallback((eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, [setExpandedEvents]);

  // Copy event to clipboard
  const copyEvent = useCallback(async (event: DataLayerEvent) => {
    try {
      await copyToClipboard(JSON.stringify(event.data, null, 2));
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [setCopiedId]);

  // Clear all events
  const clearEvents = useCallback(async () => {
    clearingRef.current = true;
    setEvents([]);
    setExpandedEvents(new Set());
    setNewEventIds(new Set());
    setCurrentPage(0);

    if (activeTabId) {
      try {
        await browserAPI.tabs.sendMessage(activeTabId, { type: 'CLEAR_EVENTS' });
      } catch (err) {
        console.debug('Could not clear events:', err);
      }
    }

    setTimeout(() => {
      clearingRef.current = false;
    }, 500);
  }, [activeTabId, setEvents, setExpandedEvents, setNewEventIds, setCurrentPage, clearingRef]);

  // Export events
  const exportEvents = useCallback(() => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datalayer-events-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  // Add filter
  const addFilter = useCallback((eventName: string, mode: 'include' | 'exclude') => {
    const newFilters = settings.filterMode === mode
      ? [...settings.eventFilters, eventName]
      : [eventName];

    handleUpdateSettings({
      eventFilters: newFilters,
      filterMode: mode,
    });
    setFilterMenuEvent(null);
  }, [settings.eventFilters, settings.filterMode, handleUpdateSettings, setFilterMenuEvent]);

  // Remove filter
  const removeFilter = useCallback((filter: string) => {
    handleUpdateSettings({
      eventFilters: settings.eventFilters.filter((f) => f !== filter),
    });
  }, [settings.eventFilters, handleUpdateSettings]);

  // Toggle group collapse
  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, [setCollapsedGroups]);

  // Expand/collapse all groups
  const expandAllGroups = useCallback(() => {
    setCollapsedGroups(new Set());
  }, [setCollapsedGroups]);

  const collapseAllGroups = useCallback((groupIds: string[]) => {
    setCollapsedGroups(new Set(groupIds));
  }, [setCollapsedGroups]);

  return {
    loadEvents,
    handleUpdateSettings,
    toggleExpanded,
    copyEvent,
    clearEvents,
    exportEvents,
    addFilter,
    removeFilter,
    toggleGroupCollapse,
    expandAllGroups,
    collapseAllGroups,
  };
}
