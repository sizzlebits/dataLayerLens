import type { Meta, StoryObj } from '@storybook/react';
import { HighlightsSection } from '@/components/shared/settings/HighlightsSection';

const meta: Meta<typeof HighlightsSection> = {
  title: 'Molecules/HighlightsSection',
  component: HighlightsSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    eventHighlights: { control: 'object' },
    availableEventTypes: { control: 'object' },
    eventTypeCounts: { control: 'object' },
    onAdd: { action: 'add' },
    onRemove: { action: 'remove' },
    onColorChange: { action: 'colorChange' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultAvailableTypes = [
  'page_view',
  'purchase',
  'add_to_cart',
  'gtm.js',
  'gtm.dom',
  'gtm.load',
  'view_item',
];

const defaultCounts = {
  page_view: 15,
  purchase: 3,
  add_to_cart: 7,
  'gtm.js': 1,
  'gtm.dom': 1,
  'gtm.load': 1,
  view_item: 12,
};

export const Default: Story = {
  args: {
    eventHighlights: {},
    availableEventTypes: defaultAvailableTypes,
    eventTypeCounts: defaultCounts,
  },
};

export const WithSingleHighlight: Story = {
  args: {
    eventHighlights: {
      purchase: 'red',
    },
    availableEventTypes: defaultAvailableTypes,
    eventTypeCounts: defaultCounts,
  },
};

export const WithMultipleHighlights: Story = {
  args: {
    eventHighlights: {
      page_view: 'indigo',
      purchase: 'red',
      add_to_cart: 'amber',
    },
    availableEventTypes: defaultAvailableTypes,
    eventTypeCounts: defaultCounts,
  },
};

export const AllColorsShowcase: Story = {
  args: {
    eventHighlights: {
      page_view: 'red',
      purchase: 'amber',
      add_to_cart: 'emerald',
      'gtm.js': 'cyan',
      'gtm.dom': 'indigo',
      'gtm.load': 'pink',
    },
    availableEventTypes: defaultAvailableTypes,
    eventTypeCounts: defaultCounts,
  },
};

export const WithCustomEvent: Story = {
  args: {
    eventHighlights: {
      custom_conversion: 'red',
      page_view: 'indigo',
    },
    availableEventTypes: defaultAvailableTypes,
    eventTypeCounts: {
      ...defaultCounts,
      custom_conversion: 2,
    },
  },
};

export const NoAvailableEvents: Story = {
  args: {
    eventHighlights: {},
    availableEventTypes: [],
    eventTypeCounts: {},
  },
};

export const ZeroCounts: Story = {
  args: {
    eventHighlights: {
      upcoming_event: 'indigo',
      future_purchase: 'red',
    },
    availableEventTypes: ['upcoming_event', 'future_purchase'],
    eventTypeCounts: {},
  },
};
