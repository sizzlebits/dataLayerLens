import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, ChevronRight, Plus, X } from 'lucide-react';
import { Settings, DEFAULT_GROUPING } from '@/types';

// Common event names for trigger suggestions
const COMMON_TRIGGER_EVENTS = [
  'gtm.js',
  'gtm.dom',
  'gtm.load',
  'page_view',
  'virtualPageView',
];

interface GroupingSettingsProps {
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  /** Hide header and show as a compact standalone component */
  compact?: boolean;
}

export function GroupingSettings({ settings, onUpdateSettings, compact = false }: GroupingSettingsProps) {
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState('');

  const updateSettings = (updates: Partial<Settings>) => {
    onUpdateSettings(updates);
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

  return (
    <div className="space-y-2">
      {!compact && (
        <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-dl-primary" />
          Event Grouping
        </h3>
      )}

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
                  : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
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
                  : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
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
                      : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
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
              <p className="text-[10px] text-theme-text-tertiary">Events that start a new group:</p>
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
                        className="hover:text-theme-text"
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
                    className="w-full bg-dl-card border border-dl-border rounded px-2 py-1 text-xs text-theme-text placeholder:text-theme-text-tertiary focus:border-dl-primary focus:outline-none"
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
                        className="px-1.5 py-0.5 text-[10px] rounded bg-dl-card border border-dl-border text-theme-text-secondary hover:text-theme-text hover:border-dl-primary transition-colors"
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTrigger(true)}
                  className="flex items-center gap-1 text-xs text-theme-text-secondary hover:text-dl-primary transition-colors"
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
