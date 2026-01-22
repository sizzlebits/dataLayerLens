import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popup } from './Popup';
import { DEFAULT_SETTINGS } from '@/types';

// Mock the hooks
vi.mock('./hooks/usePopupState', () => ({
  usePopupState: vi.fn(),
}));

vi.mock('./hooks/usePopupActions', () => ({
  usePopupActions: vi.fn(() => ({
    exportEvents: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    setFilterMode: vi.fn(),
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
    saveCurrentDomainSettings: vi.fn(),
    deleteDomain: vi.fn(),
  })),
}));

import { usePopupState } from './hooks/usePopupState';

describe('Popup', () => {
  const mockSetActiveTab = vi.fn();
  const mockUpdateSettings = vi.fn();
  const mockClearEvents = vi.fn();

  const defaultState = {
    settings: DEFAULT_SETTINGS,
    loadSettings: vi.fn(),
    updateSettings: mockUpdateSettings,
    events: [],
    clearEvents: mockClearEvents,
    isLoading: false,
    activeTab: 'main' as const,
    setActiveTab: mockSetActiveTab,
    newLayerName: '',
    setNewLayerName: vi.fn(),
    isAddingLayer: false,
    setIsAddingLayer: vi.fn(),
    currentDomain: 'example.com',
    setCurrentDomain: vi.fn(),
    domainSettings: {},
    setDomainSettings: vi.fn(),
    loadDomainSettings: vi.fn(),
    importStatus: null,
    setImportStatus: vi.fn(),
    fileInputRef: { current: null },
    isAddingFilter: false,
    setIsAddingFilter: vi.fn(),
    filterSearch: '',
    setFilterSearch: vi.fn(),
    isAddingTrigger: false,
    setIsAddingTrigger: vi.fn(),
    triggerSearch: '',
    setTriggerSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePopupState).mockReturnValue(defaultState);
  });

  it('shows loading state', () => {
    vi.mocked(usePopupState).mockReturnValue({ ...defaultState, isLoading: true });
    render(<Popup />);

    // Should show loading spinner, not the main content
    expect(screen.queryByText('DataLayer Lens')).not.toBeInTheDocument();
  });

  it('renders header with title', () => {
    render(<Popup />);
    expect(screen.getByText('DataLayer Lens')).toBeInTheDocument();
    expect(screen.getByText('Track your GTM events with clarity')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<Popup />);
    expect(screen.getByText('Monitor')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Domains')).toBeInTheDocument();
  });

  it('renders footer with support link', () => {
    render(<Popup />);
    expect(screen.getByText('Fuel this extension')).toBeInTheDocument();
  });

  it('changes tab when tab button clicked', () => {
    render(<Popup />);

    fireEvent.click(screen.getByText('Settings'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('settings');

    fireEvent.click(screen.getByText('Domains'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('domains');
  });

  it('renders MonitorTab when on main tab', () => {
    render(<Popup />);
    expect(screen.getByText('View Events in DevTools')).toBeInTheDocument();
  });

  it('renders SettingsTab when on settings tab', () => {
    vi.mocked(usePopupState).mockReturnValue({ ...defaultState, activeTab: 'settings' });
    render(<Popup />);
    expect(screen.getByText('Backup & Restore Settings')).toBeInTheDocument();
  });

  it('renders DomainsTab when on domains tab', () => {
    vi.mocked(usePopupState).mockReturnValue({ ...defaultState, activeTab: 'domains' });
    render(<Popup />);
    expect(screen.getByText('Current Site')).toBeInTheDocument();
    expect(screen.getByText('Saved Domain Overrides')).toBeInTheDocument();
  });

  it('shows current domain on monitor tab', () => {
    render(<Popup />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<Popup />);
    const monitorButton = screen.getByText('Monitor').closest('button');
    expect(monitorButton).toHaveClass('text-dl-accent');
  });
});
