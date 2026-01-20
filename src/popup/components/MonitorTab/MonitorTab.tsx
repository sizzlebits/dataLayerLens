/**
 * MonitorTab - Main monitoring tab component.
 * Shows overlay toggle, event stats, and filter management.
 */

import { motion } from 'framer-motion';
import type { Settings, DataLayerEvent } from '@/types';
import { OverlayToggle } from './OverlayToggle';
import { EventStats } from './EventStats';
import { FilterPanel } from './FilterPanel';

export interface MonitorTabProps {
  settings: Settings;
  events: DataLayerEvent[];
  onToggleOverlay: () => void;
  onClearEvents: () => void;
  onExportEvents?: () => void;
  onAddFilter: (filter: string) => void;
  onRemoveFilter: (filter: string) => void;
  onSetFilterMode: (mode: 'include' | 'exclude') => void;
}

export function MonitorTab({
  settings,
  events,
  onToggleOverlay,
  onClearEvents,
  onExportEvents,
  onAddFilter,
  onRemoveFilter,
  onSetFilterMode,
}: MonitorTabProps) {
  return (
    <motion.div
      key="main"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 space-y-4"
    >
      {/* Active Filters Section */}
      <FilterPanel
        filters={settings.eventFilters}
        filterMode={settings.filterMode}
        onAddFilter={onAddFilter}
        onRemoveFilter={onRemoveFilter}
        onSetFilterMode={onSetFilterMode}
      />

      {/* Overlay Toggle */}
      <OverlayToggle
        enabled={settings.overlayEnabled}
        onToggle={onToggleOverlay}
      />

      {/* Event Stats */}
      <EventStats
        eventCount={events.length}
        maxEvents={settings.maxEvents}
        onClear={onClearEvents}
        onExport={onExportEvents}
      />
    </motion.div>
  );
}
