import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Clock,
  Database,
  Save,
  Grid,
  Settings,
  Plus,
  FolderOpen,
  Folder,
} from 'lucide-react';
import { DataLayerEvent, EventGroup, getEventCategory, Settings as SettingsType, DEFAULT_SETTINGS } from '@/types';
import { EventRow, SettingsDrawer } from '@/components/shared';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const PAGE_SIZE = 50;

export function SidePanel() {
  const [events, setEvents] = useState<DataLayerEvent[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [filterMenuEvent, setFilterMenuEvent] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clearingRef = useRef(false);
  const eventsVersion = useRef(0);

  // Get active tab ID
  useEffect(() => {
    const getActiveTab = async () => {
      try {
        const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          setActiveTabId(tab.id);
        }
      } catch (err) {
        console.error('Failed to get active tab:', err);
      }
    };

    getActiveTab();

    // Listen for tab changes
    const handleTabActivated = (activeInfo: { tabId: number }) => {
      setActiveTabId(activeInfo.tabId);
      setEvents([]); // Clear events when switching tabs
      setCurrentPage(0);
    };

    const handleTabUpdated = (tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete' && tabId === activeTabId) {
        // Tab reloaded, refresh events
        loadEvents(tabId);
      }
    };

    browserAPI.tabs.onActivated.addListener(handleTabActivated);
    browserAPI.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      browserAPI.tabs.onActivated.removeListener(handleTabActivated);
      browserAPI.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [activeTabId]);

  // Load events function
  const loadEvents = useCallback(async (tabId: number) => {
    try {
      const response = await browserAPI.tabs.sendMessage(tabId, { type: 'GET_EVENTS' });
      if (response?.events) {
        // Sort events by timestamp descending (most recent first)
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

  // Load settings and events when tab changes
  useEffect(() => {
    if (!activeTabId) return;

    const loadSettings = async () => {
      try {
        const response = await browserAPI.tabs.sendMessage(activeTabId, { type: 'GET_SETTINGS' });
        if (response?.settings) {
          setSettings(response.settings);
        }
      } catch (err) {
        console.debug('Could not load settings:', err);
      }
    };

    loadSettings();
    loadEvents(activeTabId);
  }, [activeTabId, loadEvents]);

  // Listen for new events and settings changes
  useEffect(() => {
    const messageListener = (
      message: { type: string; payload?: DataLayerEvent | Partial<SettingsType>; tabId?: number },
      sender: { tab?: { id?: number } }
    ) => {
      const messageTabId = message.tabId ?? sender?.tab?.id;

      // Only accept messages from the active tab
      if (messageTabId !== activeTabId) return;

      if (message.type === 'DATALAYER_EVENT' || message.type === 'EVENT_ADDED') {
        // Ignore events that arrive immediately after clearing
        if (clearingRef.current) return;

        if (message.payload) {
          const newEvent = message.payload as DataLayerEvent;
          setEvents((prev) => {
            // Check if event already exists to avoid duplicates
            if (prev.some((e) => e.id === newEvent.id)) {
              return prev;
            }
            // Add new event at the beginning (most recent first)
            return [newEvent, ...prev].slice(0, 1000);
          });
          // Add to new events set for animation
          setNewEventIds((prev) => new Set(prev).add(newEvent.id));
          // Remove from "new" set after animation completes (2s like overlay)
          setTimeout(() => {
            setNewEventIds((prev) => {
              const next = new Set(prev);
              next.delete(newEvent.id);
              return next;
            });
          }, 2000);
        }
      } else if (message.type === 'SETTINGS_UPDATED') {
        // Settings changed from popup or content script
        if (message.payload) {
          setSettings((prev) => ({ ...prev, ...(message.payload as Partial<SettingsType>) }));
        }
      }
    };

    browserAPI.runtime.onMessage.addListener(messageListener);

    return () => {
      browserAPI.runtime.onMessage.removeListener(messageListener);
    };
  }, [activeTabId]);

  // Filter events based on search and event filters
  const filteredEvents = useMemo(() => {
    let result = events;

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((event) =>
        event.event.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      );
    }

    // Apply event type filters
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

  // Get unique event types for filter suggestions
  const availableEventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.event));
    return Array.from(types).sort();
  }, [events]);

  // Group events when grouping is enabled
  const eventGroups = useMemo((): EventGroup[] => {
    if (!settings.grouping?.enabled || filteredEvents.length === 0) {
      return [];
    }

    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;
    let lastEventTime = 0;

    // Events are already sorted most recent first, process in reverse to build groups chronologically
    const eventsChronological = [...filteredEvents].reverse();

    for (const event of eventsChronological) {
      const shouldStartNew = (() => {
        if (!currentGroup) return true;

        if (settings.grouping.mode === 'time') {
          return event.timestamp - lastEventTime > settings.grouping.timeWindowMs;
        } else {
          // Event mode - start new group on trigger events
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

    // Reverse events within each group so newest is first, and reverse groups so newest group is first
    groups.forEach((g) => g.events.reverse());
    groups.reverse();

    return groups;
  }, [filteredEvents, settings.grouping]);

  // Pagination - works with both flat events and groups
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
  }, []);

  const clearEvents = useCallback(async () => {
    if (!activeTabId) return;

    // Set clearing flag BEFORE anything else to block incoming events
    clearingRef.current = true;

    // Clear local state immediately for responsive UI
    setEvents([]);
    setNewEventIds(new Set());
    setExpandedEvents(new Set());
    setCurrentPage(0);
    eventsVersion.current += 1;

    try {
      // Tell content script to clear its events
      await browserAPI.tabs.sendMessage(activeTabId, { type: 'CLEAR_EVENTS' });
    } catch (error) {
      console.error('Failed to clear events in content script:', error);
    }

    // Allow new events after a longer delay to ensure any in-flight events are ignored
    setTimeout(() => {
      clearingRef.current = false;
    }, 1000);
  }, [activeTabId]);

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
  }, []);

  const copyEvent = useCallback(async (event: DataLayerEvent) => {
    const text = JSON.stringify(event.data, null, 2);
    try {
      // Try modern clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch {
      // Fallback for contexts where clipboard API may be restricted
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const togglePersist = useCallback(async () => {
    const newValue = !settings.persistEvents;
    setSettings((prev) => ({ ...prev, persistEvents: newValue }));
    if (activeTabId) {
      browserAPI.tabs.sendMessage(activeTabId, {
        type: 'UPDATE_SETTINGS',
        payload: { persistEvents: newValue },
      }).catch(() => {});
    }
  }, [settings.persistEvents, activeTabId]);

  const toggleGrouping = useCallback(async () => {
    const newValue = !settings.grouping?.enabled;
    setSettings((prev) => ({
      ...prev,
      grouping: { ...prev.grouping, enabled: newValue },
    }));
    if (activeTabId) {
      browserAPI.tabs.sendMessage(activeTabId, {
        type: 'UPDATE_SETTINGS',
        payload: { grouping: { ...settings.grouping, enabled: newValue } },
      }).catch(() => {});
    }
  }, [settings.grouping, activeTabId]);

  const addFilter = useCallback((eventName: string, mode: 'include' | 'exclude') => {
    if (settings.eventFilters.includes(eventName)) return;
    const newFilters = [...settings.eventFilters, eventName];
    const updates = { eventFilters: newFilters, filterMode: mode };
    setSettings((prev) => ({ ...prev, ...updates }));
    if (activeTabId) {
      browserAPI.tabs.sendMessage(activeTabId, {
        type: 'UPDATE_SETTINGS',
        payload: updates,
      }).catch(() => {});
    }
    setFilterMenuEvent(null);
  }, [settings.eventFilters, activeTabId]);

  const removeFilter = useCallback((filter: string) => {
    const newFilters = settings.eventFilters.filter((f) => f !== filter);
    setSettings((prev) => ({ ...prev, eventFilters: newFilters }));
    if (activeTabId) {
      browserAPI.tabs.sendMessage(activeTabId, {
        type: 'UPDATE_SETTINGS',
        payload: { eventFilters: newFilters },
      }).catch(() => {});
    }
  }, [settings.eventFilters, activeTabId]);

  const toggleFilterMode = useCallback(() => {
    const newMode = settings.filterMode === 'include' ? 'exclude' : 'include';
    setSettings((prev) => ({ ...prev, filterMode: newMode }));
    if (activeTabId) {
      browserAPI.tabs.sendMessage(activeTabId, {
        type: 'UPDATE_SETTINGS',
        payload: { filterMode: newMode },
      }).catch(() => {});
    }
  }, [settings.filterMode, activeTabId]);

  const handleUpdateSettings = useCallback((updates: Partial<SettingsType>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Close filter menu when clicking outside
  useEffect(() => {
    if (!filterMenuEvent) return;

    const handleClickOutside = () => {
      setFilterMenuEvent(null);
    };

    // Delay to allow the click event to propagate first
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [filterMenuEvent]);

  return (
    <div className="h-screen flex flex-col bg-dl-darker text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-dl-dark to-dl-darker border-b border-dl-border px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-dl-primary to-dl-secondary rounded-lg flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <h1 className="font-semibold text-white text-sm">DataLayer Lens</h1>
            <span className="px-2 py-0.5 bg-dl-primary/20 text-dl-primary text-xs rounded-full font-medium">
              {filteredEvents.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              onClick={toggleGrouping}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.grouping?.enabled
                  ? 'bg-dl-primary/20 text-dl-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dl-card'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Toggle grouping"
            >
              <Grid className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={togglePersist}
              className={`p-1.5 rounded-lg transition-colors ${
                settings.persistEvents
                  ? 'bg-dl-primary/20 text-dl-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dl-card'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Persist events on refresh"
            >
              <Save className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={clearEvents}
              className="p-1.5 text-slate-400 hover:text-dl-error hover:bg-dl-error/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Clear all events"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-dl-card rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Open settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex-shrink-0 bg-dl-dark border-b border-dl-border px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-8 pr-7 py-1.5 bg-dl-card border border-dl-border rounded-lg text-xs text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none focus:ring-1 focus:ring-dl-primary/50"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-dl-border rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              showFilters || settings.eventFilters.length > 0
                ? 'bg-dl-primary/20 text-dl-primary'
                : 'bg-dl-card text-slate-400 hover:text-slate-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Toggle filters"
          >
            <Filter className="w-3.5 h-3.5" />
            {settings.eventFilters.length > 0 && (
              <span className="px-1 py-0.5 bg-dl-primary text-white text-[10px] rounded-full min-w-[16px] text-center">
                {settings.eventFilters.length}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </motion.button>
        </div>

        {/* Filters Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 space-y-2">
                {/* Filter Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mode:</span>
                  <button
                    onClick={toggleFilterMode}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      settings.filterMode === 'include'
                        ? 'bg-dl-success/20 text-dl-success'
                        : 'bg-dl-error/20 text-dl-error'
                    }`}
                  >
                    {settings.filterMode === 'include' ? 'Include only' : 'Exclude'}
                  </button>
                </div>

                {/* Active Filters */}
                {settings.eventFilters.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {settings.eventFilters.map((filter) => (
                      <span
                        key={filter}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          settings.filterMode === 'include'
                            ? 'bg-dl-success/20 text-dl-success'
                            : 'bg-dl-error/20 text-dl-error'
                        }`}
                      >
                        {filter}
                        <button
                          onClick={() => removeFilter(filter)}
                          className="hover:bg-white/10 rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Available Event Types */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Add filter from captured events:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {availableEventTypes
                      .filter((type) => !settings.eventFilters.includes(type))
                      .map((type) => {
                        const category = getEventCategory(type);
                        return (
                          <button
                            key={type}
                            onClick={() => addFilter(type, settings.filterMode)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium opacity-70 hover:opacity-100 transition-opacity"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                            }}
                          >
                            <Plus className="w-2.5 h-2.5" />
                            {type}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Database className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No events captured</p>
            <p className="text-xs">Waiting for dataLayer pushes...</p>
          </div>
        ) : settings.grouping?.enabled ? (
          /* Grouped View */
          <div className="divide-y divide-dl-border">
            {paginatedGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.id);
              const groupTime = new Date(group.startTime).toLocaleTimeString();
              return (
                <div key={group.id} className="bg-dl-dark/30">
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroupCollapsed(group.id)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-dl-card/50 border-l-2 border-dl-primary/50"
                  >
                    <motion.div
                      animate={{ rotate: isCollapsed ? 0 : 90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </motion.div>
                    {isCollapsed ? (
                      <Folder className="w-4 h-4 text-dl-primary" />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-dl-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">
                          {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                        </span>
                        {group.triggerEvent && (
                          <span className="text-[10px] text-dl-primary truncate">
                            triggered by {group.triggerEvent}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock className="w-2.5 h-2.5" />
                        {groupTime}
                      </div>
                    </div>
                  </div>

                  {/* Group Events */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 border-l-2 border-dl-primary/20 ml-3">
                          {group.events.map((event) => (
                            <EventRow
                              key={event.id}
                              event={event}
                              isExpanded={expandedEvents.has(event.id)}
                              isCopied={copiedId === event.id}
                              isNew={newEventIds.has(event.id)}
                              showFilterMenu={filterMenuEvent === event.id}
                              compact
                              onToggle={() => toggleExpanded(event.id)}
                              onCopy={() => copyEvent(event)}
                              onAddFilterInclude={() => addFilter(event.event, 'include')}
                              onAddFilterExclude={() => addFilter(event.event, 'exclude')}
                              onToggleFilterMenu={() =>
                                setFilterMenuEvent((prev) => (prev === event.id ? null : event.id))
                              }
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat View */
          <div className="divide-y divide-dl-border">
            {paginatedEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                isExpanded={expandedEvents.has(event.id)}
                isCopied={copiedId === event.id}
                isNew={newEventIds.has(event.id)}
                showFilterMenu={filterMenuEvent === event.id}
                compact
                onToggle={() => toggleExpanded(event.id)}
                onCopy={() => copyEvent(event)}
                onAddFilterInclude={() => addFilter(event.event, 'include')}
                onAddFilterExclude={() => addFilter(event.event, 'exclude')}
                onToggleFilterMenu={() =>
                  setFilterMenuEvent((prev) => (prev === event.id ? null : event.id))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-3 px-3 py-2 bg-dl-dark border-t border-dl-border">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-2 py-1 bg-dl-card hover:bg-dl-border disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-slate-300 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-400">
            {settings.grouping?.enabled ? (
              <>
                {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, eventGroups.length)} of{' '}
                {eventGroups.length} groups
              </>
            ) : (
              <>
                {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, filteredEvents.length)} of{' '}
                {filteredEvents.length}
              </>
            )}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-2 py-1 bg-dl-card hover:bg-dl-border disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-slate-300 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeTabId={activeTabId}
      />
    </div>
  );
}

