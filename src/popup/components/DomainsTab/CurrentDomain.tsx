/**
 * CurrentDomain - Component for displaying and managing current domain settings.
 */

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export interface CurrentDomainProps {
  domain: string;
  hasCustomSettings: boolean;
  onSaveSettings: () => void;
}

export function CurrentDomain({ domain, hasCustomSettings, onSaveSettings }: CurrentDomainProps) {
  if (!domain) {
    return null;
  }

  return (
    <div className="bg-dl-card rounded-lg p-3 border border-dl-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-dl-primary" />
          <span className="text-sm font-medium text-theme-text">Current Site</span>
        </div>
        {hasCustomSettings && (
          <span className="text-xs text-dl-success bg-dl-success/10 px-2 py-0.5 rounded">
            Custom
          </span>
        )}
      </div>
      <code className="text-xs text-dl-accent block mb-2">{domain}</code>
      {!hasCustomSettings && (
        <motion.button
          onClick={onSaveSettings}
          className="w-full text-xs py-1.5 px-3 bg-dl-primary/20 hover:bg-dl-primary/30 text-dl-primary border border-dl-primary/30 rounded transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          Save current settings for this domain
        </motion.button>
      )}
    </div>
  );
}
