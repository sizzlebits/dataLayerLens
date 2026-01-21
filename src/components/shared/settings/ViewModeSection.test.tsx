import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModeSection } from './ViewModeSection';

describe('ViewModeSection', () => {
  describe('rendering', () => {
    it('renders all three view mode buttons', () => {
      render(<ViewModeSection viewMode="overlay" onViewModeChange={() => {}} />);

      expect(screen.getByText('Overlay')).toBeInTheDocument();
      expect(screen.getByText('Side Panel')).toBeInTheDocument();
      expect(screen.getByText('DevTools')).toBeInTheDocument();
    });

    it('renders section header', () => {
      render(<ViewModeSection viewMode="overlay" onViewModeChange={() => {}} />);

      expect(screen.getByText('View Mode')).toBeInTheDocument();
    });

    it('highlights selected overlay mode', () => {
      render(<ViewModeSection viewMode="overlay" onViewModeChange={() => {}} />);

      const overlayButton = screen.getByText('Overlay').closest('button');
      expect(overlayButton?.className).toContain('bg-dl-primary');
    });

    it('highlights selected sidepanel mode', () => {
      render(<ViewModeSection viewMode="sidepanel" onViewModeChange={() => {}} />);

      const sidepanelButton = screen.getByText('Side Panel').closest('button');
      expect(sidepanelButton?.className).toContain('bg-dl-primary');
    });

    it('highlights selected devtools mode', () => {
      render(<ViewModeSection viewMode="devtools" onViewModeChange={() => {}} />);

      const devtoolsButton = screen.getByText('DevTools').closest('button');
      expect(devtoolsButton?.className).toContain('bg-dl-primary');
    });
  });

  describe('description text', () => {
    it('shows overlay description when overlay selected', () => {
      render(<ViewModeSection viewMode="overlay" onViewModeChange={() => {}} />);

      expect(screen.getByText('On-page overlay for quick access.')).toBeInTheDocument();
    });

    it('shows sidepanel description when sidepanel selected', () => {
      render(<ViewModeSection viewMode="sidepanel" onViewModeChange={() => {}} />);

      expect(screen.getByText('Opens in browser side panel.')).toBeInTheDocument();
    });

    it('shows devtools description when devtools selected', () => {
      render(<ViewModeSection viewMode="devtools" onViewModeChange={() => {}} />);

      expect(screen.getByText('F12 → DL tab')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onViewModeChange with overlay when overlay clicked', () => {
      const onChange = vi.fn();
      render(<ViewModeSection viewMode="sidepanel" onViewModeChange={onChange} />);

      fireEvent.click(screen.getByText('Overlay'));

      expect(onChange).toHaveBeenCalledWith('overlay');
    });

    it('calls onViewModeChange with sidepanel when sidepanel clicked', () => {
      const onChange = vi.fn();
      render(<ViewModeSection viewMode="overlay" onViewModeChange={onChange} />);

      fireEvent.click(screen.getByText('Side Panel'));

      expect(onChange).toHaveBeenCalledWith('sidepanel');
    });

    it('calls onViewModeChange with devtools when devtools clicked', () => {
      const onChange = vi.fn();
      render(<ViewModeSection viewMode="overlay" onViewModeChange={onChange} />);

      fireEvent.click(screen.getByText('DevTools'));

      expect(onChange).toHaveBeenCalledWith('devtools');
    });

    it('calls onViewModeChange when clicking already selected mode', () => {
      const onChange = vi.fn();
      render(<ViewModeSection viewMode="overlay" onViewModeChange={onChange} />);

      fireEvent.click(screen.getByText('Overlay'));

      expect(onChange).toHaveBeenCalledWith('overlay');
    });
  });
});
