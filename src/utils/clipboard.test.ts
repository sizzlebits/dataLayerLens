import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isClipboardApiAvailable, copyToClipboard } from './clipboard';

describe('clipboard utilities', () => {
  const originalNavigator = global.navigator;
  const originalDocument = global.document;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('isClipboardApiAvailable', () => {
    it('returns true when Clipboard API is available', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      expect(isClipboardApiAvailable()).toBe(true);
    });

    it('returns false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(isClipboardApiAvailable()).toBe(false);
    });

    it('returns false when clipboard is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(isClipboardApiAvailable()).toBe(false);
    });

    it('returns false when writeText is not a function', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: 'not a function',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(isClipboardApiAvailable()).toBe(false);
    });
  });

  describe('copyToClipboard', () => {
    it('uses Clipboard API when available and succeeds', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: mockWriteText,
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard('test text');

      expect(mockWriteText).toHaveBeenCalledWith('test text');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('falls back to execCommand when Clipboard API fails', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: mockWriteText,
          },
        },
        writable: true,
        configurable: true,
      });

      // Mock execCommand
      const mockExecCommand = vi.fn().mockReturnValue(true);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockSelect = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue({
        value: '',
        style: {},
        select: mockSelect,
        setAttribute: vi.fn(),
      });

      Object.defineProperty(global, 'document', {
        value: {
          ...originalDocument,
          createElement: mockCreateElement,
          execCommand: mockExecCommand,
          body: {
            appendChild: mockAppendChild,
            removeChild: mockRemoveChild,
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard('test text');

      expect(mockWriteText).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.success).toBe(true);
    });

    it('uses execCommand when Clipboard API is not available', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const mockExecCommand = vi.fn().mockReturnValue(true);
      const mockSelect = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue({
        value: '',
        style: {},
        select: mockSelect,
        setAttribute: vi.fn(),
      });

      Object.defineProperty(global, 'document', {
        value: {
          createElement: mockCreateElement,
          execCommand: mockExecCommand,
          body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard('test text');

      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(result.success).toBe(true);
    });

    it('returns error when both methods fail', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('API blocked'));
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: mockWriteText,
          },
        },
        writable: true,
        configurable: true,
      });

      const mockExecCommand = vi.fn().mockReturnValue(false);
      const mockSelect = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue({
        value: '',
        style: {},
        select: mockSelect,
        setAttribute: vi.fn(),
      });

      Object.defineProperty(global, 'document', {
        value: {
          createElement: mockCreateElement,
          execCommand: mockExecCommand,
          body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard('test text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('execCommand copy failed');
    });

    it('handles execCommand throwing an exception', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const mockExecCommand = vi.fn().mockImplementation(() => {
        throw new Error('Security error');
      });
      const mockSelect = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue({
        value: '',
        style: {},
        select: mockSelect,
        setAttribute: vi.fn(),
      });

      Object.defineProperty(global, 'document', {
        value: {
          createElement: mockCreateElement,
          execCommand: mockExecCommand,
          body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard('test text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Security error');
    });
  });
});
