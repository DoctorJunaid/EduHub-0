import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherPagination({ page, pageCount, onPageChange, label }) {
  if (pageCount <= 1) return null;

  const pages =
    pageCount <= 7
      ? Array.from({ length: pageCount }, (_, index) => index + 1)
      : [...new Set([1, page - 1, page, page + 1, pageCount].filter((number) => number >= 1 && number <= pageCount))].sort((a, b) => a - b);

  return (
    <nav className="campus-pagination" aria-label={label}>
      <button
        type="button"
        className="campus-page-btn"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft size={16} />
      </button>
      <div className="campus-pagination" aria-live="polite">
        {pages.map((number, index) => (
          <span className="flex items-center gap-1" key={number}>
            {index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true" className="text-slate-400">…</span>}
            <button
              type="button"
              className={`campus-page-btn ${number === page ? "is-active" : ""}`}
              aria-label={`Page ${number}`}
              aria-current={number === page ? "page" : undefined}
              onClick={() => onPageChange(number)}
            >
              {number}
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        className="campus-page-btn"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}