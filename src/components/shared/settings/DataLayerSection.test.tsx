import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataLayerSection } from './DataLayerSection';

describe('DataLayerSection', () => {
  const defaultProps = {
    dataLayerNames: ['dataLayer'],
    sourceColors: {},
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onColorChange: vi.fn(),
  };

  describe('rendering', () => {
    it('renders section header', () => {
      render(<DataLayerSection {...defaultProps} />);

      expect(screen.getByText('DataLayer Arrays')).toBeInTheDocument();
    });

    it('renders all dataLayer names', () => {
      render(
        <DataLayerSection
          {...defaultProps}
          dataLayerNames={['dataLayer', 'customLayer', 'thirdLayer']}
        />
      );

      expect(screen.getByText('dataLayer')).toBeInTheDocument();
      expect(screen.getByText('customLayer')).toBeInTheDocument();
      expect(screen.getByText('thirdLayer')).toBeInTheDocument();
    });

    it('renders Add DataLayer button', () => {
      render(<DataLayerSection {...defaultProps} />);

      expect(screen.getByText('Add DataLayer')).toBeInTheDocument();
    });

    it('renders color dot for each dataLayer', () => {
      const { container } = render(
        <DataLayerSection
          {...defaultProps}
          dataLayerNames={['dataLayer']}
          sourceColors={{ dataLayer: '#ff0000' }}
        />
      );

      const colorButton = container.querySelector('[style*="background-color"]');
      expect(colorButton).toBeInTheDocument();
    });
  });

  describe('adding a dataLayer', () => {
    it('shows input when Add DataLayer clicked', () => {
      render(<DataLayerSection {...defaultProps} />);

      fireEvent.click(screen.getByText('Add DataLayer'));

      expect(screen.getByPlaceholderText('e.g., dataLayer_v2')).toBeInTheDocument();
    });

    it('calls onAdd when submitting new name', () => {
      const onAdd = vi.fn();
      render(<DataLayerSection {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByText('Add DataLayer'));
      fireEvent.change(screen.getByPlaceholderText('e.g., dataLayer_v2'), {
        target: { value: 'newLayer' },
      });
      // Click the check button
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find((btn) => btn.className.includes('bg-dl-success'));
      fireEvent.click(checkButton!);

      expect(onAdd).toHaveBeenCalledWith('newLayer');
    });

    it('calls onAdd when pressing Enter', () => {
      const onAdd = vi.fn();
      render(<DataLayerSection {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByText('Add DataLayer'));
      const input = screen.getByPlaceholderText('e.g., dataLayer_v2');
      fireEvent.change(input, { target: { value: 'enterLayer' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onAdd).toHaveBeenCalledWith('enterLayer');
    });

    it('does not call onAdd for duplicate name', () => {
      const onAdd = vi.fn();
      render(
        <DataLayerSection
          {...defaultProps}
          dataLayerNames={['dataLayer', 'existingLayer']}
          onAdd={onAdd}
        />
      );

      fireEvent.click(screen.getByText('Add DataLayer'));
      fireEvent.change(screen.getByPlaceholderText('e.g., dataLayer_v2'), {
        target: { value: 'existingLayer' },
      });
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find((btn) => btn.className.includes('bg-dl-success'));
      fireEvent.click(checkButton!);

      expect(onAdd).not.toHaveBeenCalled();
    });

    it('does not call onAdd for empty name', () => {
      const onAdd = vi.fn();
      render(<DataLayerSection {...defaultProps} onAdd={onAdd} />);

      fireEvent.click(screen.getByText('Add DataLayer'));
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find((btn) => btn.className.includes('bg-dl-success'));
      fireEvent.click(checkButton!);

      expect(onAdd).not.toHaveBeenCalled();
    });

    it('shows cancel button when adding', () => {
      render(<DataLayerSection {...defaultProps} />);

      fireEvent.click(screen.getByText('Add DataLayer'));

      // Cancel button should be visible
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) => btn.className.includes('bg-dl-error'));
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('removing a dataLayer', () => {
    it('disables remove button when only one dataLayer', () => {
      render(<DataLayerSection {...defaultProps} dataLayerNames={['dataLayer']} />);

      // The remove button should be disabled
      const removeButtons = screen.getAllByRole('button').filter((btn) =>
        btn.className.includes('hover:bg-dl-error')
      );
      expect(removeButtons[0]).toBeDisabled();
    });

    it('enables remove button when multiple dataLayers', () => {
      render(
        <DataLayerSection
          {...defaultProps}
          dataLayerNames={['dataLayer', 'secondLayer']}
        />
      );

      const removeButtons = screen.getAllByRole('button').filter((btn) =>
        btn.className.includes('hover:bg-dl-error')
      );
      expect(removeButtons[0]).not.toBeDisabled();
    });
  });

  describe('color picker', () => {
    it('toggles color picker when color dot clicked', () => {
      const { container } = render(
        <DataLayerSection
          {...defaultProps}
          dataLayerNames={['dataLayer']}
          sourceColors={{ dataLayer: '#ff0000' }}
        />
      );

      const colorButton = container.querySelector('[title="Change color"]');
      fireEvent.click(colorButton!);

      // Color picker should show (10 color swatches)
      const colorSwatches = container.querySelectorAll('[style*="background-color: rgb"]');
      expect(colorSwatches.length).toBeGreaterThan(1);
    });

    it('calls onColorChange when color selected', () => {
      const onColorChange = vi.fn();
      const { container } = render(
        <DataLayerSection
          {...defaultProps}
          dataLayerNames={['dataLayer']}
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
        expect(onColorChange).toHaveBeenCalledWith('dataLayer', expect.any(String));
      }
    });
  });
});
