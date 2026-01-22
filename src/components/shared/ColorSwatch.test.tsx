/**
 * Tests for the ColorSwatch component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorSwatch } from './ColorSwatch';
import { SOURCE_COLOR_POOL } from '@/types';

describe('ColorSwatch', () => {
  const defaultProps = {
    colors: SOURCE_COLOR_POOL.slice(0, 5),
    selectedColor: SOURCE_COLOR_POOL[0],
    onSelect: vi.fn(),
  };

  it('should render all color buttons', () => {
    render(<ColorSwatch {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('should call onSelect when a color is clicked', () => {
    const onSelect = vi.fn();
    render(<ColorSwatch {...defaultProps} onSelect={onSelect} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);

    expect(onSelect).toHaveBeenCalledWith(SOURCE_COLOR_POOL[2]);
  });

  it('should show check icon for selected color', () => {
    render(<ColorSwatch {...defaultProps} />);

    // The selected color should have an SVG (check icon) inside
    const selectedButton = screen.getAllByRole('button')[0];
    expect(selectedButton.querySelector('svg')).toBeTruthy();
  });

  it('should not show check icon for unselected colors', () => {
    render(<ColorSwatch {...defaultProps} />);

    // Unselected colors should not have the check icon
    const unselectedButtons = screen.getAllByRole('button').slice(1);
    unselectedButtons.forEach((button) => {
      // The SVG should not be present in unselected buttons
      expect(button.querySelector('svg')).toBeFalsy();
    });
  });

  it('should apply background color to each button', () => {
    render(<ColorSwatch {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button, index) => {
      expect(button).toHaveStyle({ backgroundColor: SOURCE_COLOR_POOL[index] });
    });
  });

  it('should apply selected styles to selected color', () => {
    render(<ColorSwatch {...defaultProps} />);

    const selectedButton = screen.getAllByRole('button')[0];
    expect(selectedButton.className).toContain('border-white');
  });
});
