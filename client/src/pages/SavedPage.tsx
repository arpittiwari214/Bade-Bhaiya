import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDeadline } from '@/lib/format';
import type { Bookmark, BookmarkEntity } from '@/lib/types';
import { useBookmarkToggle } from '@/hooks/useBookmark';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Card, PageHeader } from '@/components/ui/Surface';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';

const TABS: { value: BookmarkEntity | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'COLLEGE', label: 'Colleges' },
  { value: 'SCHOLARSHIP', label: 'Scholarships' },
  { value: 'COURSE', label: 'Courses' },
  { value: 'CAREER', label: 'Careers' },
];

const ROUTES: Record<BookmarkEntity, string> = {
  COLLEGE: '/colleges',
  SCHOLARSHIP: '/scholarships',
  COURSE: '/courses',
  CAREER: '/careers',
};

/** Each entity type has different fields worth showing on a saved card. */
function BookmarkRow({ bookmark, onRemove, isRemoving }: {
  bookmark: Bookmark;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const entity = bookmark.entity as Record<string, string | number | null> | null;
  if (!entity) return null;

  const slug = String(entity.slug ?? '');
  const title = String(entity.name ?? entity.title ?? 'Saved item');

  let subtitle = '';
  let meta: React.ReactNode = null;

  switch (bookmark.entityType) {
    case 'COLLEGE':
      subtitle = [entity.city, entity.district, entity.state].filter(Boolean).join(', ');
      break;
    case 'SCHOLARSHIP': {
      subtitle = String(entity.provider ?? '');
      const deadline = formatDeadline(String(entity.deadline ?? ''));
      meta = <Badge tone={deadline.urgency === 'urgent' ? 'danger' : 'neutral'}>{deadline.label}</Badge>;
      break;
    }
    case 'COURSE':
      subtitle = `${entity.degreeType ?? ''} · ${entity.durationYears ?? ''} years`;
      break;
    case 'CAREER':
      subtitle = `${formatCurrency(Number(entity.averageSalaryMin) || null)} – ${formatCurrency(
        Number(entity.averageSalaryMax) || null,
      )} per year`;
      break;
    default:
      break;
  }

  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <Link
          to={`${ROUTES[bookmark.entityType]}/${slug}`}
          className="font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
        >
          {title}
        </Link>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
        {meta && <div className="mt-2">{meta}</div>}
      </div>

      <Button variant="ghost" size="sm" loading={isRemoving} onClick={onRemove}>
        Remove
      </Button>
    </Card>
  );
}

export default function SavedPage() {
  const [tab, setTab] = useState<BookmarkEntity | 'ALL'>('ALL');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.bookmarks(tab === 'ALL' ? undefined : tab),
    queryFn: () =>
      apiGet<{ bookmarks: Bookmark[] }>('/bookmarks', {
        params: tab === 'ALL' ? {} : { entityType: tab },
      }),
  });

  // One toggle per type would be cleaner, but removal only needs the type on
  // the bookmark itself, so a single mutation keyed at call time is enough.
  const removeCollege = useBookmarkToggle('COLLEGE');
  const removeScholarship = useBookmarkToggle('SCHOLARSHIP');
  const removeCourse = useBookmarkToggle('COURSE');
  const removeCareer = useBookmarkToggle('CAREER');

  const removers = {
    COLLEGE: removeCollege,
    SCHOLARSHIP: removeScholarship,
    COURSE: removeCourse,
    CAREER: removeCareer,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Saved items"
        description="Colleges, scholarships, courses and careers you have bookmarked."
      />

      <div role="tablist" aria-label="Filter saved items" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((option) => (
          <button
            key={option.value}
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              tab === option.value
                ? 'bg-brand-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.bookmarks.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save a college or scholarship from its page and it will appear here for quick access."
          action={<ButtonLink to="/colleges">Browse colleges</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {data.bookmarks.map((bookmark) => {
            const remover = removers[bookmark.entityType];

            return (
              <li key={bookmark.id}>
                <BookmarkRow
                  bookmark={bookmark}
                  isRemoving={remover.isPending}
                  onRemove={() =>
                    remover.mutate({ entityId: bookmark.entityId, isBookmarked: true })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
