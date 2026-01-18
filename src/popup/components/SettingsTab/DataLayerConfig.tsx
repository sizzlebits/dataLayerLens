/**
 * DataLayerConfig - Component for configuring dataLayer names.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Layers, ChevronRight } from 'lucide-react';

export interface DataLayerConfigProps {
  dataLayerNames: string[];
  onAddDataLayer: (name: string) => void;
  onRemoveDataLayer: (name: string) => void;
}

export function DataLayerConfig({
  dataLayerNames,
  onAddDataLayer,
  onRemoveDataLayer,
}: DataLayerConfigProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

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
        DataLayer Names
      </h3>
      <div className="bg-dl-card rounded-lg p-3 border border-dl-border">
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {dataLayerNames.map((name) => (
              <motion.span
                key={name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-dl-primary/20 text-dl-primary rounded-lg text-sm"
              >
                <Layers className="w-3 h-3" />
                {name}
                {name !== 'dataLayer' && (
                  <button
                    onClick={() => onRemoveDataLayer(name)}
                    className="ml-1 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mt-3"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="e.g., dataLayer_v2"
                className="flex-1 bg-dl-card border border-dl-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
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
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-dl-border hover:border-dl-primary text-slate-400 hover:text-dl-primary rounded-lg transition-colors mt-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
