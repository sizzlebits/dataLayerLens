/**
 * EventStats - Component for displaying event statistics.
 */

import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export interface EventStatsProps {
  eventCount: number;
  maxEvents: number;
  onClear: () => void;
}

export function EventStats({ eventCount, maxEvents, onClear }: EventStatsProps) {
  const percentage = Math.min((eventCount / maxEvents) * 100, 100);

  return (
    <div className="bg-dl-card rounded-lg p-4 border border-dl-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-300">Events Captured</span>
        <motion.button
          onClick={onClear}
          disabled={eventCount === 0}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
            eventCount > 0
              ? 'text-dl-error hover:bg-dl-error/20'
              : 'text-slate-500 cursor-not-allowed'
          }`}
          whileHover={eventCount > 0 ? { scale: 1.05 } : undefined}
          whileTap={eventCount > 0 ? { scale: 0.95 } : undefined}
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </motion.button>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{eventCount}</span>
        <span className="text-sm text-slate-500 mb-1">/ {maxEvents}</span>
      </div>

      <div className="mt-3 h-1.5 bg-dl-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-dl-primary to-dl-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
