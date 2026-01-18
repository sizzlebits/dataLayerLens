/**
 * OverlayToggle - Component for toggling the overlay visibility.
 */

import { motion } from 'framer-motion';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';

export interface OverlayToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function OverlayToggle({ enabled, onToggle }: OverlayToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
        enabled
          ? 'bg-gradient-to-r from-dl-success/20 to-dl-success/10 border-dl-success/30 hover:border-dl-success/50'
          : 'bg-dl-card border-dl-border hover:border-dl-primary/50'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
          enabled
            ? 'bg-dl-success/20 text-dl-success'
            : 'bg-dl-border/50 text-slate-400'
        }`}
      >
        {enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-white">
          {enabled ? 'Overlay Active' : 'Overlay Hidden'}
        </div>
        <div className="text-xs text-slate-400">
          {enabled
            ? 'Click to hide the overlay on this page'
            : 'Click to show the overlay on this page'}
        </div>
      </div>
      <ChevronRight
        className={`w-5 h-5 text-slate-400 transition-transform ${
          enabled ? 'rotate-90' : ''
        }`}
      />
    </motion.button>
  );
}
