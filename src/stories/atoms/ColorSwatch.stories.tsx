import type { Meta, StoryObj } from '@storybook/react';
import { ColorSwatch } from '@/components/shared/ColorSwatch';
import { SOURCE_COLOR_POOL } from '@/types';

const meta: Meta<typeof ColorSwatch> = {
  title: 'Atoms/ColorSwatch',
  component: ColorSwatch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    colors: { control: 'object' },
    selectedColor: { control: 'color' },
    onSelect: { action: 'selected' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    colors: SOURCE_COLOR_POOL,
    selectedColor: SOURCE_COLOR_POOL[0],
  },
};

export const DifferentSelection: Story = {
  args: {
    colors: SOURCE_COLOR_POOL,
    selectedColor: SOURCE_COLOR_POOL[3],
  },
};

export const CustomColors: Story = {
  args: {
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
    selectedColor: '#00ff00',
  },
};
