/**
 * Theme management hook
 * Handles theme switching and system preference detection
 */

import { useEffect } from 'react';
import { applyTheme, resolveTheme, watchSystemTheme, type ThemeMode } from '@/utils/theme';
import { useThemeContext } from '@/contexts/ThemeContext';

export interface UseThemeProps {
  theme: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

/**
 * Hook to manage theme application and system preference watching
 */
export function useTheme({ theme, onThemeChange }: UseThemeProps) {
  const { suppressDocumentTheme } = useThemeContext();

  // Apply theme when it changes (skip if suppressed for side-by-side rendering)
  useEffect(() => {
    if (suppressDocumentTheme) return;
    applyTheme(theme);
  }, [theme, suppressDocumentTheme]);

  // Watch for system theme changes if theme is set to 'system'
  useEffect(() => {
    if (suppressDocumentTheme) return;
    if (theme !== 'system') return;

    // Apply initial system theme
    applyTheme('system');

    // Watch for changes
    const cleanup = watchSystemTheme(() => {
      // Re-apply system theme when it changes
      applyTheme('system');
    });

    return cleanup;
  }, [theme, suppressDocumentTheme]);

  return {
    resolvedTheme: resolveTheme(theme),
    setTheme: onThemeChange,
  };
}
