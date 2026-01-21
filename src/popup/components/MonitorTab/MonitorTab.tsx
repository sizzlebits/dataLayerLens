/**
 * MonitorTab - Main monitoring tab component.
 * Shows filter panel, view mode launcher, event stats, and quick info.
 */

import { motion } from 'framer-motion';
import type { Settings, DataLayerEvent } from '@/types';
import { FilterPanel } from './FilterPanel';
import { ViewModeLauncher } from './ViewModeLauncher';
import { EventStats } from './EventStats';

export interface MonitorTabProps {
  settings: Settings;
  events: DataLayerEvent[];
  currentDomain: string;
  onToggleOverlay: () => void;
  onOpenSidePanel: () => void;
  onClearEvents: () => void;
  onExportEvents?: () => void;
  onAddFilter: (filter: string) => void;
  onRemoveFilter: (filter: string) => void;
  onClearFilters: () => void;
  onSetFilterMode: (mode: 'include' | 'exclude') => void;
}

export function MonitorTab({
  settings,
  events,
  currentDomain,
  onToggleOverlay,
  onOpenSidePanel,
  onClearEvents,
  onExportEvents,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
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
        onClearFilters={onClearFilters}
        onSetFilterMode={onSetFilterMode}
      />

      {/* View Mode Launcher */}
      <ViewModeLauncher
        overlayEnabled={settings.overlayEnabled}
        onToggleOverlay={onToggleOverlay}
        onOpenSidePanel={onOpenSidePanel}
      />

      {/* Event Stats */}
      <EventStats
        eventCount={events.length}
        maxEvents={settings.maxEvents}
        onClear={onClearEvents}
        onExport={onExportEvents}
      />

      {/* Quick Info */}
      <div className="text-center text-xs text-slate-500 py-2">
        <p>
          {currentDomain && (
            <span className="block mb-1 text-dl-accent">{currentDomain}</span>
          )}
          Monitoring:{' '}
          {settings.dataLayerNames.map((name, i) => (
            <span key={name}>
              <code className="text-dl-accent">{name}</code>
              {i < settings.dataLayerNames.length - 1 && ', '}
            </span>
          ))}
        </p>
      </div>
    </motion.div>
  );
}
