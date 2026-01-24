/**
 * DomainList - Component for displaying saved domain overrides.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Trash2 } from 'lucide-react';
import type { DomainSettings } from '@/types';

export interface DomainListProps {
  domains: Record<string, DomainSettings>;
  onDeleteDomain: (domain: string) => void;
}

export function DomainList({ domains, onDeleteDomain }: DomainListProps) {
  const domainEntries = Object.entries(domains);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-theme-text-secondary">Saved Domain Overrides</h3>

      {domainEntries.length === 0 ? (
        <div className="text-center py-6 text-theme-text-tertiary text-sm">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No domain overrides saved</p>
          <p className="text-xs mt-1">
            Use the button above to save settings specific to each domain you visit
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {domainEntries.map(([domain, ds]) => (
              <motion.div
                key={domain}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between bg-dl-card rounded-lg px-3 py-2 border border-dl-border group"
              >
                <div>
                  <code className="text-xs text-dl-accent block">{domain}</code>
                  <span className="text-xs text-theme-text-tertiary">
                    Updated {new Date(ds.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <motion.button
                  onClick={() => onDeleteDomain(domain)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-dl-error/20 rounded transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Remove domain settings"
                >
                  <Trash2 className="w-3.5 h-3.5 text-dl-error" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
