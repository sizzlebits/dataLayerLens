import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '@/components/shared/Toast';

const meta: Meta<typeof Toast> = {
  title: 'Atoms/Toast',
  component: Toast,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    type: {
      control: 'select',
      options: ['success', 'error', 'info', 'warning'],
    },
    position: {
      control: 'select',
      options: ['top', 'bottom'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '200px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    message: 'Settings saved successfully!',
    type: 'success',
    position: 'bottom',
  },
};

export const Error: Story = {
  args: {
    message: 'Failed to copy event data',
    type: 'error',
    position: 'bottom',
  },
};

export const Warning: Story = {
  args: {
    message: 'Maximum events limit reached',
    type: 'warning',
    position: 'bottom',
  },
};

export const Info: Story = {
  args: {
    message: 'Events will be cleared on refresh',
    type: 'info',
    position: 'bottom',
  },
};

export const TopPosition: Story = {
  args: {
    message: 'Toast at top position',
    type: 'info',
    position: 'top',
  },
};

export const Hidden: Story = {
  args: {
    message: null,
    type: 'error',
  },
};
