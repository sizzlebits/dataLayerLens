import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEventId, createDataLayerEvent } from './messaging';

describe('generateEventId', () => {
  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateEventId());
    }
    expect(ids.size).toBe(100);
  });

  it('includes timestamp in ID', () => {
    const before = Date.now();
    const id = generateEventId();
    const after = Date.now();

    const timestamp = parseInt(id.split('-')[0], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('has correct format (timestamp-random)', () => {
    const id = generateEventId();
    const parts = id.split('-');
    expect(parts.length).toBe(2);
    expect(/^\d+$/.test(parts[0])).toBe(true);
    expect(/^[a-z0-9]+$/.test(parts[1])).toBe(true);
  });
});

describe('createDataLayerEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  it('creates event from valid dataLayer push', () => {
    const data = {
      event: 'page_view',
      page_title: 'Home',
      page_location: 'https://example.com',
    };

    const event = createDataLayerEvent(data, 'dataLayer');

    expect(event).not.toBeNull();
    expect(event!.event).toBe('page_view');
    expect(event!.source).toBe('dataLayer');
    expect(event!.data).toEqual(data);
    expect(event!.raw).toEqual(data);
    expect(event!.timestamp).toBe(Date.now());
    expect(event!.id).toBeTruthy();
  });

  it('returns null for null data', () => {
    expect(createDataLayerEvent(null, 'dataLayer')).toBeNull();
  });

  it('returns null for undefined data', () => {
    expect(createDataLayerEvent(undefined, 'dataLayer')).toBeNull();
  });

  it('returns null for arrays', () => {
    expect(createDataLayerEvent(['event', 'page_view'], 'dataLayer')).toBeNull();
  });

  it('returns null for primitives', () => {
    expect(createDataLayerEvent('page_view', 'dataLayer')).toBeNull();
    expect(createDataLayerEvent(123, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent(true, 'dataLayer')).toBeNull();
  });

  it('returns null for objects without event property', () => {
    expect(createDataLayerEvent({ page_title: 'Home' }, 'dataLayer')).toBeNull();
  });

  it('returns null for objects with non-string event', () => {
    expect(createDataLayerEvent({ event: 123 }, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent({ event: null }, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent({ event: { name: 'test' } }, 'dataLayer')).toBeNull();
  });

  it('returns null for objects with empty event string', () => {
    expect(createDataLayerEvent({ event: '' }, 'dataLayer')).toBeNull();
    expect(createDataLayerEvent({ event: '   ' }, 'dataLayer')).toBeNull();
  });

  it('preserves custom source name', () => {
    const data = { event: 'test' };
    const event = createDataLayerEvent(data, 'dataLayer_v2');
    expect(event!.source).toBe('dataLayer_v2');
  });

  it('handles complex nested data', () => {
    const data = {
      event: 'purchase',
      ecommerce: {
        transaction_id: 'T123',
        value: 100,
        items: [
          { item_id: 'SKU1', item_name: 'Product 1' },
          { item_id: 'SKU2', item_name: 'Product 2' },
        ],
      },
    };

    const event = createDataLayerEvent(data, 'dataLayer');
    expect(event!.data).toEqual(data);
  });
});
