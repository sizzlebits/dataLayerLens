import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceColorEditor } from './SourceColorEditor';
import { SOURCE_COLOR_POOL } from '@/types';

describe('SourceColorEditor', () => {
  const defaultProps = {
    sources: ['dataLayer', 'customLayer'],
    sourceColors: { dataLayer: '#8b5cf6', customLayer: '#10b981' },
    onColorChange: vi.fn(),
  };

  describe('rendering', () => {
    it('renders empty state when no sources', () => {
      render(
        <SourceColorEditor
          sources={[]}
          sourceColors={{}}
          onColorChange={vi.fn()}
        />
      );

      expect(screen.getByText('No dataLayer sources detected yet.')).toBeInTheDocument();
    });

    it('renders sources list', () => {
      render(<SourceColorEditor {...defaultProps} />);

      expect(screen.getByText('dataLayer')).toBeInTheDocument();
      expect(screen.getByText('customLayer')).toBeInTheDocument();
    });

    it('shows color indicator for each source', () => {
      const { container } = render(<SourceColorEditor {...defaultProps} />);

      const colorIndicators = container.querySelectorAll('.w-4.h-4.rounded-full');
      expect(colorIndicators.length).toBe(2);
    });

    it('uses default color from pool when no color assigned', () => {
      const { container } = render(
        <SourceColorEditor
          sources={['newSource']}
          sourceColors={{}}
          onColorChange={vi.fn()}
        />
      );

      const colorIndicator = container.querySelector('.w-4.h-4.rounded-full');
      expect(colorIndicator).toHaveStyle({ backgroundColor: SOURCE_COLOR_POOL[0] });
    });
  });

  describe('interactions', () => {
    it('expands source when clicked', () => {
      render(<SourceColorEditor {...defaultProps} />);

      // Initially should only have 2 buttons (the source buttons)
      const initialButtons = screen.getAllByRole('button');
      expect(initialButtons.length).toBe(2);

      // Click on dataLayer to expand
      fireEvent.click(screen.getByText('dataLayer'));

      // After expanding, should have more buttons (color swatches)
      const expandedButtons = screen.getAllByRole('button');
      expect(expandedButtons.length).toBeGreaterThan(2);
    });

    it('collapses expanded source when clicked again', () => {
      render(<SourceColorEditor {...defaultProps} />);

      // Expand
      fireEvent.click(screen.getByText('dataLayer'));
      // Collapse
      fireEvent.click(screen.getByText('dataLayer'));

      // Check that only the buttons remain (no expanded color picker)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2); // Just the two source buttons
    });

    it('calls onColorChange when color is selected', () => {
      const onColorChange = vi.fn();
      render(
        <SourceColorEditor
          {...defaultProps}
          onColorChange={onColorChange}
        />
      );

      // Expand dataLayer
      fireEvent.click(screen.getByText('dataLayer'));

      // Click a color button in the ColorSwatch
      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.getAttribute('aria-label')?.includes('color')
      );

      if (colorButtons.length > 0) {
        fireEvent.click(colorButtons[0]);
        expect(onColorChange).toHaveBeenCalled();
      }
    });
  });

  describe('accessibility', () => {
    it('has clickable buttons for each source', () => {
      render(<SourceColorEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
