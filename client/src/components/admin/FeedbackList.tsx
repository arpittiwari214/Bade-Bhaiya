import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGetPage } from '@/lib/api';
import { formatRelative, titleCase } from '@/lib/format';
import { Badge, Card } from '@/components/ui/Surface';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

interface FeedbackEntry {
  id: string;
  rating: number;
  category: string | null;
  message: string;
  pageUrl: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={
            star <= rating ? 'size-4 text-accent-500' : 'size-4 text-slate-300 dark:text-slate-700'
          }
          fill="currentColor"
        >
          <path d="m12 17.27-5.18 3.13 1.37-5.89-4.56-3.95 6.01-.51L12 4.5l2.36 5.55 6.01.51-4.56 3.95 1.37 5.89z" />
        </svg>
      ))}
    </span>
  );
}

export function FeedbackList() {
  const [page, setPage] = useState(1);
  const params = { page: String(page), pageSize: '20' };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'feedback', params],
    queryFn: () => apiGetPage<FeedbackEntry>('/admin/feedback', { params }),
    placeholderData: (previous) => previous,
  });

  if (isPending) return <Skeleton className="h-96" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  if (data.data.length === 0) {
    return <EmptyState title="No feedback yet" description="Responses submitted from the help page will appear here." />;
  }

  return (
    <div>
      <ul className="space-y-2">
        {data.data.map((entry) => (
          <li key={entry.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Stars rating={entry.rating} />
                  {entry.category && <Badge tone="neutral">{titleCase(entry.category)}</Badge>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {/* Anonymous feedback is legitimate; do not imply a missing name is an error. */}
                  {entry.user?.name ?? 'Anonymous'} · {formatRelative(entry.createdAt)}
                </p>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                {entry.message}
              </p>

              {entry.pageUrl && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  Submitted from {entry.pageUrl}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <Pagination meta={data.meta} itemLabel="responses" onPageChange={setPage} />
    </div>
  );
}
