/**
 * Shared state management hook for EventPanel.
 * Used by both SidePanel and DevToolsPanel.
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  DataLayerEvent,
  EventGroup,
  autoAssignSourceColors,
  Settings as SettingsType,
  DEFAULT_SETTINGS,
} from '@/types';
import { useTheme } from '@/hooks/useTheme';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const PAGE_SIZE = 50;

export interface EventPanelConfig {
  /** Context determines behavior differences */
  context: 'devtools';
}

export interface EventPanelState {
  // Core state
  events: DataLayerEvent[];
  settings: SettingsType;
  tabId: number | null;

  // UI state
  searchText: string;
  expandedEvents: Set<string>;
  copiedId: string | null;
  showFilters: boolean;
  currentPage: number;
  newEventIds: Set<string>;
  filterMenuEvent: string | null;
  collapsedGroups: Set<string>;
  showSettings: boolean;
  copyError: string | null;

  // Computed values
  filteredEvents: DataLayerEvent[];
  eventGroups: EventGroup[];
  availableEventTypes: string[];
  uniqueSources: string[];
  totalPages: number;
  paginatedEvents: DataLayerEvent[];
  paginatedGroups: EventGroup[];

  // Setters - exposed for actions hook
  setEvents: React.Dispatch<React.SetStateAction<DataLayerEvent[]>>;
  setSettings: React.Dispatch<React.SetStateAction<SettingsType>>;
  setSearchText: (text: string) => void;
  setExpandedEvents: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCopiedId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowFilters: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setNewEventIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFilterMenuEvent: React.Dispatch<React.SetStateAction<string | null>>;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCopyError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useEventPanelState(_config: EventPanelConfig): EventPanelState {
  // Core state
  const [events, setEvents] = useState<DataLayerEvent[]>([]);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);

  // UI state
  const [searchText, setSearchText] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [filterMenuEvent, setFilterMenuEvent] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Refs
  const clearingRef = useRef(false);
  const eventsVersion = useRef(0);

  // Get tab ID from devtools
  const tabId = browserAPI.devtools?.inspectedWindow?.tabId ?? null;

  // Apply theme based on settings
  useTheme({ theme: settings.theme });

  // Load events function - defined before useEffects that depend on it
  const loadEvents = useCallback(async (loadTabId: number) => {
    try {
      // tabs.sendMessage may not be available in Firefox devtools panels
      if (!browserAPI.tabs?.sendMessage) return;
      const response = await browserAPI.tabs.sendMessage(loadTabId, { type: 'GET_EVENTS' });
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
  }, []);

  // Listen for page navigation on the inspected tab
  useEffect(() => {
    if (!tabId) return;
    // tabs API may not be available in Firefox devtools panels
    if (!browserAPI.tabs?.onUpdated) return;

    const handleTabUpdated = (updatedTabId: number, changeInfo: { status?: string; url?: string }) => {
      // When the inspected tab navigates to a new page, clear events and reload
      if (updatedTabId === tabId && changeInfo.status === 'loading' && changeInfo.url) {
        setEvents([]);
        setCurrentPage(0);
        setExpandedEvents(new Set());
      }
      // When page finishes loading, fetch events (which may include persisted ones)
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        loadEvents(tabId);
      }
    };

    browserAPI.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      browserAPI.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [tabId, loadEvents]);

  // Load settings from storage (global settings that popup updates)
  useEffect(() => {
    const loadSettingsFromStorage = async () => {
      try {
        const result = await browserAPI.storage.local.get('datalayer_monitor_settings');
        const savedSettings = result.datalayer_monitor_settings;
        if (savedSettings) {
          setSettings((prev) => ({ ...prev, ...savedSettings }));
        }
      } catch (err) {
        console.debug('Could not load settings from storage:', err);
      }
    };

    loadSettingsFromStorage();
  }, []);

  // Load events when tabId is available
  useEffect(() => {
    if (!tabId) return;
    loadEvents(tabId);
  }, [tabId, loadEvents]);

  // Listen for new events and settings changes via messages
  useEffect(() => {
    const messageListener = (
      message: { type: string; payload?: DataLayerEvent | DataLayerEvent[] | Partial<SettingsType>; tabId?: number },
      _sender: { tab?: { id?: number } }
    ) => {
      if (message.type === 'DATALAYER_EVENT' || message.type === 'EVENT_ADDED') {
        // Filter out events from other tabs to prevent cross-tab leakage
        // DATALAYER_EVENT comes from content script (tabId in sender.tab.id)
        // EVENT_ADDED comes from background (tabId in message)
        const messageTabId = message.tabId ?? _sender.tab?.id;
        if (messageTabId !== undefined && messageTabId !== tabId) return;
        if (clearingRef.current) return;

        if (message.payload && !Array.isArray(message.payload)) {
          const newEvent = message.payload as DataLayerEvent;
          setEvents((prev) => {
            if (prev.some((e) => e.id === newEvent.id)) {
              return prev;
            }
            return [newEvent, ...prev].slice(0, 1000);
          });
          setNewEventIds((prev) => new Set(prev).add(newEvent.id));
          setTimeout(() => {
            setNewEventIds((prev) => {
              const next = new Set(prev);
              next.delete(newEvent.id);
              return next;
            });
          }, 2000);
        }
      } else if (message.type === 'SETTINGS_UPDATED') {
        if (message.payload) {
          setSettings((prev) => ({ ...prev, ...(message.payload as Partial<SettingsType>) }));
        }
      } else if (message.type === 'EVENTS_UPDATED') {
        // Filter by tabId from message or sender to prevent cross-tab leakage
        const senderTabId = message.tabId ?? _sender.tab?.id;
        if (senderTabId !== undefined && senderTabId !== tabId) return;
        // Handle events cleared/updated from popup or other sources
        if (message.payload && Array.isArray(message.payload)) {
          const sortedEvents = [...(message.payload as DataLayerEvent[])].sort(
            (a: DataLayerEvent, b: DataLayerEvent) => b.timestamp - a.timestamp
          );
          setEvents(sortedEvents);
        }
      }
    };

    browserAPI.runtime.onMessage.addListener(messageListener);

    return () => {
      browserAPI.runtime.onMessage.removeListener(messageListener);
    };
  }, [tabId]);

  // Listen for settings changes via storage
  useEffect(() => {
    const storageListener = (
      changes: { [key: string]: { oldValue?: unknown; newValue?: unknown } },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.datalayer_monitor_settings) {
        const newSettings = changes.datalayer_monitor_settings.newValue as SettingsType;
        if (newSettings) {
          setSettings((prev) => ({ ...prev, ...newSettings }));
        }
      }
    };

    browserAPI.storage.onChanged.addListener(storageListener);

    return () => {
      browserAPI.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events;

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((event) =>
        event.event.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      );
    }

    if (settings.eventFilters.length > 0) {
      if (settings.filterMode === 'include') {
        result = result.filter((event) =>
          settings.eventFilters.some((f) => event.event.toLowerCase().includes(f.toLowerCase()))
        );
      } else {
        result = result.filter((event) =>
          !settings.eventFilters.some((f) => event.event.toLowerCase().includes(f.toLowerCase()))
        );
      }
    }

    return result;
  }, [events, searchText, settings.eventFilters, settings.filterMode]);

  // Available event types for filter suggestions
  const availableEventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.event));
    return Array.from(types).sort();
  }, [events]);

  // Unique sources for color assignment
  const uniqueSources = useMemo(() => {
    const sources = new Set(events.map((e) => e.source.replace(' (persisted)', '').replace('(persisted)', '')));
    return Array.from(sources);
  }, [events]);

  // Auto-assign colors when new sources are discovered
  useEffect(() => {
    if (uniqueSources.length > 0 && tabId) {
      const newColors = autoAssignSourceColors(uniqueSources, settings.sourceColors || {});
      if (newColors) {
        setSettings((prev) => ({ ...prev, sourceColors: newColors }));
        // tabs.sendMessage may not be available in Firefox devtools panels
        browserAPI.tabs?.sendMessage?.(tabId, {
          type: 'UPDATE_SETTINGS',
          payload: { sourceColors: newColors },
        })?.catch?.(() => {});
      }
    }
  }, [uniqueSources, settings.sourceColors, tabId]);

  // Group events when grouping is enabled
  const eventGroups = useMemo((): EventGroup[] => {
    if (!settings.grouping?.enabled || filteredEvents.length === 0) {
      return [];
    }

    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;
    let lastEventTime = 0;

    const eventsChronological = [...filteredEvents].reverse();

    for (const event of eventsChronological) {
      const shouldStartNew = (() => {
        if (!currentGroup) return true;

        if (settings.grouping.mode === 'time') {
          return event.timestamp - lastEventTime > settings.grouping.timeWindowMs;
        } else {
          return settings.grouping.triggerEvents.some(
            (t) => event.event.toLowerCase().includes(t.toLowerCase())
          );
        }
      })();

      if (shouldStartNew) {
        currentGroup = {
          id: `group-${event.id}`,
          events: [event],
          startTime: event.timestamp,
          endTime: event.timestamp,
          triggerEvent: settings.grouping.mode === 'event' ? event.event : undefined,
          collapsed: false,
        };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.events.push(event);
        currentGroup.endTime = event.timestamp;
      }

      lastEventTime = event.timestamp;
    }

    groups.forEach((g) => g.events.reverse());
    groups.reverse();

    return groups;
  }, [filteredEvents, settings.grouping]);

  // Pagination
  const totalPages = settings.grouping?.enabled
    ? Math.ceil(eventGroups.length / PAGE_SIZE)
    : Math.ceil(filteredEvents.length / PAGE_SIZE);

  const paginatedEvents = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, currentPage]);

  const paginatedGroups = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return eventGroups.slice(start, start + PAGE_SIZE);
  }, [eventGroups, currentPage]);

  // Close filter menu when clicking outside
  useEffect(() => {
    if (!filterMenuEvent) return;

    const handleClickOutside = () => {
      setFilterMenuEvent(null);
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [filterMenuEvent]);

  return {
    // Core state
    events,
    settings,
    tabId,

    // UI state
    searchText,
    expandedEvents,
    copiedId,
    showFilters,
    currentPage,
    newEventIds,
    filterMenuEvent,
    collapsedGroups,
    showSettings,
    copyError,

    // Computed values
    filteredEvents,
    eventGroups,
    availableEventTypes,
    uniqueSources,
    totalPages,
    paginatedEvents,
    paginatedGroups,

    // Setters - exposed for actions hook
    setEvents,
    setSettings,
    setSearchText,
    setExpandedEvents,
    setCopiedId,
    setShowFilters,
    setShowSettings,
    setCurrentPage,
    setNewEventIds,
    setFilterMenuEvent,
    setCollapsedGroups,
    setCopyError,
  };
}

export { PAGE_SIZE };
