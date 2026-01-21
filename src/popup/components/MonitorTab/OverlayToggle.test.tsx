import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayToggle } from './OverlayToggle';

describe('OverlayToggle', () => {
  describe('rendering', () => {
    it('renders enabled state correctly', () => {
      render(<OverlayToggle enabled={true} onToggle={() => {}} />);

      expect(screen.getByText('Overlay Active')).toBeInTheDocument();
      expect(screen.getByText('Click to hide the overlay on this page')).toBeInTheDocument();
    });

    it('renders disabled state correctly', () => {
      render(<OverlayToggle enabled={false} onToggle={() => {}} />);

      expect(screen.getByText('Overlay Hidden')).toBeInTheDocument();
      expect(screen.getByText('Click to show the overlay on this page')).toBeInTheDocument();
    });

    it('shows Eye icon when enabled', () => {
      const { container } = render(<OverlayToggle enabled={true} onToggle={() => {}} />);

      // The icon container should have success styling
      const iconContainer = container.querySelector('.bg-dl-success\\/20');
      expect(iconContainer).toBeInTheDocument();
    });

    it('shows EyeOff icon when disabled', () => {
      const { container } = render(<OverlayToggle enabled={false} onToggle={() => {}} />);

      // The icon container should have border styling (disabled state)
      const iconContainer = container.querySelector('.bg-dl-border\\/50');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onToggle when clicked', () => {
      const onToggle = vi.fn();
      render(<OverlayToggle enabled={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle when clicking enabled state', () => {
      const onToggle = vi.fn();
      render(<OverlayToggle enabled={true} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('applies success styling when enabled', () => {
      render(<OverlayToggle enabled={true} onToggle={() => {}} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('from-dl-success');
    });

    it('applies card styling when disabled', () => {
      render(<OverlayToggle enabled={false} onToggle={() => {}} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-dl-card');
    });

    it('rotates chevron when enabled', () => {
      const { container } = render(<OverlayToggle enabled={true} onToggle={() => {}} />);

      const chevron = container.querySelector('.rotate-90');
      expect(chevron).toBeInTheDocument();
    });

    it('does not rotate chevron when disabled', () => {
      const { container } = render(<OverlayToggle enabled={false} onToggle={() => {}} />);

      // The chevron should not have rotate-90 class
      const rotatedChevron = container.querySelector('.rotate-90');
      expect(rotatedChevron).toBeNull();
    });
  });
});
