import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  describe('rendering', () => {
    it('renders with checked state', () => {
      render(<Toggle checked={true} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('renders with unchecked state', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('uses label for aria-label', () => {
      render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-label', 'Dark mode');
    });

    it('uses default aria-label when no label provided', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-label', 'Toggle');
    });

    it('generates id from label', () => {
      render(<Toggle checked={false} onChange={() => {}} label="Persist Events" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('id', 'toggle-persist-events');
    });

    it('uses provided id over generated', () => {
      render(<Toggle checked={false} onChange={() => {}} id="custom-id" label="Test" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('interaction', () => {
    it('calls onChange with opposite value when clicked', () => {
      const onChange = vi.fn();
      render(<Toggle checked={false} onChange={onChange} />);

      fireEvent.click(screen.getByRole('switch'));

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when checked toggle clicked', () => {
      const onChange = vi.fn();
      render(<Toggle checked={true} onChange={onChange} />);

      fireEvent.click(screen.getByRole('switch'));

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('does not call onChange when disabled', () => {
      const onChange = vi.fn();
      render(<Toggle checked={false} onChange={onChange} disabled={true} />);

      fireEvent.click(screen.getByRole('switch'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('applies disabled attribute', () => {
      render(<Toggle checked={false} onChange={() => {}} disabled={true} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeDisabled();
    });

    it('applies opacity class when disabled', () => {
      render(<Toggle checked={false} onChange={() => {}} disabled={true} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('opacity-50');
      expect(toggle).toHaveClass('cursor-not-allowed');
    });

    it('does not apply disabled styles when enabled', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toHaveClass('opacity-50');
    });
  });

  describe('styling', () => {
    it('applies gradient background when checked', () => {
      render(<Toggle checked={true} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle.className).toContain('from-dl-primary');
      expect(toggle.className).toContain('to-dl-secondary');
    });

    it('applies border background when unchecked', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      expect(toggle.className).toContain('bg-dl-border');
    });
  });

  describe('accessibility', () => {
    it('has role="switch"', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('has accessible knob marked as aria-hidden', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      const knob = toggle.querySelector('[aria-hidden="true"]');
      expect(knob).toBeInTheDocument();
    });

    it('is keyboard focusable', () => {
      render(<Toggle checked={false} onChange={() => {}} />);

      const toggle = screen.getByRole('switch');
      toggle.focus();
      expect(document.activeElement).toBe(toggle);
    });
  });
});
