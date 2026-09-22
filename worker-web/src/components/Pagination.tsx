import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  windowSize = 1,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  windowSize?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages: Array<number | '...'> = [];
  const push = (p: number | '...') => pages.push(p);

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - windowSize && p <= page + windowSize)
    ) {
      push(p);
    } else if (pages[pages.length - 1] !== '...') {
      push('...');
    }
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1 mt-6" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={14} /> Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={clsx(
              'min-w-[36px] px-2.5 py-1.5 text-sm rounded-lg',
              p === page
                ? 'bg-brand-600 text-white'
                : 'bg-white border hover:bg-gray-50',
            )}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next <ChevronRight size={14} />
      </button>
    </nav>
  );
}