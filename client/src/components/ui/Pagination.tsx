import type { PageMeta } from '@/lib/api';
import { Button } from './Button';

/**
 * Deliberately simple: previous/next with a position readout. Numbered pages
 * add little for result sets people filter rather than page through, and this
 * stays legible on a narrow screen.
 */
export function Pagination({
  meta,
  onPageChange,
  itemLabel = 'results',
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  if (meta.total === 0) return null;

  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row"
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Showing <span className="font-medium text-slate-900 dark:text-slate-200">{first}</span>–
        <span className="font-medium text-slate-900 dark:text-slate-200">{last}</span> of{' '}
        <span className="font-medium text-slate-900 dark:text-slate-200">{meta.total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPrevious}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <span className="px-1 text-sm text-slate-600 dark:text-slate-400">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
