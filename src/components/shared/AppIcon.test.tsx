import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AppIcon } from './AppIcon';

describe('AppIcon', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies default className', () => {
    const { container } = render(<AppIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('applies custom className', () => {
    const { container } = render(<AppIcon className="w-8 h-8 text-primary" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8', 'text-primary');
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
