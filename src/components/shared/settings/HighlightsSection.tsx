/**
 * Event Highlights section for Settings Drawer.
 * Allows highlighting certain event types with colored bars.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlighter, Plus, Check, X } from 'lucide-react';
import { HIGHLIGHT_COLOR_KEYS, autoAssignHighlightColor, getHighlightCssVar, isHighlightColorKey } from '@/types';

interface HighlightsSectionProps {
  eventHighlights: Record<string, string>;
  availableEventTypes: string[];
  eventTypeCounts: Record<string, number>;
  onAdd: (eventName: string, color: string) => void;
  onRemove: (eventName: string) => void;
  onColorChange: (eventName: string, color: string) => void;
}

export function HighlightsSection({
  eventHighlights,
  availableEventTypes,
  eventTypeCounts,
  onAdd,
  onRemove,
  onColorChange,
}: HighlightsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [customEventName, setCustomEventName] = useState('');
  const [expandedColorPicker, setExpandedColorPicker] = useState<string | null>(null);

  const highlightedEvents = Object.keys(eventHighlights);

  // Event types available to add (not already highlighted)
  const unhighlightedEventTypes = availableEventTypes.filter(
    (type) => !highlightedEvents.includes(type)
  );

  const handleAddHighlight = (eventName: string) => {
    if (eventName && !eventHighlights[eventName]) {
      const color = autoAssignHighlightColor(eventHighlights);
      onAdd(eventName, color);
      setCustomEventName('');
      setIsAdding(false);
    }
  };

  const handleCustomAdd = () => {
    handleAddHighlight(customEventName.trim());
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
        <Highlighter className="w-3.5 h-3.5 text-dl-accent" />
        Event Highlights
      </h3>

      <div className="space-y-1.5">
        {/* Active Highlights */}
        {highlightedEvents.map((eventName) => {
          const colorKey = eventHighlights[eventName];
          const cssColor = isHighlightColorKey(colorKey) ? getHighlightCssVar(colorKey) : colorKey;
          const count = eventTypeCounts[eventName] || 0;
          const isExpanded = expandedColorPicker === eventName;

          return (
            <div key={eventName} className="space-y-1">
              <div className="flex items-center justify-between bg-dl-card rounded px-3 py-2 border border-dl-border group">
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setExpandedColorPicker(isExpanded ? null : eventName)}
                    className="w-4 h-4 rounded-full border-2 border-theme-border-base/20 hover:border-theme-border-hover transition-colors"
                    style={{ backgroundColor: cssColor }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Change color"
                  />
                  <span className="text-xs text-theme-text">{eventName}</span>
                  <span className="text-[10px] text-theme-text-tertiary">({count})</span>
                </div>
                <motion.button
                  onClick={() => onRemove(eventName)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dl-error/20 rounded transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-3 h-3 text-dl-error" />
                </motion.button>
              </div>

              {/* Color Picker */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 p-2 bg-dl-dark rounded border border-dl-border">
                      {HIGHLIGHT_COLOR_KEYS.map((poolColorKey) => (
                        <motion.button
                          key={poolColorKey}
                          onClick={() => {
                            onColorChange(eventName, poolColorKey);
                            setExpandedColorPicker(null);
                          }}
                          className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            colorKey === poolColorKey ? 'border-white' : 'border-transparent hover:border-white/40'
                          }`}
                          style={{ backgroundColor: getHighlightCssVar(poolColorKey) }}
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

        {/* Add Highlight UI */}
        {isAdding ? (
          <div className="space-y-2">
            {/* Custom Event Name Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customEventName}
                onChange={(e) => setCustomEventName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomAdd();
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    setCustomEventName('');
                  }
                }}
                placeholder="Event name..."
                className="flex-1 bg-dl-card border border-dl-border rounded px-2 py-1.5 text-xs text-theme-text placeholder:text-theme-text-tertiary focus:border-dl-primary focus:outline-none"
                autoFocus
              />
              <motion.button
                onClick={handleCustomAdd}
                className="p-1.5 bg-dl-success/20 hover:bg-dl-success/30 text-dl-success rounded"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!customEventName.trim()}
              >
                <Check className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsAdding(false);
                  setCustomEventName('');
                }}
                className="p-1.5 bg-dl-error/20 hover:bg-dl-error/30 text-dl-error rounded"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Captured Event Types */}
            {unhighlightedEventTypes.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-theme-text-tertiary">
                  Or select from captured events:
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {unhighlightedEventTypes.map((type) => {
                    const count = eventTypeCounts[type] || 0;
                    return (
                      <button
                        key={type}
                        onClick={() => handleAddHighlight(type)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-dl-card border border-dl-border text-theme-text-secondary hover:text-theme-text hover:border-dl-primary transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {type}
                        <span className="opacity-60">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-dl-border hover:border-dl-primary text-theme-text-secondary hover:text-dl-primary rounded text-xs transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Highlight
          </motion.button>
        )}
      </div>
    </div>
  );
}
