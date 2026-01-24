/**
 * Tests for theme utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSystemTheme,
  resolveTheme,
  applyTheme,
  getCurrentAppliedTheme,
  watchSystemTheme,
} from './theme';

describe('theme utilities', () => {
  describe('getSystemTheme', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns "dark" when prefers-color-scheme: dark', () => {
      const matchMediaMock: Partial<MediaQueryList> = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      global.window = {
        matchMedia: vi.fn(() => matchMediaMock as MediaQueryList),
      } as unknown as Window & typeof globalThis;

      expect(getSystemTheme()).toBe('dark');
    });

    it('returns "light" when prefers-color-scheme: light', () => {
      const matchMediaMock: Partial<MediaQueryList> = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      global.window = {
        matchMedia: vi.fn(() => matchMediaMock as MediaQueryList),
      } as unknown as Window & typeof globalThis;

      expect(getSystemTheme()).toBe('light');
    });

    it('returns "dark" when window is undefined', () => {
      // @ts-expect-error Testing undefined window
      global.window = undefined;
      expect(getSystemTheme()).toBe('dark');
    });
  });

  describe('resolveTheme', () => {
    it('returns "light" when theme is explicitly "light"', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    it('returns "dark" when theme is explicitly "dark"', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });

    it('returns system theme when theme is "system" (dark)', () => {
      const matchMediaMock: Partial<MediaQueryList> = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      global.window = {
        matchMedia: vi.fn(() => matchMediaMock as MediaQueryList),
      } as unknown as Window & typeof globalThis;

      expect(resolveTheme('system')).toBe('dark');
    });

    it('returns system theme when theme is "system" (light)', () => {
      const matchMediaMock: Partial<MediaQueryList> = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      global.window = {
        matchMedia: vi.fn(() => matchMediaMock as MediaQueryList),
      } as unknown as Window & typeof globalThis;

      expect(resolveTheme('system')).toBe('light');
    });
  });

  describe('applyTheme', () => {
    let documentElement: { getAttribute: ReturnType<typeof vi.fn>; setAttribute: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      documentElement = {
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
      };
      global.document = {
        documentElement,
      } as unknown as Document;

      const matchMediaMock: Partial<MediaQueryList> = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      global.window = {
        matchMedia: vi.fn(() => matchMediaMock as MediaQueryList),
      } as unknown as Window & typeof globalThis;
    });

    it('applies "dark" theme to document', () => {
      applyTheme('dark');
      expect(documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('applies "light" theme to document', () => {
      applyTheme('light');
      expect(documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('resolves and applies system theme', () => {
      applyTheme('system');
      // Default matchMedia.matches is false, so should be 'light'
      expect(documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('does nothing when document is undefined', () => {
      // @ts-expect-error Testing undefined document
      global.document = undefined;
      expect(() => applyTheme('dark')).not.toThrow();
    });
  });

  describe('getCurrentAppliedTheme', () => {
    let documentElement: { getAttribute: ReturnType<typeof vi.fn>; setAttribute: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      documentElement = {
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
      };
      global.document = {
        documentElement,
      } as unknown as Document;
    });

    it('returns "dark" when data-theme is "dark"', () => {
      vi.mocked(documentElement.getAttribute).mockReturnValue('dark');
      expect(getCurrentAppliedTheme()).toBe('dark');
    });

    it('returns "light" when data-theme is "light"', () => {
      vi.mocked(documentElement.getAttribute).mockReturnValue('light');
      expect(getCurrentAppliedTheme()).toBe('light');
    });

    it('returns "dark" when data-theme is not set', () => {
      vi.mocked(documentElement.getAttribute).mockReturnValue(null);
      expect(getCurrentAppliedTheme()).toBe('dark');
    });

    it('returns "dark" when data-theme is invalid', () => {
      vi.mocked(documentElement.getAttribute).mockReturnValue('invalid');
      expect(getCurrentAppliedTheme()).toBe('dark');
    });

    it('returns "dark" when document is undefined', () => {
      // @ts-expect-error Testing undefined document
      global.document = undefined;
      expect(getCurrentAppliedTheme()).toBe('dark');
    });
  });

  describe('watchSystemTheme', () => {
    let listeners: Array<(e: MediaQueryListEvent) => void>;
    let matchMediaMock: Partial<MediaQueryList>;

    beforeEach(() => {
      listeners = [];
      matchMediaMock = {
        matches: false,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners.push(listener);
          }
        }) as MediaQueryList['addEventListener'],
        removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            const index = listeners.indexOf(listener);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        }) as MediaQueryList['removeEventListener'],
      };
      global.window = {
        matchMedia: vi.fn(() => matchMediaMock as MediaQueryList),
      } as unknown as Window & typeof globalThis;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calls callback when system theme changes to dark', () => {
      const callback = vi.fn();
      watchSystemTheme(callback);

      // Simulate system theme change
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      );

      expect(callback).toHaveBeenCalledWith('dark');
    });

    it('calls callback when system theme changes to light', () => {
      const callback = vi.fn();
      watchSystemTheme(callback);

      // Simulate system theme change
      listeners.forEach((listener) =>
        listener({ matches: false } as MediaQueryListEvent)
      );

      expect(callback).toHaveBeenCalledWith('light');
    });

    it('returns cleanup function that removes listener', () => {
      const callback = vi.fn();
      const cleanup = watchSystemTheme(callback);

      expect(listeners.length).toBe(1);

      cleanup();

      expect(listeners.length).toBe(0);
    });

    it('returns no-op cleanup when window is undefined', () => {
      // @ts-expect-error Testing undefined window
      global.window = undefined;
      const callback = vi.fn();
      const cleanup = watchSystemTheme(callback);

      expect(() => cleanup()).not.toThrow();
    });
  });
});
