import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GroupingSettings } from './GroupingSettings';
import { DEFAULT_SETTINGS } from '@/types';

describe('GroupingSettings', () => {
  it('renders with default settings', () => {
    const onUpdateSettings = vi.fn();
    render(<GroupingSettings settings={DEFAULT_SETTINGS} onUpdateSettings={onUpdateSettings} />);

    expect(screen.getByText('Event Grouping')).toBeInTheDocument();
    expect(screen.getByText('Enable Grouping')).toBeInTheDocument();
  });

  it('renders in compact mode without header', () => {
    const onUpdateSettings = vi.fn();
    render(<GroupingSettings settings={DEFAULT_SETTINGS} onUpdateSettings={onUpdateSettings} compact />);

    expect(screen.queryByText('Event Grouping')).not.toBeInTheDocument();
    expect(screen.getByText('Enable Grouping')).toBeInTheDocument();
  });

  it('toggles grouping on/off', () => {
    const onUpdateSettings = vi.fn();
    render(<GroupingSettings settings={DEFAULT_SETTINGS} onUpdateSettings={onUpdateSettings} />);

    // Find the toggle button within the ToggleRow component
    const toggleRow = screen.getByText('Enable Grouping').closest('.bg-dl-card');
    const toggle = toggleRow?.querySelector('button');

    expect(toggle).toBeTruthy();
    fireEvent.click(toggle!);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      grouping: {
        ...DEFAULT_SETTINGS.grouping,
        enabled: true,
      },
    });
  });

  it('shows mode selection when grouping is enabled', () => {
    const enabledSettings = {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'time' as const,
        timeWindowMs: 500,
        triggerEvents: [],
      },
    };

    render(<GroupingSettings settings={enabledSettings} onUpdateSettings={vi.fn()} />);

    expect(screen.getByText('Time Window')).toBeInTheDocument();
    expect(screen.getByText('Trigger Events')).toBeInTheDocument();
  });

  it('switches between time and event modes', () => {
    const onUpdateSettings = vi.fn();
    const enabledSettings = {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'time' as const,
        timeWindowMs: 500,
        triggerEvents: [],
      },
    };

    render(<GroupingSettings settings={enabledSettings} onUpdateSettings={onUpdateSettings} />);

    const eventButton = screen.getByText('Trigger Events');
    fireEvent.click(eventButton);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      grouping: {
        ...enabledSettings.grouping,
        mode: 'event',
      },
    });
  });

  it('shows time window options in time mode', () => {
    const timeSettings = {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'time' as const,
        timeWindowMs: 500,
        triggerEvents: [],
      },
    };

    render(<GroupingSettings settings={timeSettings} onUpdateSettings={vi.fn()} />);

    expect(screen.getByText('200ms')).toBeInTheDocument();
    expect(screen.getByText('500ms')).toBeInTheDocument();
    expect(screen.getByText('1000ms')).toBeInTheDocument();
  });

  it('shows trigger events in event mode', () => {
    const eventSettings = {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'event' as const,
        timeWindowMs: 500,
        triggerEvents: ['gtm.js', 'page_view'],
      },
    };

    render(<GroupingSettings settings={eventSettings} onUpdateSettings={vi.fn()} />);

    expect(screen.getByText('gtm.js')).toBeInTheDocument();
    expect(screen.getByText('page_view')).toBeInTheDocument();
    expect(screen.getByText('Events that start a new group:')).toBeInTheDocument();
  });

  it('removes trigger event when X is clicked', () => {
    const onUpdateSettings = vi.fn();
    const eventSettings = {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'event' as const,
        timeWindowMs: 500,
        triggerEvents: ['gtm.js', 'page_view'],
      },
    };

    render(<GroupingSettings settings={eventSettings} onUpdateSettings={onUpdateSettings} />);

    const gtmEvent = screen.getByText('gtm.js');
    const removeButton = gtmEvent.parentElement?.querySelector('button');
    fireEvent.click(removeButton!);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      grouping: {
        ...eventSettings.grouping,
        triggerEvents: ['page_view'],
      },
    });
  });

  it('shows add trigger button in event mode', () => {
    const eventSettings = {
      ...DEFAULT_SETTINGS,
      grouping: {
        enabled: true,
        mode: 'event' as const,
        timeWindowMs: 500,
        triggerEvents: [],
      },
    };

    render(<GroupingSettings settings={eventSettings} onUpdateSettings={vi.fn()} />);

    expect(screen.getByText('Add trigger event')).toBeInTheDocument();
  });
});
