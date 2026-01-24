/**
 * Theme utilities for managing theme switching and system preference detection
 */

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Get the user's system color scheme preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Resolve the theme setting to an actual theme (light or dark)
 * @param theme - The theme setting ('system', 'light', or 'dark')
 * @returns The resolved theme ('light' or 'dark')
 */
export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply the theme to the document root
 * @param theme - The theme setting to apply
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const resolvedTheme = resolveTheme(theme);

  // Set data-theme attribute on document root
  document.documentElement.setAttribute('data-theme', resolvedTheme);
}

/**
 * Get the currently applied theme from the document
 */
export function getCurrentAppliedTheme(): ResolvedTheme {
  if (typeof document === 'undefined') return 'dark';

  const dataTheme = document.documentElement.getAttribute('data-theme');
  return (dataTheme === 'light' || dataTheme === 'dark') ? dataTheme : 'dark';
}

/**
 * Listen for system theme preference changes
 * @param callback - Function to call when system theme changes
 * @returns Cleanup function to remove the listener
 */
export function watchSystemTheme(callback: (theme: ResolvedTheme) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  // Use addEventListener for better compatibility
  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
