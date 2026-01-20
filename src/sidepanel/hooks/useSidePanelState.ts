/**
 * Hook for managing SidePanel component state.
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { DataLayerEvent, EventGroup, Settings, DEFAULT_SETTINGS, DEFAULT_GROUPING, autoAssignSourceColors, getSourceColor } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export const PAGE_SIZE = 50;

export function useSidePanelState() {
  // Events state
  const [events, setEvents] = useState<DataLayerEvent[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [filterMenuEvent, setFilterMenuEvent] = useState<string | null>(null);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Settings state
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clearingRef = useRef(false);
  const eventsVersion = useRef(0);

  // Get unique sources for color assignment
  const uniqueSources = useMemo(() => {
    const sources = new Set(events.map((e) => e.source.replace(' (persisted)', '').replace('(persisted)', '')));
    return Array.from(sources);
  }, [events]);

  // Auto-assign colors to new sources
  useEffect(() => {
    if (uniqueSources.length > 0 && activeTabId) {
      const newColors = autoAssignSourceColors(uniqueSources, settings.sourceColors || {});
      if (newColors) {
        const updatedSettings = { ...settings, sourceColors: newColors };
        setSettings(updatedSettings);
        browserAPI.tabs.sendMessage(activeTabId, {
          type: 'UPDATE_SETTINGS',
          payload: { sourceColors: newColors },
        }).catch(() => {});
      }
    }
  }, [uniqueSources, settings.sourceColors, activeTabId]);

  // Get color for a source
  const getSourceColorForEvent = useCallback((source: string) => {
    const cleanSource = source.replace(' (persisted)', '').replace('(persisted)', '');
    return getSourceColor(cleanSource, settings.sourceColors || {});
  }, [settings.sourceColors]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events;

    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter((e) =>
        e.event.toLowerCase().includes(search) ||
        JSON.stringify(e.data).toLowerCase().includes(search)
      );
    }

    // Apply saved filters
    const { eventFilters, filterMode } = settings;
    if (eventFilters.length > 0) {
      if (filterMode === 'include') {
        result = result.filter((e) =>
          eventFilters.some((f) => e.event.toLowerCase().includes(f.toLowerCase()))
        );
      } else {
        result = result.filter((e) =>
          !eventFilters.some((f) => e.event.toLowerCase().includes(f.toLowerCase()))
        );
      }
    }

    return result;
  }, [events, searchText, settings.eventFilters, settings.filterMode]);

  // Group events
  const eventGroups = useMemo((): EventGroup[] => {
    if (!settings.grouping?.enabled) return [];

    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;
    const { mode, timeWindowMs, triggerEvents } = settings.grouping || DEFAULT_GROUPING;

    // Process events in reverse (oldest first for grouping)
    const sortedEvents = [...filteredEvents].reverse();

    for (const event of sortedEvents) {
      const shouldStartNew = mode === 'event'
        ? triggerEvents.includes(event.event)
        : !currentGroup || (event.timestamp - currentGroup.endTime > timeWindowMs);

      if (shouldStartNew || !currentGroup) {
        currentGroup = {
          id: `group-${event.id}`,
          events: [event],
          startTime: event.timestamp,
          endTime: event.timestamp,
          triggerEvent: event.event,
          collapsed: false,
        };
        groups.push(currentGroup);
      } else {
        currentGroup.events.push(event);
        currentGroup.endTime = event.timestamp;
      }
    }

    // Reverse to show most recent groups first
    return groups.reverse().map((g) => ({
      ...g,
      events: g.events.reverse(),
    }));
  }, [filteredEvents, settings.grouping]);

  // Paginated events
  const paginatedEvents = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, currentPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);

  return {
    // Events state
    events,
    setEvents,
    searchText,
    setSearchText,
    expandedEvents,
    setExpandedEvents,
    copiedId,
    setCopiedId,
    newEventIds,
    setNewEventIds,
    filterMenuEvent,
    setFilterMenuEvent,

    // UI state
    showFilters,
    setShowFilters,
    showSettings,
    setShowSettings,
    currentPage,
    setCurrentPage,
    collapsedGroups,
    setCollapsedGroups,

    // Settings state
    settings,
    setSettings,
    activeTabId,
    setActiveTabId,

    // Refs
    searchInputRef,
    clearingRef,
    eventsVersion,

    // Computed
    uniqueSources,
    filteredEvents,
    eventGroups,
    paginatedEvents,
    totalPages,
    getSourceColorForEvent,
  };
}
