import type { Meta, StoryObj } from '@storybook/react';
import { EventStats } from '@/popup/components/MonitorTab/EventStats';

const meta: Meta<typeof EventStats> = {
  title: 'Molecules/EventStats',
  component: EventStats,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    eventCount: { control: { type: 'number', min: 0, max: 500 } },
    maxEvents: { control: { type: 'number', min: 10, max: 500 } },
    onClear: { action: 'clear' },
    onExport: { action: 'export' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    eventCount: 0,
    maxEvents: 100,
  },
};

export const PartiallyFilled: Story = {
  args: {
    eventCount: 42,
    maxEvents: 100,
  },
};

export const MostlyFilled: Story = {
  args: {
    eventCount: 85,
    maxEvents: 100,
  },
};

export const AtCapacity: Story = {
  args: {
    eventCount: 100,
    maxEvents: 100,
  },
};

export const LargeCapacity: Story = {
  args: {
    eventCount: 250,
    maxEvents: 500,
  },
};

export const WithoutExport: Story = {
  args: {
    eventCount: 42,
    maxEvents: 100,
    onExport: undefined,
  },
};
