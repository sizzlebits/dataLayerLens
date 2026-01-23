import type { Meta, StoryObj } from '@storybook/react';
import { AppIcon } from '@/components/shared/AppIcon';

const meta: Meta<typeof AppIcon> = {
  title: 'Atoms/AppIcon',
  component: AppIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Custom DataLayer Lens logo icon used in headers throughout the application. Can be used standalone or with an indented container variant.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Predefined size for the icon',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    variant: {
      control: 'select',
      options: ['plain', 'indented'],
      description: 'Visual variant - plain or with indented container',
      table: {
        defaultValue: { summary: 'plain' },
      },
    },
    className: {
      control: 'text',
      description: 'Custom Tailwind CSS classes (overrides size)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppIcon>;

export const Plain: Story = {
  args: {
    size: 'lg',
    variant: 'plain',
  },
};

export const Indented: Story = {
  args: {
    size: 'lg',
    variant: 'indented',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <div className="text-center">
        <AppIcon size="sm" variant="plain" />
        <p className="text-xs mt-2 text-slate-400">Small</p>
      </div>
      <div className="text-center">
        <AppIcon size="md" variant="plain" />
        <p className="text-xs mt-2 text-slate-400">Medium</p>
      </div>
      <div className="text-center">
        <AppIcon size="lg" variant="plain" />
        <p className="text-xs mt-2 text-slate-400">Large</p>
      </div>
      <div className="text-center">
        <AppIcon size="xl" variant="plain" />
        <p className="text-xs mt-2 text-slate-400">X-Large</p>
      </div>
    </div>
  ),
};

export const IndentedSizes: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <div className="text-center">
        <AppIcon size="sm" variant="indented" />
        <p className="text-xs mt-2 text-slate-400">Small</p>
      </div>
      <div className="text-center">
        <AppIcon size="md" variant="indented" />
        <p className="text-xs mt-2 text-slate-400">Medium</p>
      </div>
      <div className="text-center">
        <AppIcon size="lg" variant="indented" />
        <p className="text-xs mt-2 text-slate-400">Large</p>
      </div>
      <div className="text-center">
        <AppIcon size="xl" variant="indented" />
        <p className="text-xs mt-2 text-slate-400">X-Large</p>
      </div>
    </div>
  ),
};

export const CustomColors: Story = {
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
