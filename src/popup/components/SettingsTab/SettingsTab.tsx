/**
 * SettingsTab - Main settings tab component.
 * Contains all settings configuration options.
 */

import { motion } from 'framer-motion';
import type { Settings } from '@/types';
import { DataLayerConfig } from './DataLayerConfig';
import { MaxEventsSlider } from './MaxEventsSlider';
import { DisplaySettings } from './DisplaySettings';
import { OverlayPosition } from './OverlayPosition';
import { GroupingSettings } from './GroupingSettings';
import { BackupRestore } from './BackupRestore';

export interface SettingsTabProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onImportSettings: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SettingsTab({
  settings,
  onUpdateSettings,
  onExportSettings,
  onImportSettings,
}: SettingsTabProps) {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 space-y-4"
    >
      {/* DataLayer Names */}
      <DataLayerConfig
        dataLayerNames={settings.dataLayerNames}
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
      />

      {/* Max Events */}
      <MaxEventsSlider
        value={settings.maxEvents}
        onChange={(value) => onUpdateSettings({ maxEvents: value })}
      />

      {/* Display Settings */}
      <DisplaySettings
        animationsEnabled={settings.animationsEnabled}
        showTimestamps={settings.showTimestamps}
        persistEvents={settings.persistEvents}
        consoleLogging={settings.consoleLogging}
        debugLogging={settings.debugLogging}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Overlay Position */}
      <OverlayPosition
        anchor={settings.overlayAnchor || { vertical: 'bottom', horizontal: 'right' }}
        onUpdateAnchor={(anchor) => onUpdateSettings({ overlayAnchor: anchor as Settings['overlayAnchor'] })}
      />

      {/* Event Grouping */}
      <GroupingSettings
        grouping={settings.grouping}
        onUpdateGrouping={(grouping) => onUpdateSettings({ grouping })}
      />

      {/* Backup & Restore */}
      <BackupRestore onExport={onExportSettings} onImport={onImportSettings} />
    </motion.div>
  );
}
