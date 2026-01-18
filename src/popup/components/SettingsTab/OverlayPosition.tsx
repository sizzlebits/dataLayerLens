/**
 * OverlayPosition - Component for configuring overlay position.
 */

import { ChevronRight } from 'lucide-react';

export interface OverlayPositionProps {
  anchor: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  };
  onUpdateAnchor: (anchor: { vertical?: 'top' | 'bottom'; horizontal?: 'left' | 'right' }) => void;
}

export function OverlayPosition({ anchor, onUpdateAnchor }: OverlayPositionProps) {
  const currentVertical = anchor?.vertical ?? 'bottom';
  const currentHorizontal = anchor?.horizontal ?? 'right';

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-dl-primary" />
        Overlay Position
      </h3>
      <div className="bg-dl-card rounded-lg p-3 border border-dl-border">
        {/* Vertical position */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => onUpdateAnchor({ vertical: 'top', horizontal: currentHorizontal })}
            className={`py-1.5 text-xs rounded border transition-colors ${
              currentVertical === 'top'
                ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                : 'border-dl-border text-slate-400 hover:text-white'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => onUpdateAnchor({ vertical: 'bottom', horizontal: currentHorizontal })}
            className={`py-1.5 text-xs rounded border transition-colors ${
              currentVertical === 'bottom'
                ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                : 'border-dl-border text-slate-400 hover:text-white'
            }`}
          >
            Bottom
          </button>
        </div>

        {/* Horizontal position */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdateAnchor({ vertical: currentVertical, horizontal: 'left' })}
            className={`py-1.5 text-xs rounded border transition-colors ${
              currentHorizontal === 'left'
                ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                : 'border-dl-border text-slate-400 hover:text-white'
            }`}
          >
            Left
          </button>
          <button
            onClick={() => onUpdateAnchor({ vertical: currentVertical, horizontal: 'right' })}
            className={`py-1.5 text-xs rounded border transition-colors ${
              currentHorizontal === 'right'
                ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
                : 'border-dl-border text-slate-400 hover:text-white'
            }`}
          >
            Right
          </button>
        </div>
      </div>
    </div>
  );
}
