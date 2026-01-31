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
  Download,
  Database,
  Minimize2,
} from 'lucide-react';
import { Settings, SOURCE_COLOR_POOL, getSourceColor } from '@/types';
import { SupportLink } from './SupportLink';
import { ThemeSelector } from './settings/ThemeSelector';
import { GroupingSettings } from './settings/GroupingSettings';
import { HighlightsSection } from './settings/HighlightsSection';

// Browser API abstraction
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  activeTabId: number | null;
  eventCount?: number;
  onExport?: () => void;
  availableEventTypes?: string[];
  eventTypeCounts?: Record<string, number>;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  activeTabId,
  eventCount,
  onExport,
  availableEventTypes = [],
  eventTypeCounts = {},
}: SettingsDrawerProps) {
  const [newLayerName, setNewLayerName] = useState('');
  const [isAddingLayer, setIsAddingLayer] = useState(false);
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

  const handleSourceColorChange = (source: string, color: string) => {
    updateSettings({
      sourceColors: {
        ...settings.sourceColors,
        [source]: color,
      },
    });
  };

  const handleAddHighlight = (eventName: string, color: string) => {
    updateSettings({
      eventHighlights: {
        ...settings.eventHighlights,
        [eventName]: color,
      },
    });
  };

  const handleRemoveHighlight = (eventName: string) => {
    const newHighlights = { ...settings.eventHighlights };
    delete newHighlights[eventName];
    updateSettings({
      eventHighlights: newHighlights,
    });
  };

  const handleHighlightColorChange = (eventName: string, color: string) => {
    updateSettings({
      eventHighlights: {
        ...settings.eventHighlights,
        [eventName]: color,
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
            className="fixed inset-0 bg-theme-bg-overlay z-40"
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
                <h2 className="font-semibold text-theme-text">Settings</h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-1.5 hover:bg-dl-border rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-theme-text-secondary" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Events Captured */}
              {(eventCount !== undefined || onExport) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-dl-accent" />
                    Events Captured
                  </h3>
                  <div className="flex items-center justify-between bg-dl-card rounded px-3 py-2 border border-dl-border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-theme-text">{eventCount ?? 0}</span>
                      <span className="text-xs text-theme-text-secondary">events</span>
                    </div>
                    {onExport && (
                      <motion.button
                        onClick={onExport}
                        disabled={!eventCount || eventCount === 0}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dl-card hover:bg-dl-border border border-dl-border rounded text-xs text-theme-text-secondary hover:text-theme-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
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
                              className="w-4 h-4 rounded-full border-2 border-theme-border-base/20 hover:border-theme-border-hover transition-colors"
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
                        className="flex-1 bg-dl-card border border-dl-border rounded px-2 py-1.5 text-xs text-theme-text placeholder:text-theme-text-tertiary focus:border-dl-primary focus:outline-none"
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
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-dl-border hover:border-dl-primary text-theme-text-secondary hover:text-dl-primary rounded text-xs transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add DataLayer
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Event Highlights */}
              <HighlightsSection
                eventHighlights={settings.eventHighlights || {}}
                availableEventTypes={availableEventTypes}
                eventTypeCounts={eventTypeCounts}
                onAdd={handleAddHighlight}
                onRemove={handleRemoveHighlight}
                onColorChange={handleHighlightColorChange}
              />

              {/* Display Settings */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Display
                </h3>

                {/* Theme Selection */}
                <ThemeSelector
                  theme={settings.theme}
                  onThemeChange={(theme) => updateSettings({ theme })}
                />

                {/* Event Grouping - moved up under theme */}
                <GroupingSettings settings={settings} onUpdateSettings={updateSettings} />

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
                  icon={<History className="w-3.5 h-3.5 text-json-null" />}
                  label="Persist Events"
                  description="Keep across refreshes"
                  checked={settings.persistEvents}
                  onChange={() => updateSettings({ persistEvents: !settings.persistEvents })}
                />

                {/* Show Emojis - moved down above console toggles */}
                <ToggleRow
                  icon={<span className="text-[14px]">😀</span>}
                  label="Event Emojis"
                  checked={settings.showEmojis}
                  onChange={() => updateSettings({ showEmojis: !settings.showEmojis })}
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
                  icon={<SettingsIcon className="w-3.5 h-3.5 text-theme-text-secondary" />}
                  label="Debug Logging"
                  description="Extension debug info"
                  checked={settings.debugLogging}
                  onChange={() => updateSettings({ debugLogging: !settings.debugLogging })}
                />
              </div>

              {/* Max Events */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  Performance
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-theme-text-secondary">Max Events</span>
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
          <span className="text-xs text-theme-text">{label}</span>
          {description && <span className="text-[10px] text-theme-text-tertiary block">{description}</span>}
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
          className="absolute top-0.5 w-4 h-4 bg-theme-bg-elevated rounded-full shadow-md"
          animate={{ left: checked ? 14 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
}
