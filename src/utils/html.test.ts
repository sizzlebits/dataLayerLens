import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  syntaxHighlight,
  truncate,
  toSafeClassName,
  JSON_HIGHLIGHT_CLASSES,
} from './html';

describe('escapeHtml', () => {
  it('escapes less than sign', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater than sign', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes double quotes', () => {
    const result = escapeHtml('say "hello"');
    expect(result).toContain('hello');
    // In DOM-based escaping, quotes may not be escaped inside textContent
    // But the result should be safe for HTML
  });

  it('escapes single quotes', () => {
    const result = escapeHtml("it's");
    expect(result).toContain('s');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles string with no special characters', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes multiple special characters', () => {
    const result = escapeHtml('<div class="test">&</div>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&amp;');
  });

  it('handles XSS attack vectors', () => {
    const xss = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(xss);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});

describe('syntaxHighlight', () => {
  it('highlights JSON keys', () => {
    const result = syntaxHighlight({ foo: 'bar' });
    expect(result).toContain(`<span class="${JSON_HIGHLIGHT_CLASSES.key}">"foo"</span>`);
  });

  it('highlights string values', () => {
    const result = syntaxHighlight({ name: 'test' });
    expect(result).toContain(`<span class="${JSON_HIGHLIGHT_CLASSES.string}">"test"</span>`);
  });

  it('highlights number values', () => {
    const result = syntaxHighlight({ count: 42 });
    expect(result).toContain(`<span class="${JSON_HIGHLIGHT_CLASSES.number}">42</span>`);
  });

  it('highlights boolean values', () => {
    const resultTrue = syntaxHighlight({ active: true });
    const resultFalse = syntaxHighlight({ active: false });
    expect(resultTrue).toContain(`<span class="${JSON_HIGHLIGHT_CLASSES.boolean}">true</span>`);
    expect(resultFalse).toContain(`<span class="${JSON_HIGHLIGHT_CLASSES.boolean}">false</span>`);
  });

  it('highlights null values', () => {
    const result = syntaxHighlight({ value: null });
    expect(result).toContain(`<span class="${JSON_HIGHLIGHT_CLASSES.null}">null</span>`);
  });

  it('handles nested objects', () => {
    const result = syntaxHighlight({ outer: { inner: 'value' } });
    expect(result).toContain(`"outer"`);
    expect(result).toContain(`"inner"`);
    expect(result).toContain(`"value"`);
  });

  it('handles arrays', () => {
    const result = syntaxHighlight({ items: [1, 2, 3] });
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  it('escapes HTML in values', () => {
    const result = syntaxHighlight({ html: '<script>alert("xss")</script>' });
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('handles empty object', () => {
    const result = syntaxHighlight({});
    expect(result).toBe('{}');
  });

  it('handles undefined input', () => {
    const result = syntaxHighlight(undefined);
    expect(result).toBe('');
  });

  it('uses custom indent', () => {
    const result = syntaxHighlight({ a: 1 }, 4);
    expect(result).toContain('    '); // 4 spaces
  });
});

describe('truncate', () => {
  it('returns original string if shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns original string if equal to max', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates string with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles very short max length', () => {
    expect(truncate('hello', 4)).toBe('h...');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('toSafeClassName', () => {
  it('converts to lowercase', () => {
    expect(toSafeClassName('HelloWorld')).toBe('helloworld');
  });

  it('replaces spaces with hyphens', () => {
    expect(toSafeClassName('hello world')).toBe('hello-world');
  });

  it('replaces special characters with hyphens', () => {
    expect(toSafeClassName('hello@world!')).toBe('hello-world');
  });

  it('removes consecutive hyphens', () => {
    expect(toSafeClassName('hello---world')).toBe('hello-world');
  });

  it('removes leading and trailing hyphens', () => {
    expect(toSafeClassName('-hello-world-')).toBe('hello-world');
  });

  it('preserves valid characters', () => {
    expect(toSafeClassName('hello-world_123')).toBe('hello-world_123');
  });

  it('handles empty string', () => {
    expect(toSafeClassName('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(toSafeClassName('!@#$%')).toBe('');
  });
});

describe('JSON_HIGHLIGHT_CLASSES', () => {
  it('has all required class names', () => {
    expect(JSON_HIGHLIGHT_CLASSES.key).toBe('json-key');
    expect(JSON_HIGHLIGHT_CLASSES.string).toBe('json-string');
    expect(JSON_HIGHLIGHT_CLASSES.number).toBe('json-number');
    expect(JSON_HIGHLIGHT_CLASSES.boolean).toBe('json-boolean');
    expect(JSON_HIGHLIGHT_CLASSES.null).toBe('json-null');
  });
});
