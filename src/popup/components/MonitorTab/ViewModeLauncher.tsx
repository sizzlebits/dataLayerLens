/**
 * ViewModeLauncher - Buttons to launch different view modes.
 * Overlay, Side Panel, and DevTools options.
 */

import { motion } from 'framer-motion';
import { Eye, SquareStack, PanelRight, Wrench } from 'lucide-react';

export interface ViewModeLauncherProps {
  overlayEnabled: boolean;
  onToggleOverlay: () => void;
  onOpenSidePanel: () => void;
}

export function ViewModeLauncher({
  overlayEnabled,
  onToggleOverlay,
  onOpenSidePanel,
}: ViewModeLauncherProps) {
  return (
    <div className="bg-dl-card rounded-xl p-4 border border-dl-border">
      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4 text-dl-primary" />
        View Events
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          onClick={onToggleOverlay}
          className="flex flex-col items-center gap-2 p-3 bg-dl-dark rounded-lg border border-dl-border hover:border-dl-primary/50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SquareStack className="w-5 h-5 text-dl-primary" />
          <span className="text-xs text-white font-medium">Overlay</span>
          {overlayEnabled && (
            <span className="text-[9px] text-dl-success">Active</span>
          )}
        </motion.button>
        <motion.button
          onClick={onOpenSidePanel}
          className="flex flex-col items-center gap-2 p-3 bg-dl-dark rounded-lg border border-dl-border hover:border-dl-primary/50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PanelRight className="w-5 h-5 text-dl-primary" />
          <span className="text-xs text-white font-medium">Side Panel</span>
        </motion.button>
        <div className="flex flex-col items-center gap-2 p-3 bg-dl-dark rounded-lg border border-dl-border">
          <Wrench className="w-5 h-5 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">DevTools</span>
          <span className="text-[9px] text-slate-500 text-center">F12 → DL</span>
        </div>
      </div>
    </div>
  );
}
