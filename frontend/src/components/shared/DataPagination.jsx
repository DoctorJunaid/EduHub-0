import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { formatNumber } from "../../utils/formatNumber";

/**
 * Standardized DataPagination component for Campus Admin and platform tables.
 */
export default function DataPagination({
  page = 1,
  pageSize = 20,
  total = 0,
  pageCount: explicitPageCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  isLoading = false,
  className = "",
  itemLabel = "records",
  showPageSize = true,
}) {
  const calculatedPageCount = Math.max(1, Math.ceil((total || 0) / (pageSize || 20)));
  const pageCount = explicitPageCount !== undefined ? explicitPageCount : calculatedPageCount;
  const currentPage = Math.max(1, Math.min(page, pageCount));

  if (!total || total <= 0) {
    return null;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  // Generates page numbers with ellipsis window
  const getPageNumbers = () => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }

    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("ellipsis-end");
      pages.push(pageCount);
    } else if (currentPage >= pageCount - 3) {
      pages.push(1);
      pages.push("ellipsis-start");
      for (let i = pageCount - 4; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("ellipsis-start");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("ellipsis-end");
      pages.push(pageCount);
    }
    return pages;
  };

  return (
    <div
      className={`w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 select-none ${className}`}
      aria-label="Table pagination"
    >
      {/* Left: Range & Total text */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1 text-center sm:text-left">
        <span>Showing</span>
        <strong className="font-semibold text-slate-900 dark:text-slate-200">
          {formatNumber(from)}
        </strong>
        <span>to</span>
        <strong className="font-semibold text-slate-900 dark:text-slate-200">
          {formatNumber(to)}
        </strong>
        <span>of</span>
        <strong className="font-semibold text-slate-900 dark:text-slate-200">
          {formatNumber(total)}
        </strong>
        <span>{itemLabel}</span>
      </div>

      {/* Right / Center Controls */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
        {/* Rows per page selector */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Rows per page:
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">
              Rows:
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                const nextSize = Number(val);
                if (onPageSizeChange && !isNaN(nextSize)) {
                  onPageSizeChange(nextSize);
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-[72px] text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={String(pageSize)}>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" align="end" className="z-50 min-w-[72px]">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs cursor-pointer">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:flex border-slate-200 dark:border-slate-800"
            onClick={() => onPageChange && onPageChange(1)}
            disabled={currentPage <= 1 || isLoading}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>

          {/* Previous page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200 dark:border-slate-800"
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          {/* Numeric Page Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {getPageNumbers().map((item, idx) => {
              if (item === "ellipsis-start" || item === "ellipsis-end") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 h-8 flex items-center justify-center text-slate-400"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </span>
                );
              }

              const isCurrent = item === currentPage;
              return (
                <Button
                  key={`page-${item}`}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  className={`h-8 min-w-[32px] px-2 text-xs font-medium border-slate-200 dark:border-slate-800 ${
                    isCurrent
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border-indigo-600"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => onPageChange && onPageChange(item)}
                  disabled={isLoading}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item}
                </Button>
              );
            })}
          </div>

          {/* Mobile page indicator */}
          <span className="md:hidden px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            Page {currentPage} of {pageCount}
          </span>

          {/* Next page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200 dark:border-slate-800"
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= pageCount || isLoading}
            aria-label="Go to next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:flex border-slate-200 dark:border-slate-800"
            onClick={() => onPageChange && onPageChange(pageCount)}
            disabled={currentPage >= pageCount || isLoading}
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
