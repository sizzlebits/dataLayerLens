import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  Layers,
  Search,
  Trash2,
  ChevronRight,
  Copy,
  Check,
  Filter,
  X,
  Download,
  Clock,
  Tag,
  Database,
  Terminal,
} from 'lucide-react';
import { DataLayerEvent, getEventCategory, Settings, DEFAULT_SETTINGS } from '@/types';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export function DevToolsPanel() {
  const [events, setEvents] = useState<DataLayerEvent[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const tabId = browserAPI.devtools.inspectedWindow.tabId;
        const response = await browserAPI.tabs.sendMessage(tabId, { type: 'GET_SETTINGS' });
        if (response?.settings) {
          setSettings(response.settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const toggleConsoleLogging = async () => {
    const newValue = !settings.consoleLogging;
    setSettings(prev => ({ ...prev, consoleLogging: newValue }));
    try {
      const tabId = browserAPI.devtools.inspectedWindow.tabId;
      await browserAPI.tabs.sendMessage(tabId, {
        type: 'UPDATE_SETTINGS',
        payload: { consoleLogging: newValue }
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Load initial events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const tabId = browserAPI.devtools.inspectedWindow.tabId;
        const response = await browserAPI.tabs.sendMessage(tabId, { type: 'GET_EVENTS' });
        if (response?.events) {
          setEvents(response.events);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      }
    };

    loadEvents();

    // Listen for new events
    const messageListener = (message: { type: string; payload: DataLayerEvent; tabId?: number }) => {
      if (message.type === 'DATALAYER_EVENT' || message.type === 'EVENT_ADDED') {
        setEvents((prev) => [message.payload, ...prev].slice(0, 1000));
      }
    };

    browserAPI.runtime.onMessage.addListener(messageListener);

    return () => {
      browserAPI.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Get unique event types
  const eventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.event));
    return Array.from(types).sort();
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Text filter
      if (filter) {
        const searchLower = filter.toLowerCase();
        const matchesText =
          event.event.toLowerCase().includes(searchLower) ||
          JSON.stringify(event.data).toLowerCase().includes(searchLower);
        if (!matchesText) return false;
      }

      // Event type filter
      if (selectedEventTypes.size > 0 && !selectedEventTypes.has(event.event)) {
        return false;
      }

      return true;
    });
  }, [events, filter, selectedEventTypes]);

  const clearEvents = async () => {
    try {
      const tabId = browserAPI.devtools.inspectedWindow.tabId;
      await browserAPI.tabs.sendMessage(tabId, { type: 'CLEAR_EVENTS' });
      setEvents([]);
    } catch (error) {
      console.error('Failed to clear events:', error);
    }
  };

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

  const copyEvent = useCallback((event: DataLayerEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event.data, null, 2));
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
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

  const toggleEventType = useCallback((type: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-dl-darker text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-dl-dark to-dl-darker border-b border-dl-border px-4 py-3">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                settings.consoleLogging
                  ? 'bg-dl-accent/20 text-dl-accent'
                  : 'bg-dl-card text-slate-400 hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Log events to browser console"
            >
              <Terminal className="w-3 h-3" />
              Console
            </motion.button>

            <motion.button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                autoScroll
                  ? 'bg-dl-success/20 text-dl-success'
                  : 'bg-dl-card text-slate-400 hover:text-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Clock className="w-3 h-3" />
              Auto-scroll
            </motion.button>

            <motion.button
              onClick={exportEvents}
              className="px-3 py-1.5 bg-dl-card hover:bg-dl-border rounded-lg text-xs font-medium flex items-center gap-1.5 text-slate-300 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-3 h-3" />
              Export
            </motion.button>

            <motion.button
              onClick={clearEvents}
              className="px-3 py-1.5 bg-dl-error/10 hover:bg-dl-error/20 text-dl-error rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </motion.button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex-shrink-0 bg-dl-dark border-b border-dl-border px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 bg-dl-card border border-dl-border rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none focus:ring-1 focus:ring-dl-primary/50"
            />
            {filter && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-dl-border rounded"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </motion.button>
            )}
          </div>

          {/* Filter Toggle */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showFilters || selectedEventTypes.size > 0
                ? 'bg-dl-primary/20 text-dl-primary'
                : 'bg-dl-card text-slate-400 hover:text-slate-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-3 h-3" />
            Filters
            {selectedEventTypes.size > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-dl-primary text-white text-[10px] rounded-full">
                {selectedEventTypes.size}
              </span>
            )}
          </motion.button>
        </div>

        {/* Event Type Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-wrap gap-2">
                {eventTypes.map((type) => {
                  const category = getEventCategory(type);
                  const isSelected = selectedEventTypes.has(type);

                  return (
                    <motion.button
                      key={type}
                      onClick={() => toggleEventType(type)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-1 ring-offset-dl-dark'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                        ['--ring-color' as string]: isSelected ? category.color : 'transparent',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{category.icon}</span>
                      {type}
                    </motion.button>
                  );
                })}

                {selectedEventTypes.size > 0 && (
                  <motion.button
                    onClick={() => setSelectedEventTypes(new Set())}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-dl-error/20 text-dl-error hover:bg-dl-error/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear all
                  </motion.button>
                )}
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
        ) : (
          <div className="divide-y divide-dl-border">
            <AnimatePresence initial={false}>
              {filteredEvents.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                  index={index}
                  isExpanded={expandedEvents.has(event.id)}
                  isCopied={copiedId === event.id}
                  onToggle={() => toggleExpanded(event.id)}
                  onCopy={() => copyEvent(event)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

interface EventRowProps {
  event: DataLayerEvent;
  index: number;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

function EventRow({ event, index, isExpanded, isCopied, onToggle, onCopy }: EventRowProps) {
  const category = getEventCategory(event.event);
  const time = new Date(event.timestamp).toLocaleTimeString();
  const isNew = index === 0;

  return (
    <motion.div
      layout
      initial={isNew ? { backgroundColor: 'rgba(99, 102, 241, 0.2)' } : false}
      animate={{ backgroundColor: 'transparent' }}
      transition={{ duration: 1 }}
      className="group hover:bg-dl-card/50"
    >
      {/* Event Header */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
      >
        <motion.button
          className="p-1 hover:bg-dl-border rounded transition-colors"
          animate={{ rotate: isExpanded ? 90 : 0 }}
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </motion.button>

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold truncate"
              style={{ color: category.color }}
            >
              {event.event}
            </span>
            <span className="px-1.5 py-0.5 bg-dl-border rounded text-[10px] text-slate-400 font-mono">
              {event.source}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {time}
            <span className="text-slate-600">•</span>
            <Tag className="w-3 h-3" />
            {Object.keys(event.data).length} properties
          </div>
        </div>

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-dl-border rounded-lg transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-dl-success" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
        </motion.button>
      </div>

      {/* Event Data */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-16">
              <pre className="p-4 bg-dl-darker rounded-lg text-xs font-mono overflow-x-auto">
                <JsonHighlight data={event.data} />
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function JsonHighlight({ data }: { data: unknown }) {
  const renderValue = (value: unknown, depth = 0): ReactNode => {
    if (value === null) {
      return <span className="text-slate-500">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-400">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-amber-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-cyan-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-400">[]</span>;

      return (
        <>
          <span className="text-slate-400">[</span>
          <div className="ml-4">
            {value.map((item, i) => (
              <div key={i}>
                {renderValue(item, depth + 1)}
                {i < value.length - 1 && <span className="text-slate-400">,</span>}
              </div>
            ))}
          </div>
          <span className="text-slate-400">]</span>
        </>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>;

      return (
        <>
          <span className="text-slate-400">{'{'}</span>
          <div className="ml-4">
            {entries.map(([key, val], i) => (
              <div key={key}>
                <span className="text-pink-400">"{key}"</span>
                <span className="text-slate-400">: </span>
                {renderValue(val, depth + 1)}
                {i < entries.length - 1 && <span className="text-slate-400">,</span>}
              </div>
            ))}
          </div>
          <span className="text-slate-400">{'}'}</span>
        </>
      );
    }

    return <span className="text-slate-400">{String(value)}</span>;
  };

  return renderValue(data);
}
