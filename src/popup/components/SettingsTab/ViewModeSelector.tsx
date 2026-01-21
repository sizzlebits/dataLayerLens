/**
 * ViewModeSelector - Settings selector for preferred view mode.
 * Allows selecting Overlay, Side Panel, or DevTools as default view.
 */

import { motion } from 'framer-motion';
import { SquareStack, PanelRight, Wrench } from 'lucide-react';

export interface ViewModeSelectorProps {
  viewMode: 'overlay' | 'sidepanel' | 'devtools';
  onViewModeChange: (mode: 'overlay' | 'sidepanel' | 'devtools') => void;
}

export function ViewModeSelector({
  viewMode,
  onViewModeChange,
}: ViewModeSelectorProps) {
  const modeDescriptions = {
    overlay: 'On-page overlay for quick access.',
    sidepanel: 'Opens in browser side panel.',
    devtools: 'Open DevTools (F12) → DataLayer Lens tab.',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">View Mode</h3>
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          onClick={() => onViewModeChange('overlay')}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
            viewMode === 'overlay'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-slate-400 hover:text-white hover:border-slate-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SquareStack className="w-5 h-5" />
          <span className="text-xs font-medium">Overlay</span>
        </motion.button>
        <motion.button
          onClick={() => onViewModeChange('sidepanel')}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
            viewMode === 'sidepanel'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-slate-400 hover:text-white hover:border-slate-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PanelRight className="w-5 h-5" />
          <span className="text-xs font-medium">Side Panel</span>
        </motion.button>
        <motion.button
          onClick={() => onViewModeChange('devtools')}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
            viewMode === 'devtools'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-slate-400 hover:text-white hover:border-slate-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-xs font-medium">DevTools</span>
        </motion.button>
      </div>
      <p className="text-xs text-slate-500">{modeDescriptions[viewMode]}</p>
    </div>
  );
}
