/**
 * HTML utilities for safe string escaping and syntax highlighting.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * Uses DOM-based escaping when document is available,
 * otherwise falls back to manual replacement.
 */
export function escapeHtml(str: string): string {
  // DOM-based escaping (when document is available)
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Fallback for non-browser environments (tests, SSR)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * CSS class names used by syntaxHighlight for JSON highlighting.
 */
export const JSON_HIGHLIGHT_CLASSES = {
  key: 'json-key',
  string: 'json-string',
  number: 'json-number',
  boolean: 'json-boolean',
  null: 'json-null',
} as const;

/**
 * Syntax highlights JSON object as HTML string.
 * Wraps different JSON types in spans with appropriate CSS classes.
 *
 * @param obj - The object to highlight
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns HTML string with syntax highlighting spans
 */
export function syntaxHighlight(obj: unknown, indent: number = 2): string {
  const json = JSON.stringify(obj, null, indent);

  if (!json) {
    return '';
  }

  return (
    json
      // First escape HTML entities
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Then apply syntax highlighting
      .replace(/"([^"]+)":/g, `<span class="${JSON_HIGHLIGHT_CLASSES.key}">"$1"</span>:`)
      .replace(/: "([^"]*)"/g, `: <span class="${JSON_HIGHLIGHT_CLASSES.string}">"$1"</span>`)
      .replace(/: (\d+)/g, `: <span class="${JSON_HIGHLIGHT_CLASSES.number}">$1</span>`)
      .replace(
        /: (true|false)/g,
        `: <span class="${JSON_HIGHLIGHT_CLASSES.boolean}">$1</span>`
      )
      .replace(/: (null)/g, `: <span class="${JSON_HIGHLIGHT_CLASSES.null}">$1</span>`)
  );
}

/**
 * Truncates a string to specified length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Converts a string to a safe CSS class name.
 * Removes invalid characters and normalizes the string.
 */
export function toSafeClassName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
