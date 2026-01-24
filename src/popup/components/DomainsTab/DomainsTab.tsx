/**
 * DomainsTab - Main domains tab component.
 * Shows current domain and saved domain overrides.
 */

import { motion } from 'framer-motion';
import type { DomainSettings } from '@/types';
import { CurrentDomain } from './CurrentDomain';
import { DomainList } from './DomainList';

export interface DomainsTabProps {
  currentDomain: string;
  domainSettings: Record<string, DomainSettings>;
  onSaveCurrentDomain: () => void;
  onDeleteDomain: (domain: string) => void;
}

export function DomainsTab({
  currentDomain,
  domainSettings,
  onSaveCurrentDomain,
  onDeleteDomain,
}: DomainsTabProps) {
  return (
    <motion.div
      key="domains"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 space-y-4 max-h-80 overflow-y-auto"
    >
      {/* Current Domain Info */}
      <CurrentDomain
        domain={currentDomain}
        hasCustomSettings={!!domainSettings[currentDomain]}
        onSaveSettings={onSaveCurrentDomain}
      />

      {/* Domain Settings List */}
      <DomainList domains={domainSettings} onDeleteDomain={onDeleteDomain} />

      {/* Info */}
      <div className="text-xs text-theme-text-tertiary text-center pt-2 border-t border-dl-border">
        <p>Domain settings override global settings when you visit that site</p>
      </div>
    </motion.div>
  );
}
