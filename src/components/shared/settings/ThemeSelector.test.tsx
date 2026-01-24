/**
 * Tests for ThemeSelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSelector } from './ThemeSelector';

describe('ThemeSelector', () => {
  it('renders all three theme options', () => {
    render(<ThemeSelector theme="system" onThemeChange={vi.fn()} />);

    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('highlights the system theme when selected', () => {
    render(<ThemeSelector theme="system" onThemeChange={vi.fn()} />);

    const systemButton = screen.getByText('System');
    expect(systemButton).toHaveClass('bg-dl-primary/20');
    expect(systemButton).toHaveClass('border-dl-primary');
    expect(systemButton).toHaveClass('text-dl-primary');
  });

  it('highlights the light theme when selected', () => {
    render(<ThemeSelector theme="light" onThemeChange={vi.fn()} />);

    const lightButton = screen.getByText('Light');
    expect(lightButton).toHaveClass('bg-dl-primary/20');
    expect(lightButton).toHaveClass('border-dl-primary');
    expect(lightButton).toHaveClass('text-dl-primary');
  });

  it('highlights the dark theme when selected', () => {
    render(<ThemeSelector theme="dark" onThemeChange={vi.fn()} />);

    const darkButton = screen.getByText('Dark');
    expect(darkButton).toHaveClass('bg-dl-primary/20');
    expect(darkButton).toHaveClass('border-dl-primary');
    expect(darkButton).toHaveClass('text-dl-primary');
  });

  it('calls onThemeChange with "system" when System button is clicked', async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();

    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    await user.click(screen.getByText('System'));

    expect(onThemeChange).toHaveBeenCalledWith('system');
    expect(onThemeChange).toHaveBeenCalledTimes(1);
  });

  it('calls onThemeChange with "light" when Light button is clicked', async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();

    render(<ThemeSelector theme="system" onThemeChange={onThemeChange} />);

    await user.click(screen.getByText('Light'));

    expect(onThemeChange).toHaveBeenCalledWith('light');
    expect(onThemeChange).toHaveBeenCalledTimes(1);
  });

  it('calls onThemeChange with "dark" when Dark button is clicked', async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();

    render(<ThemeSelector theme="light" onThemeChange={onThemeChange} />);

    await user.click(screen.getByText('Dark'));

    expect(onThemeChange).toHaveBeenCalledWith('dark');
    expect(onThemeChange).toHaveBeenCalledTimes(1);
  });

  it('displays inactive state for non-selected themes', () => {
    render(<ThemeSelector theme="dark" onThemeChange={vi.fn()} />);

    const systemButton = screen.getByText('System');
    const lightButton = screen.getByText('Light');

    expect(systemButton).toHaveClass('border-dl-border');
    expect(systemButton).toHaveClass('text-theme-text-secondary');

    expect(lightButton).toHaveClass('border-dl-border');
    expect(lightButton).toHaveClass('text-theme-text-secondary');
  });
});
