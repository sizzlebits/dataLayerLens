import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SOURCE_COLOR_POOL } from '@/types';
import { ColorSwatch } from './ColorSwatch';

export interface SourceColorEditorProps {
  sources: string[];
  sourceColors: Record<string, string>;
  onColorChange: (source: string, color: string) => void;
}

export function SourceColorEditor({
  sources,
  sourceColors,
  onColorChange,
}: SourceColorEditorProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  if (sources.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-4">
        No dataLayer sources detected yet.
        <br />
        <span className="text-xs">Sources will appear as events are captured.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sources.map((source) => {
        const color = sourceColors[source] || SOURCE_COLOR_POOL[0];
        const isExpanded = expandedSource === source;

        return (
          <div key={source} className="bg-dl-dark rounded-lg border border-dl-border">
            <motion.button
              onClick={() => setExpandedSource(isExpanded ? null : source)}
              className="w-full flex items-center gap-3 p-3 hover:bg-dl-card/50 transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 border border-white/20"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-left text-sm font-mono text-white truncate">
                {source}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-dl-border">
                    <ColorSwatch
                      colors={SOURCE_COLOR_POOL}
                      selectedColor={color}
                      onSelect={(newColor) => {
                        onColorChange(source, newColor);
                        setExpandedSource(null);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
