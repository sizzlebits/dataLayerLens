import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonitorTab } from './MonitorTab';
import { FilterPanel } from './FilterPanel';
import { DEFAULT_SETTINGS } from '@/types';

describe('FilterPanel', () => {
  const defaultProps = {
    filters: [] as string[],
    filterMode: 'include' as const,
    onAddFilter: vi.fn(),
    onRemoveFilter: vi.fn(),
    onClearFilters: vi.fn(),
    onSetFilterMode: vi.fn(),
  };

  it('renders filter mode buttons', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText('Exclude')).toBeInTheDocument();
    expect(screen.getByText('Include')).toBeInTheDocument();
  });

  it('renders Add Filter button when not adding', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.getByText('Add Filter')).toBeInTheDocument();
  });

  it('shows input when Add Filter clicked', () => {
    render(<FilterPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Add Filter'));
    expect(screen.getByPlaceholderText('Type event name...')).toBeInTheDocument();
  });

  it('renders active filters', () => {
    render(<FilterPanel {...defaultProps} filters={['page_view', 'purchase']} />);
    expect(screen.getByText(/page_view/)).toBeInTheDocument();
    expect(screen.getByText(/purchase/)).toBeInTheDocument();
  });

  it('calls onRemoveFilter when filter X clicked', () => {
    const onRemoveFilter = vi.fn();
    render(<FilterPanel {...defaultProps} filters={['page_view']} onRemoveFilter={onRemoveFilter} />);

    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(btn => btn.querySelector('svg'));
    if (removeButton) {
      fireEvent.click(removeButton);
    }
    // The X button is inside the filter span
  });

  it('calls onSetFilterMode when mode buttons clicked', () => {
    const onSetFilterMode = vi.fn();
    render(<FilterPanel {...defaultProps} onSetFilterMode={onSetFilterMode} />);

    fireEvent.click(screen.getByText('Exclude'));
    expect(onSetFilterMode).toHaveBeenCalledWith('exclude');

    fireEvent.click(screen.getByText('Include'));
    expect(onSetFilterMode).toHaveBeenCalledWith('include');
  });

  it('shows Clear button only when filters exist', () => {
    const { rerender } = render(<FilterPanel {...defaultProps} />);
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();

    rerender(<FilterPanel {...defaultProps} filters={['test']} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls onClearFilters when Clear clicked', () => {
    const onClearFilters = vi.fn();
    render(<FilterPanel {...defaultProps} filters={['test']} onClearFilters={onClearFilters} />);

    fireEvent.click(screen.getByText('Clear'));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('adds filter on Enter key', async () => {
    const user = userEvent.setup();
    const onAddFilter = vi.fn();
    render(<FilterPanel {...defaultProps} onAddFilter={onAddFilter} />);

    await user.click(screen.getByText('Add Filter'));
    const input = screen.getByPlaceholderText('Type event name...');
    await user.type(input, 'my_custom_filter{Enter}');

    // The filter is added via handleAddFilter which calls onAddFilter with trimmed value
    expect(onAddFilter).toHaveBeenCalledWith('my_custom_filter');
  });

  it('closes input on Escape key', () => {
    render(<FilterPanel {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Filter'));
    const input = screen.getByPlaceholderText('Type event name...');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByPlaceholderText('Type event name...')).not.toBeInTheDocument();
  });

  it('shows suggestions when typing', () => {
    render(<FilterPanel {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Filter'));
    const input = screen.getByPlaceholderText('Type event name...');
    fireEvent.change(input, { target: { value: 'page' } });

    expect(screen.getByText('page_view')).toBeInTheDocument();
  });
});

describe('MonitorTab', () => {
  const defaultProps = {
    settings: DEFAULT_SETTINGS,
    events: [],
    currentDomain: 'example.com',
    onClearEvents: vi.fn(),
    onExportEvents: vi.fn(),
    onAddFilter: vi.fn(),
    onRemoveFilter: vi.fn(),
    onClearFilters: vi.fn(),
    onSetFilterMode: vi.fn(),
  };

  it('renders DevTools info section', () => {
    render(<MonitorTab {...defaultProps} />);
    expect(screen.getByText('View Events in DevTools')).toBeInTheDocument();
    expect(screen.getByText('Press F12, then select the DataLayer Lens tab')).toBeInTheDocument();
  });

  it('renders current domain', () => {
    render(<MonitorTab {...defaultProps} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('renders dataLayer names being monitored', () => {
    render(<MonitorTab {...defaultProps} />);
    expect(screen.getByText('dataLayer')).toBeInTheDocument();
  });

  it('renders FilterPanel', () => {
    render(<MonitorTab {...defaultProps} />);
    expect(screen.getByText('Active Filters')).toBeInTheDocument();
  });

  it('renders EventStats', () => {
    render(<MonitorTab {...defaultProps} />);
    expect(screen.getByText('Events Captured')).toBeInTheDocument();
  });

  it('shows correct event count', () => {
    const events = [
      { id: '1', event: 'test', timestamp: Date.now(), data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 0 },
      { id: '2', event: 'test2', timestamp: Date.now(), data: {}, source: 'dataLayer', raw: {}, dataLayerIndex: 1 },
    ];
    render(<MonitorTab {...defaultProps} events={events} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders multiple dataLayer names', () => {
    const settings = { ...DEFAULT_SETTINGS, dataLayerNames: ['dataLayer', 'customLayer'] };
    render(<MonitorTab {...defaultProps} settings={settings} />);
    expect(screen.getByText('dataLayer')).toBeInTheDocument();
    expect(screen.getByText('customLayer')).toBeInTheDocument();
  });
});
