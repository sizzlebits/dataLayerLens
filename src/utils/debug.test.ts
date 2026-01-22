import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebugLogger, debugLog, debugError } from './debug';

describe('debug utilities', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDebugLogger', () => {
    it('creates a logger instance', () => {
      const logger = createDebugLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.setEnabled).toBe('function');
      expect(typeof logger.isEnabled).toBe('function');
    });

    it('starts disabled by default', () => {
      const logger = createDebugLogger();
      expect(logger.isEnabled()).toBe(false);
    });

    it('can be created with initial enabled state', () => {
      const logger = createDebugLogger(true);
      expect(logger.isEnabled()).toBe(true);
    });

    it('does not log when disabled', () => {
      const logger = createDebugLogger(false);

      logger.debug('test debug');
      logger.error('test error');
      logger.warn('test warn');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('logs with prefix when enabled', () => {
      const logger = createDebugLogger(true);

      logger.debug('test debug message', { foo: 'bar' });
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DataLayer Lens]',
        'test debug message',
        { foo: 'bar' }
      );

      logger.error('test error message', new Error('test'));
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[DataLayer Lens]',
        'test error message',
        expect.any(Error)
      );

      logger.warn('test warn message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[DataLayer Lens]',
        'test warn message'
      );
    });

    it('setEnabled toggles logging on and off', () => {
      const logger = createDebugLogger(false);

      logger.debug('should not log');
      expect(consoleSpy.debug).not.toHaveBeenCalled();

      logger.setEnabled(true);
      expect(logger.isEnabled()).toBe(true);

      logger.debug('should log now');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DataLayer Lens]',
        'should log now'
      );

      logger.setEnabled(false);
      expect(logger.isEnabled()).toBe(false);

      consoleSpy.debug.mockClear();
      logger.debug('should not log again');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });
  });

  describe('debugLog', () => {
    it('logs when enabled is true', () => {
      debugLog(true, 'test message', 123);
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DataLayer Lens]',
        'test message',
        123
      );
    });

    it('does not log when enabled is false', () => {
      debugLog(false, 'test message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });
  });

  describe('debugError', () => {
    it('logs error when enabled is true', () => {
      const error = new Error('test error');
      debugError(true, 'error occurred:', error);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[DataLayer Lens]',
        'error occurred:',
        error
      );
    });

    it('does not log error when enabled is false', () => {
      debugError(false, 'error occurred:', new Error('test'));
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });
});
