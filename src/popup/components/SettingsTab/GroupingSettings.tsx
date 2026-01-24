/**
 * GroupingSettings - Component for event grouping configuration.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, X, Search } from 'lucide-react';
import { Toggle } from '../shared';
import type { GroupingConfig } from '@/types';

// Common trigger event suggestions
const COMMON_TRIGGERS = [
  'gtm.js', 'gtm.dom', 'gtm.load', 'page_view', 'virtualPageView',
];

const DEFAULT_GROUPING: GroupingConfig = {
  enabled: false,
  mode: 'time',
  timeWindowMs: 500,
  triggerEvents: ['gtm.js', 'page_view'],
};

export interface GroupingSettingsProps {
  grouping: GroupingConfig | undefined;
  onUpdateGrouping: (grouping: GroupingConfig) => void;
}

export function GroupingSettings({
  grouping,
  onUpdateGrouping,
}: GroupingSettingsProps) {
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState('');

  const currentGrouping = grouping || DEFAULT_GROUPING;

  const handleToggleEnabled = () => {
    onUpdateGrouping({
      ...currentGrouping,
      enabled: !currentGrouping.enabled,
    });
  };

  const handleSetMode = (mode: 'time' | 'event') => {
    onUpdateGrouping({
      ...currentGrouping,
      mode,
    });
  };

  const handleSetTimeWindow = (ms: number) => {
    onUpdateGrouping({
      ...currentGrouping,
      timeWindowMs: ms,
    });
  };

  const handleAddTrigger = (trigger: string) => {
    if (trigger.trim() && !currentGrouping.triggerEvents.includes(trigger.trim())) {
      onUpdateGrouping({
        ...currentGrouping,
        triggerEvents: [...currentGrouping.triggerEvents, trigger.trim()],
      });
    }
    setTriggerSearch('');
    setIsAddingTrigger(false);
  };

  const handleRemoveTrigger = (trigger: string) => {
    onUpdateGrouping({
      ...currentGrouping,
      triggerEvents: currentGrouping.triggerEvents.filter((t) => t !== trigger),
    });
  };

  const filteredTriggers = COMMON_TRIGGERS.filter(
    (t) =>
      t.toLowerCase().includes(triggerSearch.toLowerCase()) &&
      !currentGrouping.triggerEvents.includes(t)
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-theme-text-secondary flex items-center gap-2">
        <Layers className="w-4 h-4 text-dl-primary" />
        Event Grouping
      </h3>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
        <span className="text-sm text-theme-text">Enable Grouping</span>
        <Toggle checked={currentGrouping.enabled} onChange={handleToggleEnabled} />
      </div>

      {/* Grouping Options */}
      {currentGrouping.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          {/* Mode Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSetMode('time')}
              className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${
                currentGrouping.mode === 'time'
                  ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                  : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
              }`}
            >
              Time Window
            </button>
            <button
              onClick={() => handleSetMode('event')}
              className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${
                currentGrouping.mode === 'event'
                  ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                  : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
              }`}
            >
              Trigger Events
            </button>
          </div>

          {/* Time Window Options */}
          {currentGrouping.mode === 'time' && (
            <div className="flex gap-2">
              {[200, 500, 1000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => handleSetTimeWindow(ms)}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                    currentGrouping.timeWindowMs === ms
                      ? 'bg-dl-accent/20 border-dl-accent text-dl-accent'
                      : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
                  }`}
                >
                  {ms}ms
                </button>
              ))}
            </div>
          )}

          {/* Trigger Events Options */}
          {currentGrouping.mode === 'event' && (
            <div className="space-y-2">
              <p className="text-xs text-theme-text-secondary">Events that start a new group:</p>

              {/* Current triggers */}
              <div className="flex flex-wrap gap-1.5">
                {currentGrouping.triggerEvents.map((trigger) => (
                  <span
                    key={trigger}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-dl-primary/20 text-dl-primary"
                  >
                    {trigger}
                    <button
                      onClick={() => handleRemoveTrigger(trigger)}
                      className="hover:text-theme-text"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add trigger */}
              <AnimatePresence>
                {isAddingTrigger ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text-tertiary" />
                      <input
                        type="text"
                        value={triggerSearch}
                        onChange={(e) => setTriggerSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && triggerSearch.trim()) {
                            handleAddTrigger(triggerSearch);
                          } else if (e.key === 'Escape') {
                            setIsAddingTrigger(false);
                            setTriggerSearch('');
                          }
                        }}
                        placeholder="Event name..."
                        className="w-full bg-dl-dark border border-dl-border rounded-lg pl-8 pr-8 py-1.5 text-xs text-theme-text placeholder:text-theme-text-tertiary focus:border-dl-primary focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setIsAddingTrigger(false);
                          setTriggerSearch('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text-secondary hover:text-theme-text"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {filteredTriggers.length > 0 && (
                      <div className="bg-dl-dark border border-dl-border rounded-lg overflow-hidden">
                        {filteredTriggers.slice(0, 4).map((trigger) => (
                          <button
                            key={trigger}
                            onClick={() => handleAddTrigger(trigger)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-theme-text-secondary hover:bg-dl-border hover:text-theme-text transition-colors"
                          >
                            <span>{trigger}</span>
                            <Plus className="w-3.5 h-3.5 text-dl-primary" />
                          </button>
                        ))}
                      </div>
                    )}

                    {triggerSearch && !filteredTriggers.includes(triggerSearch) && (
                      <button
                        onClick={() => handleAddTrigger(triggerSearch)}
                        className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-dl-primary hover:text-dl-accent transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add "{triggerSearch}"
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddingTrigger(true)}
                    className="text-xs text-dl-primary hover:text-dl-accent flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add trigger event
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
