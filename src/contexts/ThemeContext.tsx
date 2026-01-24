/**
 * ThemeContext - Controls whether useTheme should apply to document or not
 * Used in marketing stories to render multiple themes side-by-side
 */

import { createContext, useContext, type ReactNode } from 'react';

interface ThemeContextValue {
  // When true, useTheme will NOT modify document.documentElement
  // This allows multiple themes to be rendered side-by-side
  suppressDocumentTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  suppressDocumentTheme: false,
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  suppressDocumentTheme?: boolean;
}

export function ThemeProvider({ children, suppressDocumentTheme = false }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={{ suppressDocumentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
