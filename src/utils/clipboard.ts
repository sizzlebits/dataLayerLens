/**
 * Clipboard utilities with feature detection and graceful fallbacks.
 */

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Checks if the Clipboard API is available via feature detection.
 * Does NOT attempt to use the clipboard (avoids writing empty strings).
 */
export function isClipboardApiAvailable(): boolean {
  return typeof navigator !== 'undefined' &&
         typeof navigator.clipboard !== 'undefined' &&
         typeof navigator.clipboard.writeText === 'function';
}

/**
 * Copies text to clipboard using the modern Clipboard API.
 * Returns success status without throwing.
 */
async function copyWithClipboardApi(text: string): Promise<ClipboardResult> {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clipboard API failed';
    return { success: false, error: message };
  }
}

/**
 * Copies text to clipboard using legacy execCommand fallback.
 * Works in some contexts where Clipboard API is blocked.
 */
function copyWithExecCommand(text: string): ClipboardResult {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (success) {
      return { success: true };
    }
    return { success: false, error: 'execCommand copy failed' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'execCommand failed';
    return { success: false, error: message };
  }
}

/**
 * Copies text to clipboard with automatic fallback.
 *
 * Strategy:
 * 1. If Clipboard API is available, try it first
 * 2. If Clipboard API fails or isn't available, try execCommand fallback
 * 3. Returns result with success status and optional error message
 *
 * @param text - The text to copy
 * @returns Promise with success status and optional error
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  // Try modern Clipboard API first if available
  if (isClipboardApiAvailable()) {
    const result = await copyWithClipboardApi(text);
    if (result.success) {
      return result;
    }
    // Clipboard API failed, try fallback
  }

  // Try execCommand fallback (may work in DevTools where Clipboard API is blocked)
  return copyWithExecCommand(text);
}
