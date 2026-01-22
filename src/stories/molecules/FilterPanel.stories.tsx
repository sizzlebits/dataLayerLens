import type { Meta, StoryObj } from '@storybook/react';
import { FilterPanel } from '@/popup/components/MonitorTab/FilterPanel';

const meta: Meta<typeof FilterPanel> = {
  title: 'Molecules/FilterPanel',
  component: FilterPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    filters: { control: 'object' },
    filterMode: {
      control: 'select',
      options: ['include', 'exclude'],
    },
    onAddFilter: { action: 'addFilter' },
    onRemoveFilter: { action: 'removeFilter' },
    onClearFilters: { action: 'clearFilters' },
    onSetFilterMode: { action: 'setFilterMode' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '350px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    filters: [],
    filterMode: 'exclude',
  },
};

export const WithExcludeFilters: Story = {
  args: {
    filters: ['gtm.js', 'gtm.dom', 'gtm.load'],
    filterMode: 'exclude',
  },
};

export const WithIncludeFilters: Story = {
  args: {
    filters: ['page_view', 'purchase', 'add_to_cart'],
    filterMode: 'include',
  },
};

export const SingleFilter: Story = {
  args: {
    filters: ['page_view'],
    filterMode: 'include',
  },
};

export const ManyFilters: Story = {
  args: {
    filters: [
      'gtm.js',
      'gtm.dom',
      'gtm.load',
      'gtm.click',
      'page_view',
      'view_item',
      'add_to_cart',
    ],
    filterMode: 'exclude',
  },
};
