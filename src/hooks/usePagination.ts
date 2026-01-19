import { useMemo } from 'react';

export const DEFAULT_PAGE_SIZE = 50;

interface UsePaginationResult<T> {
  paginatedItems: T[];
  totalPages: number;
}

/**
 * Hook for paginating an array of items.
 */
export function usePagination<T>(
  items: T[],
  currentPage: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): UsePaginationResult<T> {
  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return { paginatedItems, totalPages };
}
