import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateEventId, generateRandomString, generateUUID } from './id';

describe('generateEventId', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates ID with timestamp prefix', () => {
    vi.setSystemTime(new Date('2024-01-18T12:00:00.000Z'));
    const id = generateEventId();
    expect(id).toMatch(/^1705579200000-/);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateEventId());
    }
    expect(ids.size).toBe(100);
  });

  it('ID format matches expected pattern', () => {
    const id = generateEventId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('random suffix has appropriate length', () => {
    const id = generateEventId();
    const parts = id.split('-');
    expect(parts.length).toBe(2);
    expect(parts[1].length).toBeGreaterThanOrEqual(1);
    expect(parts[1].length).toBeLessThanOrEqual(9);
  });
});

describe('generateRandomString', () => {
  it('generates string of default length (9)', () => {
    const str = generateRandomString();
    expect(str.length).toBe(9);
  });

  it('generates string of specified length', () => {
    expect(generateRandomString(5).length).toBe(5);
    expect(generateRandomString(20).length).toBe(20);
    expect(generateRandomString(1).length).toBe(1);
  });

  it('generates only alphanumeric characters', () => {
    const str = generateRandomString(100);
    expect(str).toMatch(/^[a-z0-9]+$/);
  });

  it('generates unique strings', () => {
    const strings = new Set<string>();
    for (let i = 0; i < 100; i++) {
      strings.add(generateRandomString(12));
    }
    expect(strings.size).toBe(100);
  });
});

describe('generateUUID', () => {
  it('generates valid UUID v4 format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('generates unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });

  it('version number is 4', () => {
    const uuid = generateUUID();
    expect(uuid[14]).toBe('4');
  });

  it('variant bits are correct (8, 9, a, or b)', () => {
    for (let i = 0; i < 10; i++) {
      const uuid = generateUUID();
      expect(['8', '9', 'a', 'b']).toContain(uuid[19].toLowerCase());
    }
  });
});
