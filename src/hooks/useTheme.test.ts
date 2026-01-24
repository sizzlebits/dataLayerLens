/**
 * Tests for useTheme hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from './useTheme';
import * as themeUtils from '@/utils/theme';

vi.mock('@/utils/theme', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((theme: string) => (theme === 'system' ? 'dark' : theme)),
  watchSystemTheme: vi.fn(() => vi.fn()),
}));

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies theme on mount', () => {
    renderHook(() => useTheme({ theme: 'dark' }));

    expect(themeUtils.applyTheme).toHaveBeenCalledWith('dark');
  });

  it('applies theme when theme changes', () => {
    type ThemeProps = { theme: 'system' | 'light' | 'dark' };
    const { rerender } = renderHook(
      ({ theme }: ThemeProps) => useTheme({ theme }),
      { initialProps: { theme: 'dark' } as ThemeProps }
    );

    expect(themeUtils.applyTheme).toHaveBeenCalledWith('dark');

    rerender({ theme: 'light' } as ThemeProps);

    expect(themeUtils.applyTheme).toHaveBeenCalledWith('light');
  });

  it('watches system theme when theme is "system"', () => {
    renderHook(() => useTheme({ theme: 'system' }));

    expect(themeUtils.watchSystemTheme).toHaveBeenCalled();
  });

  it('does not watch system theme when theme is not "system"', () => {
    renderHook(() => useTheme({ theme: 'dark' }));

    expect(themeUtils.watchSystemTheme).not.toHaveBeenCalled();
  });

  it('cleans up system theme watcher on unmount', () => {
    const cleanupFn = vi.fn();
    vi.mocked(themeUtils.watchSystemTheme).mockReturnValue(cleanupFn);

    const { unmount } = renderHook(() => useTheme({ theme: 'system' }));

    unmount();

    expect(cleanupFn).toHaveBeenCalled();
  });

  it('cleans up and re-watches when theme changes to/from system', () => {
    const cleanupFn = vi.fn();
    vi.mocked(themeUtils.watchSystemTheme).mockReturnValue(cleanupFn);

    type ThemeProps = { theme: 'system' | 'light' | 'dark' };
    const { rerender } = renderHook(
      ({ theme }: ThemeProps) => useTheme({ theme }),
      { initialProps: { theme: 'system' } as ThemeProps }
    );

    expect(themeUtils.watchSystemTheme).toHaveBeenCalledTimes(1);

    rerender({ theme: 'dark' } as ThemeProps);

    expect(cleanupFn).toHaveBeenCalled();
    expect(themeUtils.watchSystemTheme).toHaveBeenCalledTimes(1);

    rerender({ theme: 'system' } as ThemeProps);

    expect(themeUtils.watchSystemTheme).toHaveBeenCalledTimes(2);
  });

  it('returns resolved theme', () => {
    vi.mocked(themeUtils.resolveTheme).mockReturnValue('dark');

    const { result } = renderHook(() => useTheme({ theme: 'system' }));

    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('calls onThemeChange when provided', () => {
    const onThemeChange = vi.fn();

    const { result } = renderHook(() =>
      useTheme({ theme: 'dark', onThemeChange })
    );

    result.current.setTheme?.('light');

    expect(onThemeChange).toHaveBeenCalledWith('light');
  });
});
