/**
 * ThemeSelector - Component for selecting theme preference
 */

import type { Settings } from '@/types';

export interface ThemeSelectorProps {
  theme: Settings['theme'];
  onThemeChange: (theme: Settings['theme']) => void;
}

export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-theme-text-secondary">Theme</label>
      <div className="flex gap-1.5">
        <button
          onClick={() => onThemeChange('system')}
          className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
            theme === 'system'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
          }`}
        >
          System
        </button>
        <button
          onClick={() => onThemeChange('light')}
          className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
            theme === 'light'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
          }`}
        >
          Light
        </button>
        <button
          onClick={() => onThemeChange('dark')}
          className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
            theme === 'dark'
              ? 'bg-dl-primary/20 border-dl-primary text-dl-primary'
              : 'border-dl-border text-theme-text-secondary hover:text-theme-text'
          }`}
        >
          Dark
        </button>
      </div>
    </div>
  );
}
