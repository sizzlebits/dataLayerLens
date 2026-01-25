/**
 * Tests for the EventRenderer module.
 */

import { describe, it, expect } from 'vitest';
import {
  getEventCategory,
  escapeHtml,
  syntaxHighlight,
} from './EventRenderer';

describe('EventRenderer', () => {
  describe('getEventCategory', () => {
    it('should return correct category for GTM events', () => {
      expect(getEventCategory('gtm.js').icon).toBe('🚀');
      expect(getEventCategory('gtm.dom').icon).toBe('📄');
      expect(getEventCategory('gtm.load').icon).toBe('✅');
      expect(getEventCategory('gtm.click').icon).toBe('👆');
    });

    it('should return correct category for GA4 events', () => {
      expect(getEventCategory('page_view').icon).toBe('👁️');
      expect(getEventCategory('view_item').icon).toBe('🛍️');
      expect(getEventCategory('add_to_cart').icon).toBe('🛒');
      expect(getEventCategory('purchase').icon).toBe('💰');
    });

    it('should return partial match for click events', () => {
      expect(getEventCategory('button_click').icon).toBe('👆');
      expect(getEventCategory('link_clicked').icon).toBe('👆');
    });

    it('should return partial match for view events', () => {
      expect(getEventCategory('content_view').icon).toBe('👁️');
      expect(getEventCategory('item_viewed').icon).toBe('👁️');
    });

    it('should return partial match for cart events', () => {
      expect(getEventCategory('update_cart').icon).toBe('🛒');
      expect(getEventCategory('cart_updated').icon).toBe('🛒');
    });

    it('should return default category for unknown events', () => {
      const result = getEventCategory('custom_unknown_event');
      expect(result.icon).toBe('📌');
      expect(result.color).toBe('var(--color-event-default)'); // CSS variable for theme-aware colors
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"hello"')).toBe('"hello"');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('syntaxHighlight', () => {
    it('should highlight JSON keys', () => {
      const result = syntaxHighlight({ name: 'test' });
      expect(result).toContain('<span class="json-key">"name"</span>');
    });

    it('should highlight string values', () => {
      const result = syntaxHighlight({ name: 'test' });
      expect(result).toContain('<span class="json-string">"test"</span>');
    });

    it('should highlight number values', () => {
      const result = syntaxHighlight({ count: 42 });
      expect(result).toContain('<span class="json-number">42</span>');
    });

    it('should highlight boolean values', () => {
      const result = syntaxHighlight({ active: true });
      expect(result).toContain('<span class="json-boolean">true</span>');
    });

    it('should highlight null values', () => {
      const result = syntaxHighlight({ value: null });
      expect(result).toContain('<span class="json-null">null</span>');
    });

    it('should escape HTML in output', () => {
      const result = syntaxHighlight({ html: '<div>' });
      expect(result).toContain('&lt;div&gt;');
    });

    it('should handle nested objects', () => {
      const result = syntaxHighlight({
        user: {
          name: 'John',
          age: 30,
        },
      });
      expect(result).toContain('"user"');
      expect(result).toContain('"name"');
      expect(result).toContain('"age"');
    });

    it('should handle arrays', () => {
      const result = syntaxHighlight({ items: [1, 2, 3] });
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });
  });
});
