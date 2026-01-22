import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from '@/components/shared/Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Atoms/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    onChange: { action: 'changed' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    label: 'Toggle setting',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Toggle setting',
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: 'Disabled toggle',
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled checked toggle',
  },
};
