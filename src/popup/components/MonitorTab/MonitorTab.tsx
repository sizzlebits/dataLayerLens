/**
 * MonitorTab - Main monitoring tab component.
 * Shows filter panel, event stats, and quick info.
 */

import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import type { Settings, DataLayerEvent } from '@/types';
import { FilterPanel } from './FilterPanel';
import { EventStats } from './EventStats';

export interface MonitorTabProps {
  settings: Settings;
  events: DataLayerEvent[];
  currentDomain: string;
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

      {/* DevTools Info */}
      <div className="bg-dl-card rounded-xl p-4 border border-dl-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-dl-dark rounded-lg">
            <Wrench className="w-5 h-5 text-dl-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-theme-text">View Events in DevTools</h3>
            <p className="text-xs text-theme-text-secondary">Press F12, then select the DataLayer Lens tab</p>
          </div>
        </div>
      </div>

      {/* Event Stats */}
      <EventStats
        eventCount={events.length}
        maxEvents={settings.maxEvents}
        onClear={onClearEvents}
        onExport={onExportEvents}
      />

      {/* Quick Info */}
      <div className="text-center text-xs text-theme-text-tertiary py-2">
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
