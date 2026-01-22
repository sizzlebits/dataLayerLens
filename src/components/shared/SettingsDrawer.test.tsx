import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsDrawer } from './SettingsDrawer';
import { DEFAULT_SETTINGS } from '@/types';

// Mock the global browser/chrome API used in SettingsDrawer
const mockSendMessage = vi.fn().mockResolvedValue(undefined);

// Set up the mock before any imports that might use it
beforeEach(() => {
  // @ts-expect-error - mocking global chrome
  globalThis.chrome = {
    tabs: { sendMessage: mockSendMessage },
  };
  // @ts-expect-error - mocking global browser
  globalThis.browser = undefined;
  mockSendMessage.mockClear();
});

describe('SettingsDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    settings: DEFAULT_SETTINGS,
    onUpdateSettings: vi.fn(),
    activeTabId: 1,
    eventCount: 42,
    onExport: vi.fn(),
    detectedSources: ['dataLayer'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<SettingsDrawer {...defaultProps} isOpen={false} />);
    expect(container.querySelector('.fixed')).not.toBeInTheDocument();
  });

  it('renders drawer when open', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders event count', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('events')).toBeInTheDocument();
  });

  it('renders DataLayer Arrays section', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('DataLayer Arrays')).toBeInTheDocument();
    // The dataLayer name is shown in a code element
    expect(screen.getByRole('code', { hidden: true }) || screen.getByText(/dataLayer/)).toBeTruthy();
  });

  it('renders Source Colours section', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('Source Colours')).toBeInTheDocument();
  });

  it('renders Display settings', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Compact Mode')).toBeInTheDocument();
    expect(screen.getByText('Timestamps')).toBeInTheDocument();
    expect(screen.getByText('Persist Events')).toBeInTheDocument();
    expect(screen.getByText('Console Logging')).toBeInTheDocument();
    expect(screen.getByText('Debug Logging')).toBeInTheDocument();
  });

  it('renders Event Grouping section', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('Event Grouping')).toBeInTheDocument();
    expect(screen.getByText('Enable Grouping')).toBeInTheDocument();
  });

  it('renders Performance section with max events slider', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Max Events')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SettingsDrawer {...defaultProps} onClose={onClose} />);

    // Find close button by its X icon - it's the button in the header
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons[0]; // First button should be close
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<SettingsDrawer {...defaultProps} onClose={onClose} />);

    // Click the backdrop (first fixed div with bg-black)
    const backdrop = container.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onUpdateSettings when setting changed', () => {
    const onUpdateSettings = vi.fn();
    // Use activeTabId={null} to avoid browser API calls
    render(<SettingsDrawer {...defaultProps} onUpdateSettings={onUpdateSettings} activeTabId={null} />);

    // Change the max events slider - this is easier to target
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });

    expect(onUpdateSettings).toHaveBeenCalledWith({ maxEvents: 50 });
  });

  it('calls onExport when Export button clicked', () => {
    const onExport = vi.fn();
    render(<SettingsDrawer {...defaultProps} onExport={onExport} />);

    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('shows grouping options when grouping is enabled', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      grouping: { ...DEFAULT_SETTINGS.grouping, enabled: true },
    };
    render(<SettingsDrawer {...defaultProps} settings={settings} />);

    expect(screen.getByText('Time Window')).toBeInTheDocument();
    expect(screen.getByText('Trigger Events')).toBeInTheDocument();
  });

  it('shows Add DataLayer button', () => {
    render(<SettingsDrawer {...defaultProps} />);
    expect(screen.getByText('Add DataLayer')).toBeInTheDocument();
  });

  it('shows max events slider', () => {
    render(<SettingsDrawer {...defaultProps} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '200');
  });
});
