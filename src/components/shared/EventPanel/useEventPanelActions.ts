/**
 * Shared actions hook for EventPanel.
 * Contains all event handlers used by both SidePanel and DevToolsPanel.
 */

import { useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { DataLayerEvent, Settings as SettingsType, getSourceColor } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export interface EventPanelActionsConfig {
  context: 'sidepanel' | 'devtools';
  tabId: number | null;
  settings: SettingsType;
  filteredEvents: DataLayerEvent[];

  // State setters
  setEvents: Dispatch<SetStateAction<DataLayerEvent[]>>;
  setSettings: Dispatch<SetStateAction<SettingsType>>;
  setExpandedEvents: Dispatch<SetStateAction<Set<string>>>;
  setCopiedId: Dispatch<SetStateAction<string | null>>;
  setNewEventIds: Dispatch<SetStateAction<Set<string>>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setFilterMenuEvent: Dispatch<SetStateAction<string | null>>;
  setCollapsedGroups: Dispatch<SetStateAction<Set<string>>>;
  setCopyError: Dispatch<SetStateAction<string | null>>;
}

export interface EventPanelActions {
  clearEvents: () => Promise<void>;
  toggleExpanded: (id: string) => void;
  copyEvent: (event: DataLayerEvent) => Promise<void>;
  togglePersist: () => Promise<void>;
  toggleGrouping: () => Promise<void>;
  toggleConsoleLogging: () => Promise<void>;
  addFilter: (eventName: string, mode: 'include' | 'exclude') => void;
  removeFilter: (filter: string) => void;
  toggleFilterMode: () => void;
  handleUpdateSettings: (updates: Partial<SettingsType>) => void;
  exportEvents: () => void;
  toggleGroupCollapsed: (groupId: string) => void;
  getSourceColorForEvent: (source: string) => string;
}

export function useEventPanelActions(config: EventPanelActionsConfig): EventPanelActions {
  const {
    context,
    tabId,
    settings,
    filteredEvents,
    setEvents,
    setSettings,
    setExpandedEvents,
    setCopiedId,
    setNewEventIds,
    setCurrentPage,
    setFilterMenuEvent,
    setCollapsedGroups,
    setCopyError,
  } = config;

  const clearingRef = useRef(false);

  const clearEvents = useCallback(async () => {
    if (!tabId) return;

    clearingRef.current = true;

    setEvents([]);
    setNewEventIds(new Set());
    setExpandedEvents(new Set());
    setCurrentPage(0);

    try {
      // tabs.sendMessage may not be available in Firefox devtools panels
      await browserAPI.tabs?.sendMessage?.(tabId, { type: 'CLEAR_EVENTS' });
    } catch (error) {
      console.error('Failed to clear events:', error);
    }

    setTimeout(() => {
      clearingRef.current = false;
    }, 1000);
  }, [tabId, setEvents, setNewEventIds, setExpandedEvents, setCurrentPage]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [setExpandedEvents]);

  const copyEvent = useCallback(async (event: DataLayerEvent) => {
    const text = JSON.stringify(event.data, null, 2);
    const result = await copyToClipboard(text);

    if (result.success) {
      setCopiedId(event.id);
      setCopyError(null);
      setTimeout(() => setCopiedId(null), 2000);
    } else if (context === 'devtools') {
      // DevTools shows error toast
      setCopyError(result.error || 'Copy failed');
      setTimeout(() => setCopyError(null), 3000);
    }
    // SidePanel silently fails
  }, [context, setCopiedId, setCopyError]);

  const togglePersist = useCallback(async () => {
    const newValue = !settings.persistEvents;
    setSettings((prev) => ({ ...prev, persistEvents: newValue }));
    if (tabId) {
      browserAPI.tabs?.sendMessage?.(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: { persistEvents: newValue },
      }).catch(() => {});
    }
  }, [settings.persistEvents, tabId, setSettings]);

  const toggleGrouping = useCallback(async () => {
    const newValue = !settings.grouping?.enabled;
    setSettings((prev) => ({
      ...prev,
      grouping: { ...prev.grouping, enabled: newValue },
    }));
    if (tabId) {
      browserAPI.tabs?.sendMessage?.(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: { grouping: { ...settings.grouping, enabled: newValue } },
      }).catch(() => {});
    }
  }, [settings.grouping, tabId, setSettings]);

  const toggleConsoleLogging = useCallback(async () => {
    const newValue = !settings.consoleLogging;
    setSettings((prev) => ({ ...prev, consoleLogging: newValue }));
    if (tabId) {
      browserAPI.tabs?.sendMessage?.(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: { consoleLogging: newValue },
      }).catch(() => {});
    }
  }, [settings.consoleLogging, tabId, setSettings]);

  const addFilter = useCallback((eventName: string, mode: 'include' | 'exclude') => {
    if (settings.eventFilters.includes(eventName)) return;
    const newFilters = [...settings.eventFilters, eventName];
    const updates = { eventFilters: newFilters, filterMode: mode };
    setSettings((prev) => ({ ...prev, ...updates }));
    if (tabId) {
      browserAPI.tabs?.sendMessage?.(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: updates,
      }).catch(() => {});
    }
    setFilterMenuEvent(null);
  }, [settings.eventFilters, tabId, setSettings, setFilterMenuEvent]);

  const removeFilter = useCallback((filter: string) => {
    const newFilters = settings.eventFilters.filter((f) => f !== filter);
    setSettings((prev) => ({ ...prev, eventFilters: newFilters }));
    if (tabId) {
      browserAPI.tabs?.sendMessage?.(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: { eventFilters: newFilters },
      }).catch(() => {});
    }
  }, [settings.eventFilters, tabId, setSettings]);

  const toggleFilterMode = useCallback(() => {
    const newMode = settings.filterMode === 'include' ? 'exclude' : 'include';
    setSettings((prev) => ({ ...prev, filterMode: newMode }));
    if (tabId) {
      browserAPI.tabs?.sendMessage?.(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: { filterMode: newMode },
      }).catch(() => {});
    }
  }, [settings.filterMode, tabId, setSettings]);

  const handleUpdateSettings = useCallback((updates: Partial<SettingsType>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, [setSettings]);

  const exportEvents = useCallback(() => {
    const data = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datalayer-events-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents]);

  const toggleGroupCollapsed = useCallback((groupId: string) => {
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

  const getSourceColorForEvent = useCallback((source: string) => {
    const cleanSource = source.replace(' (persisted)', '').replace('(persisted)', '');
    return getSourceColor(cleanSource, settings.sourceColors || {});
  }, [settings.sourceColors]);

  return {
    clearEvents,
    toggleExpanded,
    copyEvent,
    togglePersist,
    toggleGrouping,
    toggleConsoleLogging,
    addFilter,
    removeFilter,
    toggleFilterMode,
    handleUpdateSettings,
    exportEvents,
    toggleGroupCollapsed,
    getSourceColorForEvent,
  };
}
