import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

/**
 * Syncs pagination state with URL search params.
 * 
 * @param {Object} options
 * @param {number} [options.defaultPage=1]
 * @param {number} [options.defaultPageSize=20]
 * @param {string} [options.keyPrefix=""]
 */
export function usePaginationParams({
  defaultPage = 1,
  defaultPageSize = 20,
  keyPrefix = "",
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageKey = keyPrefix ? `${keyPrefix}Page` : "page";
  const pageSizeKey = keyPrefix ? `${keyPrefix}PageSize` : "pageSize";

  const page = useMemo(() => {
    const p = parseInt(searchParams.get(pageKey), 10);
    return !isNaN(p) && p >= 1 ? p : defaultPage;
  }, [searchParams, pageKey, defaultPage]);

  const pageSize = useMemo(() => {
    const s = parseInt(searchParams.get(pageSizeKey), 10);
    return !isNaN(s) && [10, 20, 50, 100].includes(s) ? s : defaultPageSize;
  }, [searchParams, pageSizeKey, defaultPageSize]);

  const setPage = useCallback(
    (newPageOrFn) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const currentPage = parseInt(next.get(pageKey), 10) || defaultPage;
          const nextVal = typeof newPageOrFn === "function" ? newPageOrFn(currentPage) : newPageOrFn;

          if (nextVal <= 1) {
            next.delete(pageKey);
          } else {
            next.set(pageKey, String(nextVal));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, pageKey, defaultPage]
  );

  const setPageSize = useCallback(
    (newSize) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newSize === defaultPageSize) {
            next.delete(pageSizeKey);
          } else {
            next.set(pageSizeKey, String(newSize));
          }
          // Reset to page 1 on page size change
          next.delete(pageKey);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, pageSizeKey, pageKey, defaultPageSize]
  );

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
  };
}

export default usePaginationParams;
