/**
 * SettingsTab - Main settings tab component.
 * Contains all settings configuration options.
 */

import { motion } from 'framer-motion';
import type { Settings } from '@/types';
import { DataLayerConfig } from './DataLayerConfig';
import { MaxEventsSlider } from './MaxEventsSlider';
import { DisplaySettings } from './DisplaySettings';
import { GroupingSettings } from './GroupingSettings';
import { BackupRestore } from './BackupRestore';

export interface SettingsTabProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onImportSettings: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importStatus: string | null;
}

export function SettingsTab({
  settings,
  onUpdateSettings,
  onExportSettings,
  onImportSettings,
  importStatus,
}: SettingsTabProps) {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 space-y-4"
    >
      {/* DataLayer Arrays with Colours */}
      <DataLayerConfig
        dataLayerNames={settings.dataLayerNames}
        sourceColors={settings.sourceColors || {}}
        onAddDataLayer={(name) =>
          onUpdateSettings({
            dataLayerNames: [...settings.dataLayerNames, name],
          })
        }
        onRemoveDataLayer={(name) =>
          onUpdateSettings({
            dataLayerNames: settings.dataLayerNames.filter((n) => n !== name),
          })
        }
        onColorChange={(source, color) =>
          onUpdateSettings({
            sourceColors: {
              ...settings.sourceColors,
              [source]: color,
            },
          })
        }
      />

      {/* Max Events */}
      <MaxEventsSlider
        value={settings.maxEvents}
        onChange={(value) => onUpdateSettings({ maxEvents: value })}
      />

      {/* Event Grouping - matches DevTools order (Grouping before Persist) */}
      <GroupingSettings
        grouping={settings.grouping}
        onUpdateGrouping={(grouping) => onUpdateSettings({ grouping })}
      />

      {/* Display Settings */}
      <DisplaySettings
        theme={settings.theme}
        showTimestamps={settings.showTimestamps}
        showEmojis={settings.showEmojis}
        persistEvents={settings.persistEvents}
        consoleLogging={settings.consoleLogging}
        debugLogging={settings.debugLogging}
        compactMode={settings.compactMode}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Backup & Restore */}
      <BackupRestore
        onExport={onExportSettings}
        onImport={onImportSettings}
        importStatus={importStatus}
      />
    </motion.div>
  );
}
