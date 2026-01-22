import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DomainsTab } from './DomainsTab';
import { CurrentDomain } from './CurrentDomain';
import { DomainList } from './DomainList';
import type { DomainSettings } from '@/types';

describe('CurrentDomain', () => {
  const defaultProps = {
    domain: 'example.com',
    hasCustomSettings: false,
    onSaveSettings: vi.fn(),
  };

  it('renders nothing when domain is empty', () => {
    const { container } = render(
      <CurrentDomain {...defaultProps} domain="" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders domain name', () => {
    render(<CurrentDomain {...defaultProps} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('shows save button when no custom settings', () => {
    render(<CurrentDomain {...defaultProps} />);
    expect(screen.getByText('Save current settings for this domain')).toBeInTheDocument();
  });

  it('hides save button when has custom settings', () => {
    render(<CurrentDomain {...defaultProps} hasCustomSettings={true} />);
    expect(screen.queryByText('Save current settings for this domain')).not.toBeInTheDocument();
  });

  it('shows Custom badge when has custom settings', () => {
    render(<CurrentDomain {...defaultProps} hasCustomSettings={true} />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('calls onSaveSettings when save button clicked', () => {
    const onSaveSettings = vi.fn();
    render(<CurrentDomain {...defaultProps} onSaveSettings={onSaveSettings} />);

    fireEvent.click(screen.getByText('Save current settings for this domain'));
    expect(onSaveSettings).toHaveBeenCalledTimes(1);
  });
});

describe('DomainList', () => {
  const mockDomainSettings: Record<string, DomainSettings> = {
    'example.com': {
      settings: { dataLayerNames: ['dataLayer'] },
      updatedAt: Date.now(),
    },
    'test.org': {
      settings: { dataLayerNames: ['customLayer'] },
      updatedAt: Date.now() - 86400000, // 1 day ago
    },
  };

  it('shows empty state when no domains', () => {
    render(<DomainList domains={{}} onDeleteDomain={vi.fn()} />);
    expect(screen.getByText('No domain overrides saved')).toBeInTheDocument();
  });

  it('renders domain list', () => {
    render(<DomainList domains={mockDomainSettings} onDeleteDomain={vi.fn()} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('test.org')).toBeInTheDocument();
  });

  it('calls onDeleteDomain when delete clicked', () => {
    const onDeleteDomain = vi.fn();
    render(<DomainList domains={mockDomainSettings} onDeleteDomain={onDeleteDomain} />);

    const deleteButtons = screen.getAllByTitle('Remove domain settings');
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteDomain).toHaveBeenCalledWith('example.com');
  });
});

describe('DomainsTab', () => {
  const defaultProps = {
    currentDomain: 'example.com',
    domainSettings: {} as Record<string, DomainSettings>,
    onSaveCurrentDomain: vi.fn(),
    onDeleteDomain: vi.fn(),
  };

  it('renders current domain section', () => {
    render(<DomainsTab {...defaultProps} />);
    expect(screen.getByText('Current Site')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('renders domain list section', () => {
    render(<DomainsTab {...defaultProps} />);
    expect(screen.getByText('Saved Domain Overrides')).toBeInTheDocument();
  });

  it('renders info text', () => {
    render(<DomainsTab {...defaultProps} />);
    expect(screen.getByText('Domain settings override global settings when you visit that site')).toBeInTheDocument();
  });

  it('passes hasCustomSettings correctly', () => {
    const domainSettings: Record<string, DomainSettings> = {
      'example.com': { settings: {}, updatedAt: Date.now() },
    };
    render(<DomainsTab {...defaultProps} domainSettings={domainSettings} />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
