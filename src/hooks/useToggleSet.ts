import { useState, useCallback } from 'react';

/**
 * Hook for managing a Set-based toggle state.
 * Common pattern used for expanded events, collapsed groups, etc.
 */
export function useToggleSet<T = string>(initialValues?: Iterable<T>) {
  const [items, setItems] = useState<Set<T>>(() => new Set(initialValues));

  const toggle = useCallback((item: T) => {
    setItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }, []);

  const add = useCallback((item: T) => {
    setItems((prev) => new Set(prev).add(item));
  }, []);

  const remove = useCallback((item: T) => {
    setItems((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }, []);

  const has = useCallback((item: T) => items.has(item), [items]);

  const clear = useCallback(() => {
    setItems(new Set());
  }, []);

  return {
    items,
    toggle,
    add,
    remove,
    has,
    clear,
    setItems,
  };
}
