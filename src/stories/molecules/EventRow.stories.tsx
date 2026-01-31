import type { Meta, StoryObj } from '@storybook/react';
import { EventRow } from '@/components/shared/EventRow';
import type { DataLayerEvent } from '@/types';

const mockEvent: DataLayerEvent = {
  id: 'event-1',
  timestamp: Date.now(),
  event: 'page_view',
  data: {
    page_title: 'Home Page',
    page_location: 'https://example.com/',
    page_referrer: 'https://google.com/',
  },
  source: 'dataLayer',
  raw: {},
  dataLayerIndex: 0,
};

const mockGTMEvent: DataLayerEvent = {
  id: 'event-2',
  timestamp: Date.now(),
  event: 'gtm.js',
  data: {
    'gtm.start': 1234567890,
  },
  source: 'dataLayer',
  raw: {},
  dataLayerIndex: 1,
};

const mockPurchaseEvent: DataLayerEvent = {
  id: 'event-3',
  timestamp: Date.now(),
  event: 'purchase',
  data: {
    transaction_id: 'T12345',
    value: 99.99,
    currency: 'USD',
    items: [
      { item_id: 'SKU001', item_name: 'Product 1', price: 49.99, quantity: 2 },
    ],
  },
  source: 'dataLayer',
  raw: {},
  dataLayerIndex: 2,
};

const mockPersistedEvent: DataLayerEvent = {
  id: 'event-4',
  timestamp: Date.now() - 60000,
  event: 'page_view',
  data: {
    page_title: 'Previous Page',
  },
  source: 'dataLayer (persisted)',
  raw: {},
  dataLayerIndex: 0,
};

const meta: Meta<typeof EventRow> = {
  title: 'Molecules/EventRow',
  component: EventRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    event: { control: 'object' },
    isExpanded: { control: 'boolean' },
    isCopied: { control: 'boolean' },
    isNew: { control: 'boolean' },
    showFilterMenu: { control: 'boolean' },
    compact: { control: 'boolean' },
    showTimestamps: { control: 'boolean' },
    showEmojis: { control: 'boolean' },
    sourceColor: { control: 'color' },
    highlightColor: { control: 'color' },
    onToggle: { action: 'toggle' },
    onCopy: { action: 'copy' },
    onAddFilterInclude: { action: 'addFilterInclude' },
    onAddFilterExclude: { action: 'addFilterExclude' },
    onToggleFilterMenu: { action: 'toggleFilterMenu' },
    onToggleHighlight: { action: 'toggleHighlight' },
  },
  decorators: [
    (Story) => (
      <div className="bg-dl-darker rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#6366f1',
  },
};

export const Expanded: Story = {
  args: {
    event: mockEvent,
    isExpanded: true,
    showTimestamps: true,
    sourceColor: '#6366f1',
  },
};

export const GTMEvent: Story = {
  args: {
    event: mockGTMEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#22d3ee',
  },
};

export const PurchaseEvent: Story = {
  args: {
    event: mockPurchaseEvent,
    isExpanded: true,
    showTimestamps: true,
    sourceColor: '#10b981',
  },
};

export const NewEvent: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    isNew: true,
    showTimestamps: true,
    sourceColor: '#6366f1',
  },
};

export const Copied: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    isCopied: true,
    showTimestamps: true,
    sourceColor: '#6366f1',
  },
};

export const CompactMode: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    compact: true,
    showTimestamps: true,
    sourceColor: '#6366f1',
  },
};

export const WithoutTimestamps: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    showTimestamps: false,
    sourceColor: '#6366f1',
  },
};

export const PersistedEvent: Story = {
  args: {
    event: mockPersistedEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#f59e0b',
  },
};

export const WithFilterMenu: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    showFilterMenu: true,
    showTimestamps: true,
    sourceColor: '#6366f1',
  },
};

export const WithoutEmojis: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    showTimestamps: true,
    showEmojis: false,
    sourceColor: '#6366f1',
  },
};

export const EmojiComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 className="text-theme-text mb-2 text-sm font-semibold">
          With Emojis (Default)
        </h3>
        <div className="bg-dl-darker rounded-lg">
          <EventRow
            event={mockGTMEvent}
            isExpanded={false}
            showTimestamps={true}
            showEmojis={true}
            sourceColor="#22d3ee"
            onToggle={() => {}}
          />
          <EventRow
            event={mockEvent}
            isExpanded={false}
            showTimestamps={true}
            showEmojis={true}
            sourceColor="#6366f1"
            onToggle={() => {}}
          />
          <EventRow
            event={mockPurchaseEvent}
            isExpanded={false}
            showTimestamps={true}
            showEmojis={true}
            sourceColor="#10b981"
            onToggle={() => {}}
          />
        </div>
      </div>
      <div>
        <h3 className="text-theme-text mb-2 text-sm font-semibold">
          Without Emojis
        </h3>
        <div className="bg-dl-darker rounded-lg">
          <EventRow
            event={mockGTMEvent}
            isExpanded={false}
            showTimestamps={true}
            showEmojis={false}
            sourceColor="#22d3ee"
            onToggle={() => {}}
          />
          <EventRow
            event={mockEvent}
            isExpanded={false}
            showTimestamps={true}
            showEmojis={false}
            sourceColor="#6366f1"
            onToggle={() => {}}
          />
          <EventRow
            event={mockPurchaseEvent}
            isExpanded={false}
            showTimestamps={true}
            showEmojis={false}
            sourceColor="#10b981"
            onToggle={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

export const WithHighlightBar: Story = {
  args: {
    event: mockEvent,
    isExpanded: false,
    showTimestamps: true,
    sourceColor: '#6366f1',
    highlightColor: 'red',
  },
};

export const HighlightBarExpanded: Story = {
  args: {
    event: mockPurchaseEvent,
    isExpanded: true,
    showTimestamps: true,
    sourceColor: '#10b981',
    highlightColor: 'amber',
  },
};

export const HighlightComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 className="text-theme-text mb-2 text-sm font-semibold">
          Without Highlights (neutral text, hover to see sparkle toggle)
        </h3>
        <div className="bg-dl-darker rounded-lg">
          <EventRow
            event={mockGTMEvent}
            isExpanded={false}
            showTimestamps={true}
            sourceColor="#22d3ee"
            onToggle={() => {}}
            onToggleHighlight={() => {}}
          />
          <EventRow
            event={mockEvent}
            isExpanded={false}
            showTimestamps={true}
            sourceColor="#6366f1"
            onToggle={() => {}}
            onToggleHighlight={() => {}}
          />
          <EventRow
            event={mockPurchaseEvent}
            isExpanded={false}
            showTimestamps={true}
            sourceColor="#10b981"
            onToggle={() => {}}
            onToggleHighlight={() => {}}
          />
        </div>
      </div>
      <div>
        <h3 className="text-theme-text mb-2 text-sm font-semibold">
          With Highlights (colored bar + text, active sparkle button)
        </h3>
        <div className="bg-dl-darker rounded-lg">
          <EventRow
            event={mockGTMEvent}
            isExpanded={false}
            showTimestamps={true}
            sourceColor="#22d3ee"
            highlightColor="red"
            onToggle={() => {}}
            onToggleHighlight={() => {}}
          />
          <EventRow
            event={mockEvent}
            isExpanded={false}
            showTimestamps={true}
            sourceColor="#6366f1"
            highlightColor="amber"
            onToggle={() => {}}
            onToggleHighlight={() => {}}
          />
          <EventRow
            event={mockPurchaseEvent}
            isExpanded={false}
            showTimestamps={true}
            sourceColor="#10b981"
            highlightColor="indigo"
            onToggle={() => {}}
            onToggleHighlight={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};
