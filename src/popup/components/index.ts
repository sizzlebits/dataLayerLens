/**
 * Popup components index.
 */

// Monitor Tab
export { MonitorTab, OverlayToggle, EventStats, FilterPanel } from './MonitorTab';
export type { MonitorTabProps, OverlayToggleProps, EventStatsProps, FilterPanelProps } from './MonitorTab';

// Settings Tab
export {
  SettingsTab,
  DataLayerConfig,
  MaxEventsSlider,
  DisplaySettings,
  OverlayPosition,
  GroupingSettings,
  BackupRestore,
} from './SettingsTab';
export type {
  SettingsTabProps,
  DataLayerConfigProps,
  MaxEventsSliderProps,
  DisplaySettingsProps,
  OverlayPositionProps,
  GroupingSettingsProps,
  BackupRestoreProps,
} from './SettingsTab';

// Domains Tab
export { DomainsTab, CurrentDomain, DomainList } from './DomainsTab';
export type { DomainsTabProps, CurrentDomainProps, DomainListProps } from './DomainsTab';

// Shared
export { Toggle, SearchInput } from './shared';
export type { ToggleProps, SearchInputProps } from './shared';
