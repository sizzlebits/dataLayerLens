import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggleSet } from './useToggleSet';

describe('useToggleSet', () => {
  it('initializes with empty set by default', () => {
    const { result } = renderHook(() => useToggleSet());

    expect(result.current.items.size).toBe(0);
  });

  it('initializes with provided values', () => {
    const { result } = renderHook(() => useToggleSet(['a', 'b', 'c']));

    expect(result.current.items.size).toBe(3);
    expect(result.current.has('a')).toBe(true);
    expect(result.current.has('b')).toBe(true);
    expect(result.current.has('c')).toBe(true);
  });

  describe('toggle', () => {
    it('adds item if not present', () => {
      const { result } = renderHook(() => useToggleSet<string>());

      act(() => {
        result.current.toggle('item1');
      });

      expect(result.current.has('item1')).toBe(true);
    });

    it('removes item if present', () => {
      const { result } = renderHook(() => useToggleSet(['item1']));

      act(() => {
        result.current.toggle('item1');
      });

      expect(result.current.has('item1')).toBe(false);
    });

    it('toggles correctly multiple times', () => {
      const { result } = renderHook(() => useToggleSet<string>());

      act(() => result.current.toggle('item1'));
      expect(result.current.has('item1')).toBe(true);

      act(() => result.current.toggle('item1'));
      expect(result.current.has('item1')).toBe(false);

      act(() => result.current.toggle('item1'));
      expect(result.current.has('item1')).toBe(true);
    });
  });

  describe('add', () => {
    it('adds item to set', () => {
      const { result } = renderHook(() => useToggleSet<string>());

      act(() => {
        result.current.add('newItem');
      });

      expect(result.current.has('newItem')).toBe(true);
    });

    it('does not duplicate items', () => {
      const { result } = renderHook(() => useToggleSet(['existing']));

      act(() => {
        result.current.add('existing');
      });

      expect(result.current.items.size).toBe(1);
    });
  });

  describe('remove', () => {
    it('removes item from set', () => {
      const { result } = renderHook(() => useToggleSet(['item1', 'item2']));

      act(() => {
        result.current.remove('item1');
      });

      expect(result.current.has('item1')).toBe(false);
      expect(result.current.has('item2')).toBe(true);
    });

    it('does nothing if item not present', () => {
      const { result } = renderHook(() => useToggleSet(['item1']));

      act(() => {
        result.current.remove('nonexistent');
      });

      expect(result.current.items.size).toBe(1);
      expect(result.current.has('item1')).toBe(true);
    });
  });

  describe('clear', () => {
    it('removes all items', () => {
      const { result } = renderHook(() => useToggleSet(['a', 'b', 'c']));

      act(() => {
        result.current.clear();
      });

      expect(result.current.items.size).toBe(0);
    });
  });

  describe('has', () => {
    it('returns true for present items', () => {
      const { result } = renderHook(() => useToggleSet(['test']));

      expect(result.current.has('test')).toBe(true);
    });

    it('returns false for absent items', () => {
      const { result } = renderHook(() => useToggleSet(['test']));

      expect(result.current.has('other')).toBe(false);
    });
  });

  it('works with non-string types', () => {
    const { result } = renderHook(() => useToggleSet<number>([1, 2, 3]));

    expect(result.current.has(1)).toBe(true);
    expect(result.current.has(4)).toBe(false);

    act(() => {
      result.current.toggle(1);
      result.current.add(4);
    });

    expect(result.current.has(1)).toBe(false);
    expect(result.current.has(4)).toBe(true);
  });
});
