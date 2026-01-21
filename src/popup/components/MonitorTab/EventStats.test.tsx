import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventStats } from './EventStats';

describe('EventStats', () => {
  const defaultProps = {
    eventCount: 50,
    maxEvents: 500,
    onClear: vi.fn(),
  };

  describe('rendering', () => {
    it('renders Events Captured label', () => {
      render(<EventStats {...defaultProps} />);

      expect(screen.getByText('Events Captured')).toBeInTheDocument();
    });

    it('displays event count', () => {
      render(<EventStats {...defaultProps} eventCount={123} />);

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('displays max events', () => {
      render(<EventStats {...defaultProps} maxEvents={1000} />);

      expect(screen.getByText('/ 1000')).toBeInTheDocument();
    });

    it('renders Clear button', () => {
      render(<EventStats {...defaultProps} />);

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      const { container } = render(<EventStats {...defaultProps} />);

      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('export button', () => {
    it('renders Export button when onExport provided', () => {
      render(<EventStats {...defaultProps} onExport={() => {}} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('does not render Export button when onExport not provided', () => {
      render(<EventStats {...defaultProps} />);

      expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });

    it('calls onExport when Export clicked', () => {
      const onExport = vi.fn();
      render(<EventStats {...defaultProps} onExport={onExport} />);

      fireEvent.click(screen.getByText('Export'));

      expect(onExport).toHaveBeenCalled();
    });

    it('disables Export when eventCount is 0', () => {
      const onExport = vi.fn();
      render(<EventStats {...defaultProps} eventCount={0} onExport={onExport} />);

      const exportButton = screen.getByText('Export').closest('button');
      expect(exportButton).toBeDisabled();
    });

    it('enables Export when eventCount > 0', () => {
      const onExport = vi.fn();
      render(<EventStats {...defaultProps} eventCount={10} onExport={onExport} />);

      const exportButton = screen.getByText('Export').closest('button');
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('clear button', () => {
    it('calls onClear when Clear clicked', () => {
      const onClear = vi.fn();
      render(<EventStats {...defaultProps} onClear={onClear} />);

      fireEvent.click(screen.getByText('Clear'));

      expect(onClear).toHaveBeenCalled();
    });

    it('disables Clear when eventCount is 0', () => {
      render(<EventStats {...defaultProps} eventCount={0} />);

      const clearButton = screen.getByText('Clear').closest('button');
      expect(clearButton).toBeDisabled();
    });

    it('enables Clear when eventCount > 0', () => {
      render(<EventStats {...defaultProps} eventCount={10} />);

      const clearButton = screen.getByText('Clear').closest('button');
      expect(clearButton).not.toBeDisabled();
    });
  });

  describe('progress bar', () => {
    it('shows 0% width when no events', () => {
      const { container } = render(<EventStats {...defaultProps} eventCount={0} />);

      const progressBar = container.querySelector('.bg-gradient-to-r');
      // Animation target should be 0%
      expect(progressBar).toBeInTheDocument();
    });

    it('caps at 100% when over max', () => {
      const { container } = render(
        <EventStats {...defaultProps} eventCount={600} maxEvents={500} />
      );

      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies error styling to Clear button when enabled', () => {
      render(<EventStats {...defaultProps} eventCount={10} />);

      const clearButton = screen.getByText('Clear').closest('button');
      expect(clearButton?.className).toContain('text-dl-error');
    });

    it('applies muted styling to Clear button when disabled', () => {
      render(<EventStats {...defaultProps} eventCount={0} />);

      const clearButton = screen.getByText('Clear').closest('button');
      expect(clearButton?.className).toContain('text-slate-500');
    });

    it('applies primary styling to Export button when enabled', () => {
      render(<EventStats {...defaultProps} eventCount={10} onExport={() => {}} />);

      const exportButton = screen.getByText('Export').closest('button');
      expect(exportButton?.className).toContain('text-dl-primary');
    });
  });
});
