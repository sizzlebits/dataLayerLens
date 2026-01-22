/**
 * Centralised debug logging utility for DataLayer Lens.
 * All debug logging should go through these utilities to ensure
 * consistent behaviour based on the debugLogging setting.
 */

const PREFIX = '[DataLayer Lens]';

/**
 * Creates a debug logger instance that can be enabled/disabled.
 * Use this for class-based modules that need to track their own debug state.
 */
export function createDebugLogger(initialEnabled: boolean = false) {
  let enabled = initialEnabled;

  return {
    /** Update the enabled state */
    setEnabled(value: boolean): void {
      enabled = value;
    },

    /** Check if debug logging is enabled */
    isEnabled(): boolean {
      return enabled;
    },

    /** Log a debug message (only when enabled) */
    debug(...args: unknown[]): void {
      if (enabled) {
        console.debug(PREFIX, ...args);
      }
    },

    /** Log an error message (only when enabled) */
    error(...args: unknown[]): void {
      if (enabled) {
        console.error(PREFIX, ...args);
      }
    },

    /** Log a warning message (only when enabled) */
    warn(...args: unknown[]): void {
      if (enabled) {
        console.warn(PREFIX, ...args);
      }
    },
  };
}

export type DebugLogger = ReturnType<typeof createDebugLogger>;

/**
 * Simple debug log function for one-off usage.
 * Pass the debugLogging flag explicitly.
 */
export function debugLog(enabled: boolean, ...args: unknown[]): void {
  if (enabled) {
    console.debug(PREFIX, ...args);
  }
}

/**
 * Simple debug error function for one-off usage.
 * Pass the debugLogging flag explicitly.
 */
export function debugError(enabled: boolean, ...args: unknown[]): void {
  if (enabled) {
    console.error(PREFIX, ...args);
  }
}
