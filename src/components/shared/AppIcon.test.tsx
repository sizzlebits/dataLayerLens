import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AppIcon } from './AppIcon';

describe('AppIcon', () => {
  describe('plain variant', () => {
    it('renders without crashing', () => {
      const { container } = render(<AppIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies default size classes', () => {
      const { container } = render(<AppIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6', 'text-dl-primary');
    });

    it('applies size prop correctly', () => {
      const { container } = render(<AppIcon size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('applies custom className', () => {
      const { container } = render(<AppIcon className="w-12 h-12 text-white" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-12', 'h-12', 'text-white');
    });

    it('renders with correct viewBox', () => {
      const { container } = render(<AppIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('renders all three path elements', () => {
      const { container } = render(<AppIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(3);
    });

    it('uses currentColor for fill', () => {
      const { container } = render(<AppIcon />);
      const paths = container.querySelectorAll('path');
      paths.forEach(path => {
        expect(path).toHaveAttribute('fill', 'currentColor');
      });
    });
  });

  describe('indented variant', () => {
    it('renders with container wrapper', () => {
      const { container } = render(<AppIcon variant="indented" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('applies box shadow to container', () => {
      const { container } = render(<AppIcon variant="indented" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(255, 255, 255, 0.05)',
      });
    });

    it('contains SVG inside wrapper', () => {
      const { container } = render(<AppIcon variant="indented" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies correct container size for different sizes', () => {
      const { container } = render(<AppIcon size="lg" variant="indented" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-10', 'h-10');
    });
  });
});
