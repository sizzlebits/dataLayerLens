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
  Download,
  Terminal,
  Plus,
  FolderOpen,
  Folder,
  Settings,
} from 'lucide-react';
import { DataLayerEvent, EventGroup, getEventCategory, Settings as SettingsType, DEFAULT_SETTINGS } from '@/types';
import { EventRow, SettingsDrawer, Toast } from '@/components/shared';
import { copyToClipboard, isClipboardApiAvailable } from '@/utils/clipboard';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const PAGE_SIZE = 50;

export function DevToolsPanel() {
  const [events, setEvents] = useState<DataLayerEvent[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [currentPage, setCurrentPage] = useState(0);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [filterMenuEvent, setFilterMenuEvent] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const clearingRef = useRef(false);

  // Feature detection for clipboard (doesn't actually use clipboard)
  const clipboardAvailable = isClipboardApiAvailable();

  // Get tab ID for DevTools
  const tabId = browserAPI.devtools.inspectedWindow.tabId;

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await browserAPI.tabs.sendMessage(tabId, { type: 'GET_SETTINGS' });
        if (response?.settings) {
          setSettings(response.settings);
        }
      } catch (error) {
        console.debug('Could not load settings:', error);
      }
    };
    loadSettings();
  }, [tabId]);

  // Load events function
  const loadEvents = useCallback(async () => {
    try {
      const response = await browserAPI.tabs.sendMessage(tabId, { type: 'GET_EVENTS' });
      if (response?.events) {
        // Sort events by timestamp descending (most recent first)
        const sortedEvents = [...response.events].sort(
          (a: DataLayerEvent, b: DataLayerEvent) => b.timestamp - a.timestamp
        );
        setEvents(sortedEvents);
        setCurrentPage(0);
      }
    } catch (err) {
      console.debug('Could not load events:', err);
    }
  }, [tabId]);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Listen for new events and settings changes
  useEffect(() => {
    const messageListener = (
      message: { type: string; payload?: DataLayerEvent | Partial<SettingsType>; tabId?: number }
    ) => {
      if (message.type === 'DATALAYER_EVENT' || message.type === 'EVENT_ADDED') {
        if (clearingRef.current) return;

        if (message.payload) {
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
      }
    };

    browserAPI.runtime.onMessage.addListener(messageListener);

    return () => {
      browserAPI.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Filter events based on search and event filters
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
    clearingRef.current = true;
    setEvents([]);
    setNewEventIds(new Set());
    setExpandedEvents(new Set());
    setCurrentPage(0);

    try {
      await browserAPI.tabs.sendMessage(tabId, { type: 'CLEAR_EVENTS' });
    } catch (error) {
      console.error('Failed to clear events:', error);
    }

    setTimeout(() => {
      clearingRef.current = false;
    }, 1000);
  }, [tabId]);

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
    const result = await copyToClipboard(text);

    if (result.success) {
      setCopiedId(event.id);
      setCopyError(null);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      // Show error message briefly
      setCopyError(result.error || 'Copy failed');
      setTimeout(() => setCopyError(null), 3000);
    }
  }, []);

  const togglePersist = useCallback(async () => {
    const newValue = !settings.persistEvents;
    setSettings((prev) => ({ ...prev, persistEvents: newValue }));
    browserAPI.tabs.sendMessage(tabId, {
      type: 'UPDATE_SETTINGS',
      payload: { persistEvents: newValue },
    }).catch(() => {});
  }, [settings.persistEvents, tabId]);

  const toggleGrouping = useCallback(async () => {
    const newValue = !settings.grouping?.enabled;
    setSettings((prev) => ({
      ...prev,
      grouping: { ...prev.grouping, enabled: newValue },
    }));
    browserAPI.tabs.sendMessage(tabId, {
      type: 'UPDATE_SETTINGS',
      payload: { grouping: { ...settings.grouping, enabled: newValue } },
    }).catch(() => {});
  }, [settings.grouping, tabId]);

  const toggleConsoleLogging = useCallback(async () => {
    const newValue = !settings.consoleLogging;
    setSettings((prev) => ({ ...prev, consoleLogging: newValue }));
    browserAPI.tabs.sendMessage(tabId, {
      type: 'UPDATE_SETTINGS',
      payload: { consoleLogging: newValue },
    }).catch(() => {});
  }, [settings.consoleLogging, tabId]);

  const addFilter = useCallback((eventName: string, mode: 'include' | 'exclude') => {
    if (settings.eventFilters.includes(eventName)) return;
    const newFilters = [...settings.eventFilters, eventName];
    const updates = { eventFilters: newFilters, filterMode: mode };
    setSettings((prev) => ({ ...prev, ...updates }));
    browserAPI.tabs.sendMessage(tabId, {
      type: 'UPDATE_SETTINGS',
      payload: updates,
    }).catch(() => {});
    setFilterMenuEvent(null);
  }, [settings.eventFilters, tabId]);

  const removeFilter = useCallback((filter: string) => {
    const newFilters = settings.eventFilters.filter((f) => f !== filter);
    setSettings((prev) => ({ ...prev, eventFilters: newFilters }));
    browserAPI.tabs.sendMessage(tabId, {
      type: 'UPDATE_SETTINGS',
      payload: { eventFilters: newFilters },
    }).catch(() => {});
  }, [settings.eventFilters, tabId]);

  const toggleFilterMode = useCallback(() => {
    const newMode = settings.filterMode === 'include' ? 'exclude' : 'include';
    setSettings((prev) => ({ ...prev, filterMode: newMode }));
    browserAPI.tabs.sendMessage(tabId, {
      type: 'UPDATE_SETTINGS',
      payload: { filterMode: newMode },
    }).catch(() => {});
  }, [settings.filterMode, tabId]);

  const handleUpdateSettings = useCallback((updates: Partial<SettingsType>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

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

  return (
    <div className="h-screen flex flex-col bg-dl-darker text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="devtools-header flex-shrink-0 bg-gradient-to-r from-dl-dark to-dl-darker border-b border-dl-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="w-8 h-8 bg-gradient-to-br from-dl-primary to-dl-secondary rounded-lg flex items-center justify-center"
            >
              <Layers className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-white">DataLayer Lens</h1>
              <p className="text-xs text-slate-500">{filteredEvents.length} events</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={toggleConsoleLogging}
              className={`header-btn hide-md ${
                settings.consoleLogging
                  ? 'bg-dl-accent/20 text-dl-accent'
                  : 'bg-dl-card text-slate-400 hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Log events to browser console"
            >
              <Terminal className="btn-icon" />
              <span className="btn-label">Console</span>
            </motion.button>

            <motion.button
              onClick={toggleGrouping}
              className={`header-btn ${
                settings.grouping?.enabled
                  ? 'bg-dl-primary/20 text-dl-primary'
                  : 'bg-dl-card text-slate-400 hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Toggle grouping"
            >
              <Grid className="btn-icon" />
              <span className="btn-label">Group</span>
            </motion.button>

            <motion.button
              onClick={togglePersist}
              className={`header-btn ${
                settings.persistEvents
                  ? 'bg-dl-primary/20 text-dl-primary'
                  : 'bg-dl-card text-slate-400 hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Persist events on refresh"
            >
              <Save className="btn-icon" />
              <span className="btn-label">Persist</span>
            </motion.button>

            <motion.button
              onClick={exportEvents}
              className="header-btn hide-md bg-dl-card hover:bg-dl-border text-slate-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Export events"
            >
              <Download className="btn-icon" />
              <span className="btn-label">Export</span>
            </motion.button>

            <motion.button
              onClick={clearEvents}
              className="header-btn bg-dl-error/10 hover:bg-dl-error/20 text-dl-error"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Clear events"
            >
              <Trash2 className="btn-icon" />
              <span className="btn-label">Clear</span>
            </motion.button>

            <motion.button
              onClick={() => setShowSettings(true)}
              className="header-btn bg-dl-card hover:bg-dl-border text-slate-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Settings"
            >
              <Settings className="btn-icon" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="search-filter-bar flex-shrink-0 bg-dl-dark border-b border-dl-border px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          {/* Search Input - takes remaining space */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-8 py-2 bg-dl-card border border-dl-border rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none focus:ring-1 focus:ring-dl-primary/50"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-dl-border rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Container - always on right */}
          <div className="flex-shrink-0">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showFilters || settings.eventFilters.length > 0
                  ? 'bg-dl-primary/20 text-dl-primary'
                  : 'bg-dl-card text-slate-400 hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="filter-label">Filters</span>
              {settings.eventFilters.length > 0 && (
                <span className="px-1.5 py-0.5 bg-dl-primary text-white text-[10px] rounded-full min-w-[18px] text-center">
                  {settings.eventFilters.length}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </motion.button>
          </div>
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
              <div className="pt-2 space-y-3">
                {/* Filter Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Mode:</span>
                  <button
                    onClick={toggleFilterMode}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
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
                  <div className="flex flex-wrap gap-1.5">
                    {settings.eventFilters.map((filter) => (
                      <span
                        key={filter}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
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
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Available Event Types */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    Add filter from captured events:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {availableEventTypes
                      .filter((type) => !settings.eventFilters.includes(type))
                      .map((type) => {
                        const category = getEventCategory(type);
                        return (
                          <button
                            key={type}
                            onClick={() => addFilter(type, settings.filterMode)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                            }}
                          >
                            <Plus className="w-3 h-3" />
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
            <Database className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No events captured</p>
            <p className="text-sm">Waiting for dataLayer pushes...</p>
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
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dl-card/50 border-l-2 border-dl-primary/50"
                  >
                    <motion.div
                      animate={{ rotate: isCollapsed ? 0 : 90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </motion.div>
                    {isCollapsed ? (
                      <Folder className="w-5 h-5 text-dl-primary" />
                    ) : (
                      <FolderOpen className="w-5 h-5 text-dl-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">
                          {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                        </span>
                        {group.triggerEvent && (
                          <span className="text-xs text-dl-primary truncate">
                            triggered by {group.triggerEvent}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
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
                        <div className="pl-6 border-l-2 border-dl-primary/20 ml-4">
                          {group.events.map((event) => (
                            <EventRow
                              key={event.id}
                              event={event}
                              isExpanded={expandedEvents.has(event.id)}
                              isCopied={copiedId === event.id}
                              isNew={newEventIds.has(event.id)}
                              showFilterMenu={filterMenuEvent === event.id}
                              onToggle={() => toggleExpanded(event.id)}
                              onCopy={clipboardAvailable ? () => copyEvent(event) : undefined}
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
                onToggle={() => toggleExpanded(event.id)}
                onCopy={clipboardAvailable ? () => copyEvent(event) : undefined}
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
        <div className="flex-shrink-0 flex items-center justify-center gap-4 px-4 py-3 bg-dl-dark border-t border-dl-border">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 bg-dl-card hover:bg-dl-border disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs text-slate-300 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-400">
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
            className="px-3 py-1.5 bg-dl-card hover:bg-dl-border disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs text-slate-300 transition-colors"
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
        activeTabId={tabId}
      />

      {/* Copy Error Toast */}
      <Toast message={copyError} type="error" />
    </div>
  );
}
