'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_SLOTS = 7;

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= MAX_SLOTS) {
      return Array.from({length: totalPages}, (_, i) => i + 1);
    }

    const showStartEllipsis = currentPage > 4;
    const showEndEllipsis = currentPage < totalPages - 3;

    const pages: (number | string)[] = [1];
    if (showStartEllipsis) pages.push('start-ellipsis');

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (!showStartEllipsis) {
      start = 2;
      end = Math.max(end, MAX_SLOTS - 2);
    }
    if (!showEndEllipsis) {
      end = totalPages - 1;
      start = Math.min(start, totalPages - (MAX_SLOTS - 3));
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (showEndEllipsis) pages.push('end-ellipsis');
    pages.push(totalPages);

    return pages;
  };

  return (
    <div
      className="flex items-center justify-center gap-1 mt-8"
      style={{visibility: totalPages <= 1 ? 'hidden' : undefined}}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="flex items-center justify-center w-8 h-8 text-grey hover:bg-grey/10 hover:text-grey-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {getPageNumbers().map((page, i) =>
        typeof page === 'string' ? (
          <span
            key={page + i}
            className="flex items-center justify-center w-8 h-8 text-sm text-grey select-none"
          >
            ···
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`flex items-center justify-center w-8 h-8 text-sm tabular-nums transition-colors ${
              currentPage === page
                ? 'bg-grey text-white'
                : 'text-grey hover:bg-grey/10 hover:text-grey-800'
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="flex items-center justify-center w-8 h-8 text-grey hover:bg-grey/10 hover:text-grey-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
