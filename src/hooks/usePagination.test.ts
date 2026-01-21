import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePagination, DEFAULT_PAGE_SIZE } from './usePagination';

describe('usePagination', () => {
  describe('basic pagination', () => {
    it('returns first page of items', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const { result } = renderHook(() => usePagination(items, 0, 3));

      expect(result.current.paginatedItems).toEqual([1, 2, 3]);
    });

    it('returns second page of items', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const { result } = renderHook(() => usePagination(items, 1, 3));

      expect(result.current.paginatedItems).toEqual([4, 5, 6]);
    });

    it('returns partial page at the end', () => {
      const items = [1, 2, 3, 4, 5];

      const { result } = renderHook(() => usePagination(items, 1, 3));

      expect(result.current.paginatedItems).toEqual([4, 5]);
    });

    it('returns empty array for out-of-bounds page', () => {
      const items = [1, 2, 3];

      const { result } = renderHook(() => usePagination(items, 5, 3));

      expect(result.current.paginatedItems).toEqual([]);
    });
  });

  describe('total pages calculation', () => {
    it('calculates total pages correctly', () => {
      const items = Array.from({ length: 25 }, (_, i) => i);

      const { result } = renderHook(() => usePagination(items, 0, 10));

      expect(result.current.totalPages).toBe(3);
    });

    it('returns 1 page for items less than page size', () => {
      const items = [1, 2, 3];

      const { result } = renderHook(() => usePagination(items, 0, 10));

      expect(result.current.totalPages).toBe(1);
    });

    it('returns 0 pages for empty array', () => {
      const { result } = renderHook(() => usePagination([], 0, 10));

      expect(result.current.totalPages).toBe(0);
    });

    it('handles exact page size match', () => {
      const items = Array.from({ length: 20 }, (_, i) => i);

      const { result } = renderHook(() => usePagination(items, 0, 10));

      expect(result.current.totalPages).toBe(2);
    });
  });

  describe('default page size', () => {
    it('uses DEFAULT_PAGE_SIZE when not specified', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);

      const { result } = renderHook(() => usePagination(items, 0));

      expect(result.current.paginatedItems).toHaveLength(DEFAULT_PAGE_SIZE);
      expect(result.current.totalPages).toBe(Math.ceil(100 / DEFAULT_PAGE_SIZE));
    });

    it('exports DEFAULT_PAGE_SIZE constant', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(50);
    });
  });

  describe('type preservation', () => {
    it('preserves object types', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ];

      const { result } = renderHook(() => usePagination(items, 0, 2));

      expect(result.current.paginatedItems).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]);
    });

    it('preserves string types', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];

      const { result } = renderHook(() => usePagination(items, 1, 2));

      expect(result.current.paginatedItems).toEqual(['c', 'd']);
    });
  });

  describe('memoization', () => {
    it('returns same reference when inputs unchanged', () => {
      const items = [1, 2, 3, 4, 5];

      const { result, rerender } = renderHook(
        ({ items, page, size }) => usePagination(items, page, size),
        { initialProps: { items, page: 0, size: 3 } }
      );
      const firstResult = result.current.paginatedItems;

      rerender({ items, page: 0, size: 3 });

      expect(result.current.paginatedItems).toBe(firstResult);
    });

    it('returns new reference when page changes', () => {
      const items = [1, 2, 3, 4, 5];

      const { result, rerender } = renderHook(
        ({ items, page, size }) => usePagination(items, page, size),
        { initialProps: { items, page: 0, size: 3 } }
      );
      const firstResult = result.current.paginatedItems;

      rerender({ items, page: 1, size: 3 });

      expect(result.current.paginatedItems).not.toBe(firstResult);
    });

    it('returns new reference when items change', () => {
      const { result, rerender } = renderHook(
        ({ items, page, size }) => usePagination(items, page, size),
        { initialProps: { items: [1, 2, 3], page: 0, size: 2 } }
      );
      const firstResult = result.current.paginatedItems;

      rerender({ items: [4, 5, 6], page: 0, size: 2 });

      expect(result.current.paginatedItems).not.toBe(firstResult);
    });
  });

  describe('edge cases', () => {
    it('handles page size of 1', () => {
      const items = [1, 2, 3];

      const { result } = renderHook(() => usePagination(items, 1, 1));

      expect(result.current.paginatedItems).toEqual([2]);
      expect(result.current.totalPages).toBe(3);
    });

    it('handles single item', () => {
      const items = [42];

      const { result } = renderHook(() => usePagination(items, 0, 10));

      expect(result.current.paginatedItems).toEqual([42]);
      expect(result.current.totalPages).toBe(1);
    });

    it('handles large arrays efficiently', () => {
      const items = Array.from({ length: 10000 }, (_, i) => i);

      const { result } = renderHook(() => usePagination(items, 50, 100));

      expect(result.current.paginatedItems).toHaveLength(100);
      expect(result.current.paginatedItems[0]).toBe(5000);
    });
  });
});
