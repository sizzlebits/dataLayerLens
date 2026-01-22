/**
 * Popup components index.
 */

// Monitor Tab
export { MonitorTab, EventStats, FilterPanel } from './MonitorTab';
export type { MonitorTabProps, EventStatsProps, FilterPanelProps } from './MonitorTab';

// Settings Tab
export {
  SettingsTab,
  DataLayerConfig,
  MaxEventsSlider,
  DisplaySettings,
  GroupingSettings,
  BackupRestore,
} from './SettingsTab';
export type {
  SettingsTabProps,
  DataLayerConfigProps,
  MaxEventsSliderProps,
  DisplaySettingsProps,
  GroupingSettingsProps,
  BackupRestoreProps,
} from './SettingsTab';

// Domains Tab
export { DomainsTab, CurrentDomain, DomainList } from './DomainsTab';
export type { DomainsTabProps, CurrentDomainProps, DomainListProps } from './DomainsTab';

// Shared
export { Toggle, SearchInput } from './shared';
export type { ToggleProps, SearchInputProps } from './shared';
