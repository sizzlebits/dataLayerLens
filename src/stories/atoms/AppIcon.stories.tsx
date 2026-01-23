import type { Meta, StoryObj } from '@storybook/react';
import { AppIcon } from '@/components/shared/AppIcon';

const meta: Meta<typeof AppIcon> = {
  title: 'Atoms/AppIcon',
  component: AppIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Custom DataLayer Lens logo icon used in headers throughout the application.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Tailwind CSS classes for size and color',
      table: {
        defaultValue: { summary: 'w-4 h-4' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppIcon>;

export const Default: Story = {
  args: {
    className: 'w-8 h-8 text-dl-primary',
  },
};

export const Small: Story = {
  args: {
    className: 'w-4 h-4 text-slate-400',
  },
};

export const Large: Story = {
  args: {
    className: 'w-12 h-12 text-white',
  },
};

export const InIndentedBox: Story = {
  render: () => (
    <div
      className="w-16 h-16 rounded-xl flex items-center justify-center p-2"
      style={{
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(255, 255, 255, 0.05)',
      }}
    >
      <AppIcon className="w-12 h-12 text-dl-primary" />
    </div>
  ),
};

export const ColorVariations: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <div className="text-center">
        <AppIcon className="w-10 h-10 text-dl-primary" />
        <p className="text-xs mt-2 text-slate-400">Primary</p>
      </div>
      <div className="text-center">
        <AppIcon className="w-10 h-10 text-dl-secondary" />
        <p className="text-xs mt-2 text-slate-400">Secondary</p>
      </div>
      <div className="text-center">
        <AppIcon className="w-10 h-10 text-white" />
        <p className="text-xs mt-2 text-slate-400">White</p>
      </div>
      <div className="text-center">
        <AppIcon className="w-10 h-10 text-slate-400" />
        <p className="text-xs mt-2 text-slate-400">Muted</p>
      </div>
    </div>
  ),
};
