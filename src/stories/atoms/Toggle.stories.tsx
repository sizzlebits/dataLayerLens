import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
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
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for the component to render and find the toggle switch
    const toggle = await canvas.findByRole('switch');

    // Verify initial state
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Click the toggle
    await userEvent.click(toggle);

    // Verify the onChange callback was called
    await expect(args.onChange).toHaveBeenCalledWith(true);
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
