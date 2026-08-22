import { useMutation, useQuery } from '@tanstack/react-query';
import { apiDelete, apiGetPage, apiPost } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { EVENT_LABELS, EVENT_STYLES, formatDate } from '@/lib/format';
import type { TimelineEvent, TimelineEventType } from '@/lib/types';
import { useFilters } from '@/hooks/useFilters';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Badge, Card, PageHeader } from '@/components/ui/Surface';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

const DEFAULTS = { type: '', state: '', includePast: '', page: '1' };

const TYPE_OPTIONS = (
  ['ADMISSION', 'ENTRANCE_EXAM', 'BOARD_EXAM', 'SCHOLARSHIP', 'COUNSELLING', 'RESULT'] as TimelineEventType[]
).map((type) => ({ value: type, label: EVENT_LABELS[type] }));

function daysUntil(dateString: string): number {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default function TimelinePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { filters, setFilter, resetFilters, activeCount } = useFilters(DEFAULTS);

  const params = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.includePast ? { includePast: 'true' } : {}),
    page: filters.page,
    pageSize: '20',
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.timeline(params),
    queryFn: () => apiGetPage<TimelineEvent>('/timeline', { params }),
    placeholderData: (previous) => previous,
  });

  const toggleReminder = useMutation({
    mutationFn: async ({ eventId, isSubscribed }: { eventId: string; isSubscribed: boolean }) => {
      if (isSubscribed) {
        await apiDelete(`/timeline/${eventId}/subscribe`);
        return;
      }
      await apiPost(`/timeline/${eventId}/subscribe`, {});
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['timeline'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Important dates"
        description="Admission windows, entrance exams, board exams and scholarship deadlines. Set a reminder and we will alert you three days before it opens."
      />

      <div className="mb-6 grid gap-3 rounded-[--radius-card] border border-slate-200 bg-surface p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
        <Select
          label="Type"
          placeholder="All types"
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(event) => setFilter('type', event.target.value)}
        />
        <Select
          label="State"
          placeholder="All India and state"
          value={filters.state}
          options={[
            { value: 'Maharashtra', label: 'Maharashtra' },
            { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
            { value: 'Bihar', label: 'Bihar' },
            { value: 'Tamil Nadu', label: 'Tamil Nadu' },
          ]}
          onChange={(event) => setFilter('state', event.target.value)}
        />
        <div className="flex items-end gap-3 pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={filters.includePast === 'true'}
              onChange={(event) => setFilter('includePast', event.target.checked ? 'true' : '')}
              className="size-4 rounded accent-brand-700"
            />
            Include past
          </label>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No dates to show"
          description="Nothing matches those filters. Try clearing the state or type filter."
        />
      ) : (
        <>
          <ol className="space-y-3">
            {data.data.map((event) => {
              const days = daysUntil(event.startDate);
              const isSoon = days >= 0 && days <= 14;

              return (
                <li key={event.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge colorClass={EVENT_STYLES[event.type]}>
                            {EVENT_LABELS[event.type]}
                          </Badge>
                          {event.isNational ? (
                            <Badge tone="neutral">All India</Badge>
                          ) : (
                            event.state && <Badge tone="neutral">{event.state}</Badge>
                          )}
                          {isSoon && (
                            <Badge tone="danger">
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                            </Badge>
                          )}
                        </div>

                        <h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                          {event.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {event.description}
                        </p>

                        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formatDate(event.startDate)}
                          {event.endDate ? ` – ${formatDate(event.endDate)}` : ''}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        {isAuthenticated && (
                          <Button
                            variant={event.isSubscribed ? 'secondary' : 'primary'}
                            size="sm"
                            loading={toggleReminder.isPending}
                            onClick={() =>
                              toggleReminder.mutate({
                                eventId: event.id,
                                isSubscribed: Boolean(event.isSubscribed),
                              })
                            }
                          >
                            {event.isSubscribed ? 'Reminder set' : 'Remind me'}
                          </Button>
                        )}

                        {event.url && (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-center text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                          >
                            Official site
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <Pagination
            meta={data.meta}
            itemLabel="dates"
            onPageChange={(page) => setFilter('page', String(page))}
          />
        </>
      )}
    </div>
  );
}
