import { useMemo, useCallback } from "react";
import usePaginationParams from "./usePaginationParams";

/**
 * Full-featured pagination hook supporting URL sync, pagination metadata,
 * and page clamping.
 * 
 * @param {Object} options
 * @param {number} [options.total=0]
 * @param {number} [options.defaultPage=1]
 * @param {number} [options.defaultPageSize=20]
 * @param {boolean} [options.syncWithUrl=true]
 * @param {string} [options.keyPrefix=""]
 */
export function usePagination({
  total = 0,
  defaultPage = 1,
  defaultPageSize = 20,
  syncWithUrl = true,
  keyPrefix = "",
} = {}) {
  const urlPagination = usePaginationParams({
    defaultPage,
    defaultPageSize,
    keyPrefix,
  });

  const page = urlPagination.page;
  const pageSize = urlPagination.pageSize;
  const setPageRaw = urlPagination.setPage;
  const setPageSizeRaw = urlPagination.setPageSize;

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil((total || 0) / (pageSize || 20)));
  }, [total, pageSize]);

  // Clamped active page
  const clampedPage = useMemo(() => {
    return Math.min(page, pageCount);
  }, [page, pageCount]);

  const setPage = useCallback(
    (nextPage) => {
      setPageRaw(nextPage);
    },
    [setPageRaw]
  );

  const setPageSize = useCallback(
    (newSize) => {
      setPageSizeRaw(newSize);
    },
    [setPageSizeRaw]
  );

  const reset = useCallback(() => {
    setPageRaw(1);
  }, [setPageRaw]);

  const meta = useMemo(() => {
    if (!total || total <= 0) {
      return { from: 0, to: 0, total: 0 };
    }
    const from = (clampedPage - 1) * pageSize + 1;
    const to = Math.min(clampedPage * pageSize, total);
    return { from, to, total };
  }, [clampedPage, pageSize, total]);

  return {
    page: clampedPage,
    pageSize,
    total,
    pageCount,
    setPage,
    setPageSize,
    reset,
    meta,
  };
}

export default usePagination;
