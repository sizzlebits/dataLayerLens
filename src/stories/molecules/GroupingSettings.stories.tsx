import type { Meta, StoryObj } from '@storybook/react';
import { GroupingSettings } from '@/components/shared/settings/GroupingSettings';
import { DEFAULT_SETTINGS } from '@/types';

const meta: Meta<typeof GroupingSettings> = {
  title: 'Molecules/GroupingSettings',
  component: GroupingSettings,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    settings: { control: 'object' },
    onUpdateSettings: { action: 'updateSettings' },
    compact: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    settings: DEFAULT_SETTINGS,
    compact: false,
  },
};

export const Compact: Story = {
  args: {
    settings: DEFAULT_SETTINGS,
    compact: true,
  },
};

export const GroupingEnabled: Story = {
  args: {
    settings: {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'time',
        timeWindowMs: 500,
        triggerEvents: [],
      },
    },
    compact: false,
  },
};

export const EventBasedGrouping: Story = {
  args: {
    settings: {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'event',
        timeWindowMs: 500,
        triggerEvents: ['gtm.js', 'page_view', 'add_to_cart'],
      },
    },
    compact: false,
  },
};

export const CompactWithGrouping: Story = {
  args: {
    settings: {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'event',
        timeWindowMs: 500,
        triggerEvents: ['gtm.js', 'page_view'],
      },
    },
    compact: true,
  },
};
