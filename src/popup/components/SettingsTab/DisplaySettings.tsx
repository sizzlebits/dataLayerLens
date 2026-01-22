/**
 * DisplaySettings - Component for display-related settings.
 */

import { LucideIcon, Clock, History, Zap, Settings as SettingsIcon, Minimize2 } from 'lucide-react';
import { Toggle } from '../shared';

interface SettingRowProps {
  icon: LucideIcon;
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
          <span className="text-sm text-white block">{title}</span>
          {description && <span className="text-xs text-slate-500">{description}</span>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export interface DisplaySettingsProps {
  showTimestamps: boolean;
  persistEvents: boolean;
  consoleLogging: boolean;
  debugLogging: boolean;
  compactMode: boolean;
  onUpdateSettings: (settings: Partial<{
    showTimestamps: boolean;
    persistEvents: boolean;
    consoleLogging: boolean;
    debugLogging: boolean;
    compactMode: boolean;
  }>) => void;
}

export function DisplaySettings({
  showTimestamps,
  persistEvents,
  consoleLogging,
  debugLogging,
  compactMode,
  onUpdateSettings,
}: DisplaySettingsProps) {
  return (
    <div className="space-y-3">
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
        icon={Minimize2}
        iconColor="text-dl-primary"
        title="Compact Mode"
        description="Smaller UI in DevTools panel"
        checked={compactMode}
        onChange={(checked) => onUpdateSettings({ compactMode: checked })}
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
        iconColor="text-slate-400"
        title="Debug Logging"
        description="Extension debug info in console"
        checked={debugLogging}
        onChange={(checked) => onUpdateSettings({ debugLogging: checked })}
      />
    </div>
  );
}
