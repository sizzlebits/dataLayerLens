/**
 * ThemeWrapper - Ensures theme attribute is properly applied for marketing stories
 * Prevents components from modifying document theme when rendering side-by-side
 */

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '../../styles/globals.css';

interface ThemeWrapperProps {
  theme: 'light' | 'dark';
  children: ReactNode;
}

/**
 * Creates an isolated container with its own theme context
 * This prevents multiple themes from conflicting when rendered side-by-side
 */
export function ThemeWrapper({ theme, children }: ThemeWrapperProps) {
  return (
    <ThemeProvider suppressDocumentTheme={true}>
      <div
        data-theme={theme}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          isolation: 'isolate',
        }}
      >
        {children}
      </div>
    </ThemeProvider>
  );
}
