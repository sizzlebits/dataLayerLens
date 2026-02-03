/**
 * DisplaySettings - Component for display-related settings.
 */

import { LucideIcon, Clock, History, Zap, Settings as SettingsIcon, Minimize2 } from 'lucide-react';
import { Toggle } from '../shared';
import { ThemeSelector } from '@/components/shared/settings/ThemeSelector';
import type { Settings } from '@/types';
import type { FC } from 'react';

interface SettingRowProps {
  icon: LucideIcon | FC;
  iconColor: string;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingRow({ icon: Icon, iconColor, title, description, checked, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between bg-dl-card rounded-lg px-4 py-3 border border-dl-border">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <div>
          <span className="text-sm text-theme-text block">{title}</span>
          {description && <span className="text-xs text-theme-text-tertiary">{description}</span>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export interface DisplaySettingsProps {
  theme: Settings['theme'];
  showTimestamps: boolean;
  showEmojis: boolean;
  persistEvents: boolean;
  consoleLogging: boolean;
  debugLogging: boolean;
  compactMode: boolean;
  onUpdateSettings: (settings: Partial<Settings>) => void;
}

export function DisplaySettings({
  theme,
  showTimestamps,
  showEmojis,
  persistEvents,
  consoleLogging,
  debugLogging,
  compactMode,
  onUpdateSettings,
}: DisplaySettingsProps) {
  return (
    <div className="space-y-3">
      {/* Theme Selector */}
      <ThemeSelector
        theme={theme}
        onThemeChange={(theme) => onUpdateSettings({ theme })}
      />

      {/* Order matches DevTools settings drawer */}
      <SettingRow
        icon={Minimize2}
        iconColor="text-dl-primary"
        title="Compact Mode"
        description="Smaller UI in DevTools panel"
        checked={compactMode}
        onChange={(checked) => onUpdateSettings({ compactMode: checked })}
      />

      <SettingRow
        icon={Clock}
        iconColor="text-dl-accent"
        title="Show Timestamps"
        checked={showTimestamps}
        onChange={(checked) => onUpdateSettings({ showTimestamps: checked })}
      />

      <SettingRow
        icon={History}
        iconColor="text-yellow-400"
        title="Persist Events"
        description="Keep events across page refreshes"
        checked={persistEvents}
        onChange={(checked) => onUpdateSettings({ persistEvents: checked })}
      />

      <SettingRow
        icon={() => <span className="text-[14px]">😀</span>}
        iconColor=""
        title="Show Event Emojis"
        checked={showEmojis}
        onChange={(checked) => onUpdateSettings({ showEmojis: checked })}
      />

      <SettingRow
        icon={Zap}
        iconColor="text-dl-accent"
        title="Console Logging"
        description="Log events to browser console"
        checked={consoleLogging}
        onChange={(checked) => onUpdateSettings({ consoleLogging: checked })}
      />

      <SettingRow
        icon={SettingsIcon}
        iconColor="text-theme-text-secondary"
        title="Debug Logging"
        description="Extension debug info in console"
        checked={debugLogging}
        onChange={(checked) => onUpdateSettings({ debugLogging: checked })}
      />
    </div>
  );
}
