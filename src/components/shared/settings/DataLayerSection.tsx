/**
 * DataLayer Names section for Settings Drawer.
 * Allows managing which dataLayer arrays to monitor.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Check, X } from 'lucide-react';
import { SOURCE_COLOR_POOL, getSourceColor } from '@/types';

interface DataLayerSectionProps {
  dataLayerNames: string[];
  sourceColors: Record<string, string>;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onColorChange: (source: string, color: string) => void;
}

export function DataLayerSection({
  dataLayerNames,
  sourceColors,
  onAdd,
  onRemove,
  onColorChange,
}: DataLayerSectionProps) {
  const [newLayerName, setNewLayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedColorPicker, setExpandedColorPicker] = useState<string | null>(null);

  const handleAdd = () => {
    if (newLayerName && !dataLayerNames.includes(newLayerName)) {
      onAdd(newLayerName);
      setNewLayerName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-dl-primary" />
        DataLayer Arrays
      </h3>
      <div className="space-y-1.5">
        {dataLayerNames.map((name) => {
          const color = getSourceColor(name, sourceColors);
          const isExpanded = expandedColorPicker === name;

          return (
            <div key={name} className="space-y-1">
              <div className="flex items-center justify-between bg-dl-card rounded px-3 py-2 border border-dl-border group">
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setExpandedColorPicker(isExpanded ? null : name)}
                    className="w-4 h-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors"
                    style={{ backgroundColor: color }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Change color"
                  />
                  <code className="text-xs text-dl-accent">{name}</code>
                </div>
                <motion.button
                  onClick={() => onRemove(name)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dl-error/20 rounded transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={dataLayerNames.length <= 1}
                >
                  <X className="w-3 h-3 text-dl-error" />
                </motion.button>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 p-2 bg-dl-dark rounded border border-dl-border">
                      {SOURCE_COLOR_POOL.map((poolColor) => (
                        <motion.button
                          key={poolColor}
                          onClick={() => {
                            onColorChange(name, poolColor);
                            setExpandedColorPicker(null);
                          }}
                          className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            color === poolColor ? 'border-white' : 'border-transparent hover:border-white/40'
                          }`}
                          style={{ backgroundColor: poolColor }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {isAdding ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g., dataLayer_v2"
              className="flex-1 bg-dl-card border border-dl-border rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
              autoFocus
            />
            <motion.button
              onClick={handleAdd}
              className="p-1.5 bg-dl-success/20 hover:bg-dl-success/30 text-dl-success rounded"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Check className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              onClick={() => {
                setIsAdding(false);
                setNewLayerName('');
              }}
              className="p-1.5 bg-dl-error/20 hover:bg-dl-error/30 text-dl-error rounded"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-dl-border hover:border-dl-primary text-slate-400 hover:text-dl-primary rounded text-xs transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add DataLayer
          </motion.button>
        )}
      </div>
    </div>
  );
}
