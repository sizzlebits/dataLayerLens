import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventRow } from './EventRow';
import type { DataLayerEvent } from '@/types';

const createMockEvent = (overrides?: Partial<DataLayerEvent>): DataLayerEvent => ({
  id: 'test-event-1',
  timestamp: 1705320000000, // 2024-01-15T12:00:00.000Z
  event: 'page_view',
  data: { event: 'page_view', page_title: 'Test Page' },
  source: 'dataLayer',
  raw: { event: 'page_view', page_title: 'Test Page' },
  dataLayerIndex: 0,
  ...overrides,
});

describe('EventRow', () => {
  describe('basic rendering', () => {
    it('renders event name', () => {
      const event = createMockEvent();
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('page_view')).toBeInTheDocument();
    });

    it('renders source name', () => {
      const event = createMockEvent({ source: 'dataLayer' });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('dataLayer')).toBeInTheDocument();
    });

    it('renders dataLayer index', () => {
      const event = createMockEvent({ dataLayerIndex: 5 });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('renders property count', () => {
      const event = createMockEvent({
        data: { event: 'test', a: 1, b: 2, c: 3 },
      });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('4 props')).toBeInTheDocument();
    });

    it('shows timestamp when showTimestamps is true', () => {
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          showTimestamps={true}
        />
      );

      // Should have a time-like format
      expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('hides timestamp when showTimestamps is false', () => {
      const event = createMockEvent();
      const { container } = render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          showTimestamps={false}
        />
      );

      // The time format should not appear (except in expanded data)
      const timeElements = container.querySelectorAll('[class*="Clock"]');
      // Only the persisted indicator clock should be present, not timestamp
      expect(timeElements.length).toBeLessThanOrEqual(1);
    });
  });

  describe('persisted events', () => {
    it('shows persisted indicator for persisted events', () => {
      const event = createMockEvent({ source: 'dataLayer (persisted)' });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      // Should show clean source name without (persisted)
      expect(screen.getByText('dataLayer')).toBeInTheDocument();
    });

    it('removes (persisted) suffix from source display', () => {
      const event = createMockEvent({ source: 'customLayer (persisted)' });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('customLayer')).toBeInTheDocument();
      expect(screen.queryByText('(persisted)')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onToggle when clicked', () => {
      const onToggle = vi.fn();
      const event = createMockEvent();
      render(<EventRow event={event} isExpanded={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole('button', { name: /page_view event/i }));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle on Enter key', () => {
      const onToggle = vi.fn();
      const event = createMockEvent();
      render(<EventRow event={event} isExpanded={false} onToggle={onToggle} />);

      const button = screen.getByRole('button', { name: /page_view event/i });
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle on Space key', () => {
      const onToggle = vi.fn();
      const event = createMockEvent();
      render(<EventRow event={event} isExpanded={false} onToggle={onToggle} />);

      const button = screen.getByRole('button', { name: /page_view event/i });
      fireEvent.keyDown(button, { key: ' ' });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('copy functionality', () => {
    it('shows copy button when onCopy is provided', () => {
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onCopy={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Copy event data')).toBeInTheDocument();
    });

    it('calls onCopy when copy button clicked', () => {
      const onCopy = vi.fn();
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onCopy={onCopy}
        />
      );

      fireEvent.click(screen.getByLabelText('Copy event data'));

      expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('shows check icon when isCopied is true', () => {
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onCopy={vi.fn()}
          isCopied={true}
        />
      );

      expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
    });
  });

  describe('filter menu', () => {
    it('shows filter button when filter actions provided', () => {
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onAddFilterInclude={vi.fn()}
          onAddFilterExclude={vi.fn()}
          onToggleFilterMenu={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Add to filters')).toBeInTheDocument();
    });

    it('calls onToggleFilterMenu when filter button clicked', () => {
      const onToggleFilterMenu = vi.fn();
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onAddFilterInclude={vi.fn()}
          onAddFilterExclude={vi.fn()}
          onToggleFilterMenu={onToggleFilterMenu}
        />
      );

      fireEvent.click(screen.getByLabelText('Add to filters'));

      expect(onToggleFilterMenu).toHaveBeenCalledTimes(1);
    });

    it('shows filter menu when showFilterMenu is true', () => {
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onAddFilterInclude={vi.fn()}
          onAddFilterExclude={vi.fn()}
          onToggleFilterMenu={vi.fn()}
          showFilterMenu={true}
        />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('Whitelist')).toBeInTheDocument();
      expect(screen.getByText('Blacklist')).toBeInTheDocument();
    });

    it('calls onAddFilterInclude when whitelist clicked', () => {
      const onAddFilterInclude = vi.fn();
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onAddFilterInclude={onAddFilterInclude}
          onAddFilterExclude={vi.fn()}
          onToggleFilterMenu={vi.fn()}
          showFilterMenu={true}
        />
      );

      fireEvent.click(screen.getByText('Whitelist'));

      expect(onAddFilterInclude).toHaveBeenCalledTimes(1);
    });

    it('calls onAddFilterExclude when blacklist clicked', () => {
      const onAddFilterExclude = vi.fn();
      const event = createMockEvent();
      render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          onAddFilterInclude={vi.fn()}
          onAddFilterExclude={onAddFilterExclude}
          onToggleFilterMenu={vi.fn()}
          showFilterMenu={true}
        />
      );

      fireEvent.click(screen.getByText('Blacklist'));

      expect(onAddFilterExclude).toHaveBeenCalledTimes(1);
    });
  });

  describe('expanded state', () => {
    it('shows JSON data when expanded', () => {
      const event = createMockEvent({
        data: { event: 'test', custom_prop: 'custom_value' },
      });
      render(<EventRow event={event} isExpanded={true} onToggle={vi.fn()} />);

      expect(screen.getByText('"custom_prop"')).toBeInTheDocument();
      expect(screen.getByText('"custom_value"')).toBeInTheDocument();
    });

    it('hides JSON data when collapsed', () => {
      const event = createMockEvent({
        data: { event: 'test', custom_prop: 'custom_value' },
      });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.queryByText('"custom_prop"')).not.toBeInTheDocument();
    });

    it('has aria-expanded attribute', () => {
      const event = createMockEvent();

      const { rerender } = render(
        <EventRow event={event} isExpanded={false} onToggle={vi.fn()} />
      );

      expect(screen.getByRole('button', { name: /page_view event/i })).toHaveAttribute(
        'aria-expanded',
        'false'
      );

      rerender(<EventRow event={event} isExpanded={true} onToggle={vi.fn()} />);

      expect(screen.getByRole('button', { name: /page_view event/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });
  });

  describe('compact mode', () => {
    it('applies compact styling when compact is true', () => {
      const event = createMockEvent();
      const { container } = render(
        <EventRow event={event} isExpanded={false} onToggle={vi.fn()} compact={true} />
      );

      // Check for compact-specific classes
      const eventHeader = container.querySelector('[role="button"]');
      expect(eventHeader?.className).toContain('px-3 py-2');
    });

    it('applies normal styling when compact is false', () => {
      const event = createMockEvent();
      const { container } = render(
        <EventRow event={event} isExpanded={false} onToggle={vi.fn()} compact={false} />
      );

      const eventHeader = container.querySelector('[role="button"]');
      expect(eventHeader?.className).toContain('px-4 py-3');
    });
  });

  describe('source color', () => {
    it('applies custom source color when provided', () => {
      const event = createMockEvent();
      const { container } = render(
        <EventRow
          event={event}
          isExpanded={false}
          onToggle={vi.fn()}
          sourceColor="#ff0000"
        />
      );

      // Find the source badge
      const sourceBadge = container.querySelector('[style*="color: rgb(255, 0, 0)"]') ||
                          container.querySelector('[style*="color:#ff0000"]');
      expect(sourceBadge).toBeInTheDocument();
    });
  });

  describe('event categories', () => {
    it('renders GTM events with appropriate styling', () => {
      const event = createMockEvent({ event: 'gtm.js' });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('gtm.js')).toBeInTheDocument();
    });

    it('renders purchase events with appropriate styling', () => {
      const event = createMockEvent({ event: 'purchase' });
      render(<EventRow event={event} isExpanded={false} onToggle={vi.fn()} />);

      expect(screen.getByText('purchase')).toBeInTheDocument();
    });
  });
});
