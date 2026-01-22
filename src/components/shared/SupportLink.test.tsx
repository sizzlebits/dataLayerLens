import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SupportLink } from './SupportLink';

describe('SupportLink', () => {
  it('renders the link text', () => {
    render(<SupportLink />);
    expect(screen.getByText('Fuel this extension')).toBeInTheDocument();
  });

  it('links to PayPal', () => {
    render(<SupportLink />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://paypal.me/milehighsi');
  });

  it('opens in new tab', () => {
    render(<SupportLink />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies custom className', () => {
    render(<SupportLink className="mt-4" />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('mt-4');
  });

  it('renders coffee icon', () => {
    const { container } = render(<SupportLink />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
