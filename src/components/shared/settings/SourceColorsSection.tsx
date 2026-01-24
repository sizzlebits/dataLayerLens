/**
 * Source Colors section for Settings Drawer.
 * Allows customizing colors for different dataLayer sources.
 */

import { Palette } from 'lucide-react';
import { SourceColorEditor } from '../SourceColorEditor';

interface SourceColorsSectionProps {
  sources: string[];
  sourceColors: Record<string, string>;
  onColorChange: (source: string, color: string) => void;
}

export function SourceColorsSection({
  sources,
  sourceColors,
  onColorChange,
}: SourceColorsSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-dl-secondary" />
        Source Colors
      </h3>
      <SourceColorEditor
        sources={sources}
        sourceColors={sourceColors}
        onColorChange={onColorChange}
      />
    </div>
  );
}
