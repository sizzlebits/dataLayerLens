/**
 * ID generation utilities for creating unique identifiers.
 */

/**
 * Generates a unique event ID using timestamp and random string.
 * Format: {timestamp}-{randomString}
 * Example: "1705582800000-abc123def"
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generates a random string of specified length.
 * Uses base36 encoding (0-9, a-z).
 */
export function generateRandomString(length: number = 9): string {
  let result = '';
  while (result.length < length) {
    result += Math.random().toString(36).slice(2);
  }
  return result.slice(0, length);
}

/**
 * Generates a UUID v4 (random) identifier.
 * Uses crypto API when available, falls back to Math.random.
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
