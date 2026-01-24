/**
 * SourceColorsSection - Section for configuring source colors.
 * Wraps SourceColorEditor with a section header.
 */

import { Palette } from 'lucide-react';
import { SourceColorEditor } from '@/components/shared/SourceColorEditor';

export interface SourceColorsSectionProps {
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
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-theme-text-secondary flex items-center gap-2">
        <Palette className="w-4 h-4 text-dl-secondary" />
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
