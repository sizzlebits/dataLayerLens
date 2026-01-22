import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Plus,
  Check,
  Clock,
  History,
  Zap,
  Settings as SettingsIcon,
  ChevronRight,
  Download,
  Database,
  Minimize2,
} from 'lucide-react';
import { Settings, DEFAULT_GROUPING, SOURCE_COLOR_POOL, getSourceColor } from '@/types';
import { SupportLink } from './SupportLink';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Common event names for trigger suggestions
const COMMON_TRIGGER_EVENTS = [
  'gtm.js',
  'gtm.dom',
  'gtm.load',
  'page_view',
  'virtualPageView',
];

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  activeTabId: number | null;
  eventCount?: number;
  onExport?: () => void;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  activeTabId,
  eventCount,
  onExport,
}: SettingsDrawerProps) {
  const [newLayerName, setNewLayerName] = useState('');
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState('');
  const [expandedColorPicker, setExpandedColorPicker] = useState<string | null>(null);

  const updateSettings = (updates: Partial<Settings>) => {
    onUpdateSettings(updates);
    // Also send to content script
    if (activeTabId) {
      browserAPI.tabs
        .sendMessage(activeTabId, {
          type: 'UPDATE_SETTINGS',
          payload: updates,
        })
        .catch(() => {});
    }
  };

  const addDataLayerName = () => {
    if (newLayerName && !settings.dataLayerNames.includes(newLayerName)) {
      updateSettings({
        dataLayerNames: [...settings.dataLayerNames, newLayerName],
      });
      setNewLayerName('');
      setIsAddingLayer(false);
    }
  };

  const removeDataLayerName = (name: string) => {
    if (settings.dataLayerNames.length > 1) {
      updateSettings({
        dataLayerNames: settings.dataLayerNames.filter((n) => n !== name),
      });
    }
  };

  const addTriggerEvent = (event: string) => {
    const currentTriggers = settings.grouping?.triggerEvents || DEFAULT_GROUPING.triggerEvents;
    if (!currentTriggers.includes(event)) {
      updateSettings({
        grouping: {
          ...(settings.grouping || DEFAULT_GROUPING),
          triggerEvents: [...currentTriggers, event],
        },
      });
    }
    setTriggerSearch('');
    setIsAddingTrigger(false);
  };

  const removeTriggerEvent = (event: string) => {
    const currentTriggers = settings.grouping?.triggerEvents || DEFAULT_GROUPING.triggerEvents;
    updateSettings({
      grouping: {
        ...(settings.grouping || DEFAULT_GROUPING),
        triggerEvents: currentTriggers.filter((t) => t !== event),
      },
    });
  };

  const handleSourceColorChange = (source: string, color: string) => {
    updateSettings({
      sourceColors: {
        ...settings.sourceColors,
        [source]: color,
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-dl-darker border-l border-dl-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dl-border bg-dl-dark">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-dl-primary" />
                <h2 className="font-semibold text-white">Settings</h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-1.5 hover:bg-dl-border rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Events Captured */}
              {(eventCount !== undefined || onExport) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-dl-accent" />
                    Events Captured
                  </h3>
                  <div className="flex items-center justify-between bg-dl-card rounded px-3 py-2 border border-dl-border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{eventCount ?? 0}</span>
                      <span className="text-xs text-slate-400">events</span>
                    </div>
                    {onExport && (
                      <motion.button
                        onClick={onExport}
                        disabled={!eventCount || eventCount === 0}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dl-card hover:bg-dl-border border border-dl-border rounded text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export
                      </motion.button>
                    )}
                  </div>
                </div>
              )}

              {/* DataLayer Names */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-dl-primary" />
                  DataLayer Arrays
                </h3>
                <div className="space-y-1.5">
                  {settings.dataLayerNames.map((name) => {
                    const color = getSourceColor(name, settings.sourceColors || {});
                    const isExpanded = expandedColorPicker === name;

                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between bg-dl-card rounded px-3 py-2 border border-dl-border group">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => setExpandedColorPicker(isExpanded ? null : name)}
                              className="w-4 h-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors"
                              style={{ backgroundColor: color }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Change colour"
                            />
                            <code className="text-xs text-dl-accent">{name}</code>
                          </div>
                          <motion.button
                            onClick={() => removeDataLayerName(name)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dl-error/20 rounded transition-all"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={settings.dataLayerNames.length <= 1}
                          >
                            <X className="w-3 h-3 text-dl-error" />
                          </motion.button>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-wrap gap-1.5 p-2 bg-dl-dark rounded border border-dl-border">
                                {SOURCE_COLOR_POOL.map((poolColor) => (
                                  <motion.button
                                    key={poolColor}
                                    onClick={() => {
                                      handleSourceColorChange(name, poolColor);
                                      setExpandedColorPicker(null);
                                    }}
                                    className={`w-5 h-5 rounded-full border-2 transition-colors ${
                                      color === poolColor ? 'border-white' : 'border-transparent hover:border-white/40'
                                    }`}
                                    style={{ backgroundColor: poolColor }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {isAddingLayer ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newLayerName}
                        onChange={(e) => setNewLayerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addDataLayerName()}
                        placeholder="e.g., dataLayer_v2"
                        className="flex-1 bg-dl-card border border-dl-border rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
                        autoFocus
                      />
                      <motion.button
                        onClick={addDataLayerName}
                        className="p-1.5 bg-dl-success/20 hover:bg-dl-success/30 text-dl-success rounded"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsAddingLayer(false);
                          setNewLayerName('');
                        }}
                        className="p-1.5 bg-dl-error/20 hover:bg-dl-error/30 text-dl-error rounded"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => setIsAddingLayer(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-dl-border hover:border-dl-primary text-slate-400 hover:text-dl-primary rounded text-xs transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add DataLayer
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Display
                </h3>

                {/* Compact Mode */}
                <ToggleRow
                  icon={<Minimize2 className="w-3.5 h-3.5 text-dl-primary" />}
                  label="Compact Mode"
                  description="Smaller UI elements"
                  checked={settings.compactMode}
                  onChange={() => updateSettings({ compactMode: !settings.compactMode })}
                />

                {/* Timestamps */}
                <ToggleRow
                  icon={<Clock className="w-3.5 h-3.5 text-dl-accent" />}
                  label="Timestamps"
                  checked={settings.showTimestamps}
                  onChange={() => updateSettings({ showTimestamps: !settings.showTimestamps })}
                />

                {/* Persist Events */}
                <ToggleRow
                  icon={<History className="w-3.5 h-3.5 text-yellow-400" />}
                  label="Persist Events"
                  description="Keep across refreshes"
                  checked={settings.persistEvents}
                  onChange={() => updateSettings({ persistEvents: !settings.persistEvents })}
                />

                {/* Console Logging */}
                <ToggleRow
                  icon={<Zap className="w-3.5 h-3.5 text-dl-accent" />}
                  label="Console Logging"
                  description="Log events to browser console"
                  checked={settings.consoleLogging}
                  onChange={() => updateSettings({ consoleLogging: !settings.consoleLogging })}
                />

                {/* Debug Logging */}
                <ToggleRow
                  icon={<SettingsIcon className="w-3.5 h-3.5 text-slate-400" />}
                  label="Debug Logging"
                  description="Extension debug info"
                  checked={settings.debugLogging}
                  onChange={() => updateSettings({ debugLogging: !settings.debugLogging })}
                />
              </div>

              {/* Event Grouping */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-dl-primary" />
                  Event Grouping
                </h3>

                <ToggleRow
                  icon={<ChevronRight className="w-3.5 h-3.5 text-dl-primary" />}
                  label="Enable Grouping"
                  checked={settings.grouping?.enabled ?? false}
                  onChange={() =>
                    updateSettings({
                      grouping: {
                        ...(settings.grouping || DEFAULT_GROUPING),
                        enabled: !(settings.grouping?.enabled ?? false),
                      },
                    })
                  }
                />

                {settings.grouping?.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 pt-2"
                  >
                    {/* Mode Selection */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          updateSettings({
                            grouping: { ...(settings.grouping || DEFAULT_GROUPING), mode: 'time' },
                          })
                        }
                        className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                          settings.grouping?.mode === 'time'
                            ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                            : 'border-dl-border text-slate-400 hover:text-white'
                        }`}
                      >
                        Time Window
                      </button>
                      <button
                        onClick={() =>
                          updateSettings({
                            grouping: { ...(settings.grouping || DEFAULT_GROUPING), mode: 'event' },
                          })
                        }
                        className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                          settings.grouping?.mode === 'event'
                            ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                            : 'border-dl-border text-slate-400 hover:text-white'
                        }`}
                      >
                        Trigger Events
                      </button>
                    </div>

                    {/* Time Window Options */}
                    {settings.grouping?.mode === 'time' && (
                      <div className="flex gap-1.5">
                        {[200, 500, 1000].map((ms) => (
                          <button
                            key={ms}
                            onClick={() =>
                              updateSettings({
                                grouping: {
                                  ...(settings.grouping || DEFAULT_GROUPING),
                                  timeWindowMs: ms,
                                },
                              })
                            }
                            className={`flex-1 py-1 text-xs rounded border transition-colors ${
                              settings.grouping?.timeWindowMs === ms
                                ? 'bg-dl-accent/20 border-dl-accent text-dl-accent'
                                : 'border-dl-border text-slate-400 hover:text-white'
                            }`}
                          >
                            {ms}ms
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Trigger Events */}
                    {settings.grouping?.mode === 'event' && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500">Events that start a new group:</p>
                        <div className="flex flex-wrap gap-1">
                          {(settings.grouping?.triggerEvents || DEFAULT_GROUPING.triggerEvents).map(
                            (trigger) => (
                              <span
                                key={trigger}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-dl-primary/20 text-dl-primary"
                              >
                                {trigger}
                                <button
                                  onClick={() => removeTriggerEvent(trigger)}
                                  className="hover:text-white"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            )
                          )}
                        </div>

                        {isAddingTrigger ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={triggerSearch}
                              onChange={(e) => setTriggerSearch(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && triggerSearch) {
                                  addTriggerEvent(triggerSearch);
                                } else if (e.key === 'Escape') {
                                  setIsAddingTrigger(false);
                                  setTriggerSearch('');
                                }
                              }}
                              placeholder="Event name..."
                              className="w-full bg-dl-card border border-dl-border rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
                              autoFocus
                            />
                            <div className="flex flex-wrap gap-1">
                              {COMMON_TRIGGER_EVENTS.filter(
                                (e) =>
                                  e.toLowerCase().includes(triggerSearch.toLowerCase()) &&
                                  !(
                                    settings.grouping?.triggerEvents ||
                                    DEFAULT_GROUPING.triggerEvents
                                  ).includes(e)
                              ).map((event) => (
                                <button
                                  key={event}
                                  onClick={() => addTriggerEvent(event)}
                                  className="px-1.5 py-0.5 text-[10px] rounded bg-dl-card border border-dl-border text-slate-400 hover:text-white hover:border-dl-primary transition-colors"
                                >
                                  {event}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingTrigger(true)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-dl-primary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add trigger event
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Max Events */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Performance
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Max Events</span>
                    <span className="text-xs text-dl-accent font-mono">{settings.maxEvents}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={settings.maxEvents}
                    onChange={(e) => updateSettings({ maxEvents: Number(e.target.value) })}
                    className="w-full accent-dl-primary h-1"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-dl-border">
                <SupportLink />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper component for toggle rows
function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-dl-card rounded px-3 py-2 border border-dl-border">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <span className="text-xs text-white">{label}</span>
          {description && <span className="text-[10px] text-slate-500 block">{description}</span>}
        </div>
      </div>
      <motion.button
        onClick={onChange}
        className={`relative w-8 h-5 rounded-full transition-colors ${
          checked ? 'bg-gradient-to-r from-dl-primary to-dl-secondary' : 'bg-dl-border'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
          animate={{ left: checked ? 14 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}
