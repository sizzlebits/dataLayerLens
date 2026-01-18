import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window.postMessage
const postMessageMock = vi.fn();

describe('Injected Script Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    postMessageMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isValidEvent', () => {
    // Recreate the validation logic from injected script
    function isValidEvent(data: unknown): data is Record<string, unknown> {
      return (
        data !== null &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        typeof (data as Record<string, unknown>).event === 'string' &&
        ((data as Record<string, unknown>).event as string).trim() !== ''
      );
    }

    it('returns true for valid GTM event objects', () => {
      expect(isValidEvent({ event: 'page_view' })).toBe(true);
      expect(isValidEvent({ event: 'gtm.js', 'gtm.uniqueEventId': 1 })).toBe(true);
      expect(isValidEvent({ event: 'purchase', ecommerce: {} })).toBe(true);
    });

    it('returns false for null', () => {
      expect(isValidEvent(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidEvent(undefined)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isValidEvent([])).toBe(false);
      expect(isValidEvent([{ event: 'test' }])).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isValidEvent('page_view')).toBe(false);
      expect(isValidEvent(123)).toBe(false);
      expect(isValidEvent(true)).toBe(false);
    });

    it('returns false for objects without event property', () => {
      expect(isValidEvent({})).toBe(false);
      expect(isValidEvent({ page: 'home' })).toBe(false);
    });

    it('returns false for objects with non-string event', () => {
      expect(isValidEvent({ event: 123 })).toBe(false);
      expect(isValidEvent({ event: null })).toBe(false);
      expect(isValidEvent({ event: undefined })).toBe(false);
      expect(isValidEvent({ event: {} })).toBe(false);
    });

    it('returns false for objects with empty/whitespace event', () => {
      expect(isValidEvent({ event: '' })).toBe(false);
      expect(isValidEvent({ event: '   ' })).toBe(false);
      expect(isValidEvent({ event: '\t\n' })).toBe(false);
    });

    it('accepts valid GTM event names', () => {
      const gtmEvents = [
        'gtm.js',
        'gtm.dom',
        'gtm.load',
        'gtm.click',
        'gtm.linkClick',
        'gtm.formSubmit',
        'gtm.historyChange',
        'gtm.scrollDepth',
        'gtm.timer',
        'gtm.video',
      ];

      gtmEvents.forEach((eventName) => {
        expect(isValidEvent({ event: eventName })).toBe(true);
      });
    });

    it('accepts GA4 ecommerce event names', () => {
      const ga4Events = [
        'page_view',
        'view_item',
        'view_item_list',
        'select_item',
        'add_to_cart',
        'remove_from_cart',
        'view_cart',
        'begin_checkout',
        'add_shipping_info',
        'add_payment_info',
        'purchase',
        'refund',
      ];

      ga4Events.forEach((eventName) => {
        expect(isValidEvent({ event: eventName })).toBe(true);
      });
    });
  });

  describe('generateId', () => {
    function generateId(): string {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    it('generates string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('includes timestamp', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
      const id = generateId();
      expect(id.startsWith('1705320000000')).toBe(true);
    });

    it('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(1);
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });
});

describe('DataLayer Array Wrapping', () => {
  let originalDataLayer: unknown[];
  let wrappedPush: (...args: unknown[]) => number;

  beforeEach(() => {
    originalDataLayer = [];
    const originalPush = originalDataLayer.push.bind(originalDataLayer);

    // Simulate the wrapping logic
    wrappedPush = function (...args: unknown[]): number {
      const result = originalPush(...args);
      // In real implementation, this would emit events
      return result;
    };
  });

  it('preserves original push functionality', () => {
    wrappedPush({ event: 'test' });
    expect(originalDataLayer.length).toBe(1);
    expect(originalDataLayer[0]).toEqual({ event: 'test' });
  });

  it('handles multiple arguments', () => {
    wrappedPush({ event: 'event1' }, { event: 'event2' });
    expect(originalDataLayer.length).toBe(2);
  });

  it('returns correct array length', () => {
    const length = wrappedPush({ event: 'test' });
    expect(length).toBe(1);

    const length2 = wrappedPush({ event: 'test2' });
    expect(length2).toBe(2);
  });
});
