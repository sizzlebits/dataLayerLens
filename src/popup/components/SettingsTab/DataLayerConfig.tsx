/**
 * DataLayerConfig - Component for configuring dataLayer names and their colors.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { SOURCE_COLOR_POOL } from '@/types';
import { ColorSwatch } from '@/components/shared/ColorSwatch';

export interface DataLayerConfigProps {
  dataLayerNames: string[];
  sourceColors: Record<string, string>;
  onAddDataLayer: (name: string) => void;
  onRemoveDataLayer: (name: string) => void;
  onColorChange: (source: string, color: string) => void;
}

export function DataLayerConfig({
  dataLayerNames,
  sourceColors,
  onAddDataLayer,
  onRemoveDataLayer,
  onColorChange,
}: DataLayerConfigProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const handleAdd = () => {
    if (newName.trim() && !dataLayerNames.includes(newName.trim())) {
      onAddDataLayer(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-dl-primary" />
        DataLayer Arrays
      </h3>
      <div className="bg-dl-card rounded-lg border border-dl-border overflow-hidden">
        <div className="space-y-0">
          <AnimatePresence>
            {dataLayerNames.map((name) => {
              const color = sourceColors[name] || SOURCE_COLOR_POOL[0];
              const isExpanded = expandedSource === name;

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-dl-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 p-3 hover:bg-dl-dark/50 transition-colors">
                    <button
                      onClick={() => setExpandedSource(isExpanded ? null : name)}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                      <Layers className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-mono text-white truncate">
                        {name}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-auto"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </button>
                    {name !== 'dataLayer' && (
                      <motion.button
                        onClick={() => onRemoveDataLayer(name)}
                        className="p-1 text-slate-400 hover:text-dl-error hover:bg-dl-error/20 rounded transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-dl-border bg-dl-dark/30">
                          <ColorSwatch
                            colors={SOURCE_COLOR_POOL}
                            selectedColor={color}
                            onSelect={(newColor) => {
                              onColorChange(name, newColor);
                              setExpandedSource(null);
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 border-t border-dl-border"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="e.g., dataLayer_v2"
                className="flex-1 bg-dl-dark border border-dl-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
                autoFocus
              />
              <motion.button
                onClick={handleAdd}
                className="p-2 bg-dl-success/20 hover:bg-dl-success/30 text-dl-success rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
                className="p-2 bg-dl-error/20 hover:bg-dl-error/30 text-dl-error rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-t border-dl-border text-slate-400 hover:text-dl-primary hover:bg-dl-dark/50 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Plus className="w-4 h-4" />
              Add DataLayer
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
