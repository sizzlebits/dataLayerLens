/**
 * View Mode section for Settings Drawer.
 * Allows switching between overlay, side panel, and devtools views.
 */

import { motion } from 'framer-motion';
import { SquareStack, PanelRight, Wrench } from 'lucide-react';
import { Settings } from '@/types';

interface ViewModeSectionProps {
  viewMode: Settings['viewMode'];
  onViewModeChange: (mode: 'overlay' | 'sidepanel' | 'devtools') => void;
}

export function ViewModeSection({ viewMode, onViewModeChange }: ViewModeSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        View Mode
      </h3>
      <div className="grid grid-cols-3 gap-1.5">
        <motion.button
          onClick={() => onViewModeChange('overlay')}
          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-colors ${
            viewMode === 'overlay'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-slate-400 hover:text-white hover:border-slate-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SquareStack className="w-4 h-4" />
          <span className="text-[10px] font-medium">Overlay</span>
        </motion.button>
        <motion.button
          onClick={() => onViewModeChange('sidepanel')}
          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-colors ${
            viewMode === 'sidepanel'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-slate-400 hover:text-white hover:border-slate-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PanelRight className="w-4 h-4" />
          <span className="text-[10px] font-medium">Side Panel</span>
        </motion.button>
        <motion.button
          onClick={() => onViewModeChange('devtools')}
          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-colors ${
            viewMode === 'devtools'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-slate-400 hover:text-white hover:border-slate-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Wrench className="w-4 h-4" />
          <span className="text-[10px] font-medium">DevTools</span>
        </motion.button>
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        {viewMode === 'overlay' && 'On-page overlay for quick access.'}
        {viewMode === 'sidepanel' && 'Opens in browser side panel.'}
        {viewMode === 'devtools' && 'F12 → DL tab'}
      </p>
    </div>
  );
}
