import type { Meta, StoryObj } from '@storybook/react';
import { SupportLink } from '@/components/shared/SupportLink';

const meta: Meta<typeof SupportLink> = {
  title: 'Atoms/SupportLink',
  component: SupportLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'text-lg',
  },
};
