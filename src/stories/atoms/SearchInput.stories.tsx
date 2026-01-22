import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from '@/components/shared/SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'Atoms/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    onChange: { action: 'changed' },
    placeholder: { control: 'text' },
    autoFocus: { control: 'boolean' },
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
    value: '',
    placeholder: 'Search events...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'page_view',
    placeholder: 'Search events...',
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: '',
    placeholder: 'Filter by event name...',
  },
};

export const AutoFocused: Story = {
  args: {
    value: '',
    placeholder: 'Search...',
    autoFocus: true,
  },
};
