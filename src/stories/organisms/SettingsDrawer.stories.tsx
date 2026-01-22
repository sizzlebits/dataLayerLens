import type { Meta, StoryObj } from '@storybook/react';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { DEFAULT_SETTINGS } from '@/types';

const meta: Meta<typeof SettingsDrawer> = {
  title: 'Organisms/SettingsDrawer',
  component: SettingsDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    onClose: { action: 'close' },
    settings: { control: 'object' },
    onUpdateSettings: { action: 'updateSettings' },
    activeTabId: { control: 'number' },
    eventCount: { control: 'number' },
    onExport: { action: 'export' },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    settings: DEFAULT_SETTINGS,
    activeTabId: 1,
    eventCount: 42,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    settings: DEFAULT_SETTINGS,
    activeTabId: 1,
    eventCount: 42,
  },
};

export const WithManyEvents: Story = {
  args: {
    isOpen: true,
    settings: DEFAULT_SETTINGS,
    activeTabId: 1,
    eventCount: 250,
  },
};

export const WithCustomSettings: Story = {
  args: {
    isOpen: true,
    settings: {
      ...DEFAULT_SETTINGS,
      dataLayerNames: ['dataLayer', 'customLayer', 'analyticsLayer'],
      compactMode: true,
      showTimestamps: false,
      persistEvents: true,
      maxEvents: 200,
    },
    activeTabId: 1,
    eventCount: 85,
  },
};

export const WithGroupingEnabled: Story = {
  args: {
    isOpen: true,
    settings: {
      ...DEFAULT_SETTINGS,
      grouping: {
        ...DEFAULT_SETTINGS.grouping,
        enabled: true,
        mode: 'event',
      },
    },
    activeTabId: 1,
    eventCount: 120,
  },
};

export const WithoutExport: Story = {
  args: {
    isOpen: true,
    settings: DEFAULT_SETTINGS,
    activeTabId: 1,
    eventCount: 42,
    onExport: undefined,
  },
};
