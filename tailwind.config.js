/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Legacy colors (use CSS variables)
        'dl-primary': 'var(--dl-primary)',
        'dl-secondary': 'var(--dl-secondary)',
        'dl-accent': 'var(--dl-accent)',
        'dl-success': 'var(--dl-success)',
        'dl-warning': 'var(--dl-warning)',
        'dl-error': 'var(--dl-error)',
        'dl-dark': 'var(--dl-dark)',
        'dl-darker': 'var(--dl-darker)',
        'dl-card': 'var(--dl-card)',
        'dl-border': 'var(--dl-border)',

        // Semantic theme-aware colors for text
        'theme-text': {
          DEFAULT: 'var(--color-text-primary)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
        },

        // Semantic theme-aware colors for backgrounds
        'theme-bg': {
          DEFAULT: 'var(--color-bg-base)',
          base: 'var(--color-bg-base)',
          elevated: 'var(--color-bg-elevated)',
          card: 'var(--color-bg-card)',
          hover: 'var(--color-bg-hover)',
          active: 'var(--color-bg-active)',
        },

        // Semantic theme-aware colors for borders
        'theme-border': {
          DEFAULT: 'var(--color-border-base)',
          base: 'var(--color-border-base)',
          hover: 'var(--color-border-hover)',
          focus: 'var(--color-border-focus)',
        },

        // JSON syntax highlighting colors
        'json': {
          key: 'var(--color-json-key)',
          string: 'var(--color-json-string)',
          number: 'var(--color-json-number)',
          boolean: 'var(--color-json-boolean)',
          null: 'var(--color-json-null)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
