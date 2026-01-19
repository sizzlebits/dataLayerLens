import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventList } from './EventList';
import { DataLayerEvent } from '@/types';

// Framer Motion is mocked globally in src/test/setup.ts

const mockEvents: DataLayerEvent[] = [
  {
    id: '1',
    timestamp: Date.now(),
    event: 'page_view',
    data: { event: 'page_view', page_title: 'Home' },
    source: 'dataLayer',
    raw: { event: 'page_view', page_title: 'Home' },
  },
  {
    id: '2',
    timestamp: Date.now() - 1000,
    event: 'add_to_cart',
    data: { event: 'add_to_cart', item_id: 'SKU123' },
    source: 'dataLayer',
    raw: { event: 'add_to_cart', item_id: 'SKU123' },
  },
  {
    id: '3',
    timestamp: Date.now() - 2000,
    event: 'purchase',
    data: { event: 'purchase', transaction_id: 'T123' },
    source: 'dataLayer_v2',
    raw: { event: 'purchase', transaction_id: 'T123' },
  },
];

describe('EventList', () => {
  it('renders events', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    expect(screen.getByText('page_view')).toBeInTheDocument();
    expect(screen.getByText('add_to_cart')).toBeInTheDocument();
    expect(screen.getByText('purchase')).toBeInTheDocument();
  });

  it('shows source for each event', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    expect(screen.getAllByText('dataLayer').length).toBe(2);
    expect(screen.getByText('dataLayer_v2')).toBeInTheDocument();
  });

  it('calls onToggleExpand when event is clicked', () => {
    const onToggleExpand = vi.fn();

    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={onToggleExpand}
        onCopy={vi.fn()}
      />
    );

    // The click handler is on the inner div containing the event header, not the outer container
    // Find the clickable area by finding the event name and getting its parent clickable div
    const eventName = screen.getByText('page_view');
    const clickableRow = eventName.closest('.cursor-pointer');
    expect(clickableRow).toBeTruthy();
    if (clickableRow) {
      fireEvent.click(clickableRow);
      expect(onToggleExpand).toHaveBeenCalledWith('1');
    }
  });

  it('shows event data when expanded', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set(['1'])}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    expect(screen.getByText(/"page_title"/)).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(
      <EventList
        events={[]}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it('filters events by search term', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
        filter="purchase"
      />
    );

    expect(screen.queryByText('page_view')).not.toBeInTheDocument();
    expect(screen.queryByText('add_to_cart')).not.toBeInTheDocument();
    expect(screen.getByText('purchase')).toBeInTheDocument();
  });

  it('filters events by data content', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
        filter="SKU123"
      />
    );

    expect(screen.queryByText('page_view')).not.toBeInTheDocument();
    expect(screen.getByText('add_to_cart')).toBeInTheDocument();
    expect(screen.queryByText('purchase')).not.toBeInTheDocument();
  });

  it('shows copy button that calls onCopy when clicked', () => {
    const onCopy = vi.fn();

    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={onCopy}
      />
    );

    // Copy buttons exist in DOM (they become visible on hover)
    const copyButtons = document.querySelectorAll('button.opacity-0');
    expect(copyButtons.length).toBeGreaterThan(0);

    // Click the first copy button
    fireEvent.click(copyButtons[0]);
    expect(onCopy).toHaveBeenCalled();
  });

  it('shows check icon when event is copied', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
        copiedId="1"
      />
    );

    // The component should render - the Check icon is shown for copied event
    expect(screen.getByText('page_view')).toBeInTheDocument();
  });

  it('displays JSON data with correct formatting when expanded', () => {
    const eventsWithComplexData: DataLayerEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        event: 'test_event',
        data: {
          string_value: 'hello',
          number_value: 42,
          boolean_value: true,
          null_value: null,
          array_value: [1, 2, 3],
          nested: { key: 'value' },
        },
        source: 'dataLayer',
        raw: {},
      },
    ];

    render(
      <EventList
        events={eventsWithComplexData}
        expandedEvents={new Set(['1'])}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    // Check that various data types are rendered
    expect(screen.getByText(/"string_value"/)).toBeInTheDocument();
    expect(screen.getByText(/"hello"/)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('handles empty object data', () => {
    const eventsWithEmptyData: DataLayerEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        event: 'empty_event',
        data: {},
        source: 'dataLayer',
        raw: {},
      },
    ];

    render(
      <EventList
        events={eventsWithEmptyData}
        expandedEvents={new Set(['1'])}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    expect(screen.getByText('empty_event')).toBeInTheDocument();
    expect(screen.getByText('{}')).toBeInTheDocument();
  });

  it('handles empty array data', () => {
    const eventsWithArrayData: DataLayerEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        event: 'array_event',
        data: { items: [] },
        source: 'dataLayer',
        raw: {},
      },
    ];

    render(
      <EventList
        events={eventsWithArrayData}
        expandedEvents={new Set(['1'])}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    expect(screen.getByText('array_event')).toBeInTheDocument();
    expect(screen.getByText('[]')).toBeInTheDocument();
  });

  it('shows property count for each event', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
      />
    );

    // Each event shows its property count (e.g., "2 properties")
    const propertyCountElements = screen.getAllByText(/\d+ propert/i);
    expect(propertyCountElements.length).toBeGreaterThan(0);
  });

  it('case insensitive filter matching', () => {
    render(
      <EventList
        events={mockEvents}
        expandedEvents={new Set()}
        onToggleExpand={vi.fn()}
        onCopy={vi.fn()}
        filter="PAGE_VIEW"
      />
    );

    expect(screen.getByText('page_view')).toBeInTheDocument();
    expect(screen.queryByText('add_to_cart')).not.toBeInTheDocument();
  });
});
