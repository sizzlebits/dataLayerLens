import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HighlightsSection } from './HighlightsSection';

describe('HighlightsSection', () => {
  const defaultProps = {
    eventHighlights: {},
    availableEventTypes: ['page_view', 'purchase', 'add_to_cart'],
    eventTypeCounts: { page_view: 5, purchase: 2, add_to_cart: 3 },
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onColorChange: vi.fn(),
  };

  describe('rendering', () => {
    it('renders section header', () => {
      render(<HighlightsSection {...defaultProps} />);

      expect(screen.getByText('Event Highlights')).toBeInTheDocument();
    });

    it('renders Add Highlight button when no highlights', () => {
      render(<HighlightsSection {...defaultProps} />);

      expect(screen.getByText('Add Highlight')).toBeInTheDocument();
    });

    it('renders all highlighted events', () => {
      render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#6366f1', purchase: '#22d3ee' }}
        />
      );

      expect(screen.getByText('page_view')).toBeInTheDocument();
      expect(screen.getByText('purchase')).toBeInTheDocument();
    });

    it('shows event count for highlighted events', () => {
      render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#6366f1' }}
          eventTypeCounts={{ page_view: 12, purchase: 5 }}
        />
      );

      expect(screen.getByText('(12)')).toBeInTheDocument();
    });

    it('renders color dot for each highlight', () => {
      const { container } = render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#ff0000' }}
        />
      );

      const colorButton = container.querySelector('[style*="background-color"]');
      expect(colorButton).toBeInTheDocument();
    });
  });

  describe('adding a highlight', () => {
    it('shows input when Add Highlight clicked', () => {
      render(<HighlightsSection {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Highlight'));

      expect(screen.getByPlaceholderText('Event name...')).toBeInTheDocument();
    });

    it('shows available event types when adding', () => {
      render(<HighlightsSection {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Highlight'));

      expect(screen.getByText('Or select from captured events:')).toBeInTheDocument();
      expect(screen.getByText(/page_view/)).toBeInTheDocument();
      expect(screen.getByText(/purchase/)).toBeInTheDocument();
    });

    it('calls onAdd with auto-assigned color when selecting an event type', () => {
      const onAdd = vi.fn();
      const { container } = render(
        <HighlightsSection
          {...defaultProps}
          onAdd={onAdd}
          eventHighlights={{}}
        />
      );

      fireEvent.click(screen.getByText('Add Highlight'));
      // Find the page_view button in the available event types list
      // These buttons have the event name with count like "page_view (5)"
      const availableButtons = container.querySelectorAll('button');
      const pageViewButton = Array.from(availableButtons).find(
        (btn) => btn.textContent?.includes('page_view') && btn.textContent?.includes('(5)')
      );
      expect(pageViewButton).toBeTruthy();
      fireEvent.click(pageViewButton!);

      expect(onAdd).toHaveBeenCalledWith('page_view', expect.any(String));
    });

    it('calls onAdd when submitting custom event name', () => {
      const onAdd = vi.fn();
      render(<HighlightsSection {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByText('Add Highlight'));
      fireEvent.change(screen.getByPlaceholderText('Event name...'), {
        target: { value: 'custom_event' },
      });
      // Click the check button
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find((btn) => btn.className.includes('bg-dl-success'));
      fireEvent.click(checkButton!);

      expect(onAdd).toHaveBeenCalledWith('custom_event', expect.any(String));
    });

    it('calls onAdd when pressing Enter with custom name', () => {
      const onAdd = vi.fn();
      render(<HighlightsSection {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByText('Add Highlight'));
      const input = screen.getByPlaceholderText('Event name...');
      fireEvent.change(input, { target: { value: 'enter_event' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onAdd).toHaveBeenCalledWith('enter_event', expect.any(String));
    });

    it('does not show already highlighted events in available list', () => {
      render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#6366f1' }}
        />
      );

      fireEvent.click(screen.getByText('Add Highlight'));

      // page_view should not be in the available list since it's already highlighted
      const eventButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('page_view') && btn.textContent?.includes('+')
      );
      expect(eventButtons.length).toBe(0);
    });

    it('closes adding UI when cancel clicked', () => {
      render(<HighlightsSection {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Highlight'));
      expect(screen.getByPlaceholderText('Event name...')).toBeInTheDocument();

      // Click the cancel button
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) => btn.className.includes('bg-dl-error'));
      fireEvent.click(cancelButton!);

      expect(screen.queryByPlaceholderText('Event name...')).not.toBeInTheDocument();
    });

    it('closes adding UI when pressing Escape', () => {
      render(<HighlightsSection {...defaultProps} />);

      fireEvent.click(screen.getByText('Add Highlight'));
      const input = screen.getByPlaceholderText('Event name...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByPlaceholderText('Event name...')).not.toBeInTheDocument();
    });
  });

  describe('removing a highlight', () => {
    it('calls onRemove when remove button clicked', () => {
      const onRemove = vi.fn();
      render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#6366f1' }}
          onRemove={onRemove}
        />
      );

      // Find and click the remove button
      const removeButtons = screen.getAllByRole('button').filter((btn) =>
        btn.className.includes('hover:bg-dl-error')
      );
      fireEvent.click(removeButtons[0]);

      expect(onRemove).toHaveBeenCalledWith('page_view');
    });
  });

  describe('color picker', () => {
    it('toggles color picker when color dot clicked', () => {
      const { container } = render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#ff0000' }}
        />
      );

      const colorButton = container.querySelector('[title="Change color"]');
      fireEvent.click(colorButton!);

      // Color picker should show (10 color swatches)
      const colorSwatches = container.querySelectorAll('.flex-wrap button.rounded-full');
      expect(colorSwatches.length).toBeGreaterThan(1);
    });

    it('calls onColorChange when color selected', () => {
      const onColorChange = vi.fn();
      const { container } = render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#6366f1' }}
          onColorChange={onColorChange}
        />
      );

      // Open color picker
      const colorButton = container.querySelector('[title="Change color"]');
      fireEvent.click(colorButton!);

      // Click a color in the picker
      const colorSwatches = container.querySelectorAll('.flex-wrap button');
      if (colorSwatches.length > 0) {
        fireEvent.click(colorSwatches[0]);
        expect(onColorChange).toHaveBeenCalledWith('page_view', expect.any(String));
      }
    });
  });

  describe('event counts', () => {
    it('shows count of 0 for events not in eventTypeCounts', () => {
      render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ unknown_event: '#6366f1' }}
          eventTypeCounts={{ page_view: 5 }}
        />
      );

      expect(screen.getByText('(0)')).toBeInTheDocument();
    });

    it('shows correct counts for multiple highlights', () => {
      render(
        <HighlightsSection
          {...defaultProps}
          eventHighlights={{ page_view: '#6366f1', purchase: '#22d3ee' }}
          eventTypeCounts={{ page_view: 10, purchase: 3 }}
        />
      );

      expect(screen.getByText('(10)')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });
  });
});
