// Design tokens extracted from Tailwind config

export const colors = {
  // Brand
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Violet
  accent: '#22d3ee',     // Cyan

  // Background
  dark: '#0f172a',       // slate-900
  darker: '#020617',     // slate-950
  card: '#1e293b',       // slate-800

  // Borders
  border: '#334155',     // slate-700

  // Text
  textPrimary: '#f8fafc',   // slate-50
  textSecondary: '#94a3b8', // slate-400
  textMuted: '#64748b',     // slate-500

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
} as const;

export const radii = {
  none: '0',
  sm: '0.125rem',
  default: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
} as const;
