import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsTab } from './SettingsTab';
import { DisplaySettings } from './DisplaySettings';
import { MaxEventsSlider } from './MaxEventsSlider';
import { BackupRestore } from './BackupRestore';
import { DEFAULT_SETTINGS } from '@/types';

describe('DisplaySettings', () => {
  const defaultProps = {
    showTimestamps: true,
    persistEvents: false,
    consoleLogging: false,
    debugLogging: false,
    compactMode: false,
    onUpdateSettings: vi.fn(),
  };

  it('renders all setting rows', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByText('Show Timestamps')).toBeInTheDocument();
    expect(screen.getByText('Persist Events')).toBeInTheDocument();
    expect(screen.getByText('Compact Mode')).toBeInTheDocument();
    expect(screen.getByText('Console Logging')).toBeInTheDocument();
    expect(screen.getByText('Debug Logging')).toBeInTheDocument();
  });

  it('renders descriptions for settings with them', () => {
    render(<DisplaySettings {...defaultProps} />);
    expect(screen.getByText('Keep events across page refreshes')).toBeInTheDocument();
    expect(screen.getByText('Smaller UI in DevTools panel')).toBeInTheDocument();
    expect(screen.getByText('Log events to browser console')).toBeInTheDocument();
    expect(screen.getByText('Extension debug info in console')).toBeInTheDocument();
  });

  it('calls onUpdateSettings when toggle clicked', () => {
    const onUpdateSettings = vi.fn();
    render(<DisplaySettings {...defaultProps} onUpdateSettings={onUpdateSettings} />);

    const toggles = screen.getAllByRole('switch');
    fireEvent.click(toggles[0]); // Show Timestamps toggle

    expect(onUpdateSettings).toHaveBeenCalledWith({ showTimestamps: false });
  });
});

describe('MaxEventsSlider', () => {
  const defaultProps = {
    value: 100,
    onChange: vi.fn(),
  };

  it('renders slider with current value', () => {
    render(<MaxEventsSlider {...defaultProps} />);
    expect(screen.getByText('Max Events')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders range input with correct attributes', () => {
    render(<MaxEventsSlider {...defaultProps} min={10} max={200} step={10} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '200');
    expect(slider).toHaveAttribute('step', '10');
  });

  it('calls onChange when slider moved', () => {
    const onChange = vi.fn();
    render(<MaxEventsSlider {...defaultProps} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '150' } });

    expect(onChange).toHaveBeenCalledWith(150);
  });
});

describe('BackupRestore', () => {
  const defaultProps = {
    onExport: vi.fn(),
    onImport: vi.fn(),
  };

  it('renders export and import buttons', () => {
    render(<BackupRestore {...defaultProps} />);
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('calls onExport when Export clicked', () => {
    const onExport = vi.fn();
    render(<BackupRestore {...defaultProps} onExport={onExport} />);

    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('shows success status message', () => {
    render(<BackupRestore {...defaultProps} importStatus="Settings imported successfully" />);
    expect(screen.getByText('Settings imported successfully')).toBeInTheDocument();
  });

  it('shows error status message', () => {
    render(<BackupRestore {...defaultProps} importStatus="Error importing settings" />);
    expect(screen.getByText('Error importing settings')).toBeInTheDocument();
  });

  it('hides status when null', () => {
    render(<BackupRestore {...defaultProps} importStatus={null} />);
    expect(screen.queryByText(/success/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  });
});

describe('SettingsTab', () => {
  const defaultProps = {
    settings: DEFAULT_SETTINGS,
    onUpdateSettings: vi.fn(),
    onExportSettings: vi.fn(),
    onImportSettings: vi.fn(),
    importStatus: null,
  };

  it('renders all settings sections', () => {
    render(<SettingsTab {...defaultProps} />);

    // DataLayerConfig section
    expect(screen.getByText('dataLayer')).toBeInTheDocument();

    // MaxEventsSlider section
    expect(screen.getByText('Max Events')).toBeInTheDocument();

    // DisplaySettings section
    expect(screen.getByText('Show Timestamps')).toBeInTheDocument();

    // GroupingSettings section (should have some content)
    expect(screen.getByText('Event Grouping')).toBeInTheDocument();

    // BackupRestore section
    expect(screen.getByText('Backup & Restore Settings')).toBeInTheDocument();
  });

  it('displays current max events value', () => {
    render(<SettingsTab {...defaultProps} />);
    expect(screen.getByText(DEFAULT_SETTINGS.maxEvents.toString())).toBeInTheDocument();
  });

  it('passes import status to BackupRestore', () => {
    render(<SettingsTab {...defaultProps} importStatus="Import successful" />);
    expect(screen.getByText('Import successful')).toBeInTheDocument();
  });
});
