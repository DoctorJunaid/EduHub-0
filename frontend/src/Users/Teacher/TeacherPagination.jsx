import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherPagination({ page, pageCount, onPageChange, label }) {
  if (pageCount <= 1) return null;

  const pages =
    pageCount <= 7
      ? Array.from({ length: pageCount }, (_, index) => index + 1)
      : [...new Set([1, page - 1, page, page + 1, pageCount].filter((number) => number >= 1 && number <= pageCount))].sort((a, b) => a - b);

  return (
    <nav className="teacher-pagination" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft size={16} />
      </Button>
      <div className="teacher-pagination-pages" aria-live="polite">
        {pages.map((number, index) => (
          <span className="teacher-pagination-page" key={number}>
            {index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
            <Button
              type="button"
              size="icon-sm"
              variant={number === page ? "default" : "outline"}
              aria-label={`Page ${number}`}
              aria-current={number === page ? "page" : undefined}
              onClick={() => onPageChange(number)}
            >
              {number}
            </Button>
          </span>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}