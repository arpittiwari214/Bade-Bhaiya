import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import {
  APPLICATION_STATUS_STYLES,
  EDUCATION_LABELS,
  STREAM_LABELS,
  formatCurrency,
  formatDate,
  formatDeadline,
  titleCase,
} from '@/lib/format';
import type { ApplicationStatus, Scholarship } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { useBookmarkToggle } from '@/hooks/useBookmark';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { Alert, ErrorState, LoadingBlock } from '@/components/ui/Feedback';

interface Response {
  scholarship: Scholarship;
  application: { id: string; status: ApplicationStatus; appliedAt: string } | null;
}

export default function ScholarshipDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const detailKey = queryKeys.scholarship(slug);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: detailKey,
    queryFn: () => apiGet<Response>(`/scholarships/${slug}`),
    enabled: Boolean(slug),
  });

  const toggleBookmark = useBookmarkToggle('SCHOLARSHIP', detailKey);

  const track = useMutation({
    mutationFn: (scholarshipId: string) =>
      apiPost('/scholarships/applications', { scholarshipId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  if (isPending) return <LoadingBlock />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { scholarship, application } = data;
  const deadline = formatDeadline(scholarship.deadline);
  const isClosed = deadline.urgency === 'past';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/scholarships"
        className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        ← All scholarships
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
          {scholarship.title}
        </h1>
        <p className="mt-1.5 text-slate-600 dark:text-slate-400">Offered by {scholarship.provider}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            tone={
              deadline.urgency === 'urgent'
                ? 'danger'
                : deadline.urgency === 'soon'
                  ? 'warning'
                  : deadline.urgency === 'past'
                    ? 'neutral'
                    : 'success'
            }
          >
            {deadline.label}
          </Badge>
          {scholarship.benefitAmount !== null && (
            <Badge tone="brand">Up to {formatCurrency(scholarship.benefitAmount)}</Badge>
          )}
          <Badge tone="neutral">{scholarship.state ?? 'All India'}</Badge>
        </div>
      </header>

      {isClosed && (
        <Alert tone="warning" className="mt-6" title="This scholarship has closed">
          The deadline has passed for this cycle. Most government scholarships reopen annually, so
          it is worth checking the official portal for next year's dates.
        </Alert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="About this scholarship" />
            <div className="p-4 sm:p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {scholarship.description}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Who can apply" />
            <div className="p-4 sm:p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {scholarship.criteria}
              </p>

              {(scholarship.eligibleLevels.length > 0 || scholarship.eligibleStreams.length > 0) && (
                <dl className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
                  {scholarship.eligibleLevels.length > 0 && (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Education levels</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {scholarship.eligibleLevels.map((level) => (
                          <Badge key={level} tone="neutral">
                            {EDUCATION_LABELS[level]}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                  {scholarship.eligibleStreams.length > 0 && (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Streams</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {scholarship.eligibleStreams.map((stream) => (
                          <Badge key={stream} tone="neutral">
                            {STREAM_LABELS[stream]}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <dl className="space-y-3 text-sm">
              {scholarship.applicationStartDate && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Opens</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(scholarship.applicationStartDate)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Deadline</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(scholarship.deadline)}
                </dd>
              </div>
              {scholarship.benefitDescription && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Benefit</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {scholarship.benefitDescription}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 space-y-2">
              <ButtonLink to={scholarship.url} external fullWidth>
                Apply on official portal
              </ButtonLink>

              {isAuthenticated ? (
                application ? (
                  <div className="rounded-lg border border-slate-200 p-3 text-center dark:border-slate-800">
                    <Badge colorClass={APPLICATION_STATUS_STYLES[application.status]}>
                      {titleCase(application.status)}
                    </Badge>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Tracked since {formatDate(application.appliedAt)}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={isClosed}
                    loading={track.isPending}
                    onClick={() => track.mutate(scholarship.id)}
                  >
                    Track this application
                  </Button>
                )
              ) : (
                <ButtonLink to="/login" variant="secondary" fullWidth>
                  Sign in to track
                </ButtonLink>
              )}

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  fullWidth
                  loading={toggleBookmark.isPending}
                  onClick={() =>
                    toggleBookmark.mutate({ entityId: scholarship.id, isBookmarked: false })
                  }
                >
                  Save for later
                </Button>
              )}
            </div>

            {track.isError && (
              <Alert tone="error" className="mt-3">
                {track.error instanceof ApiError
                  ? track.error.message
                  : 'Could not track this application.'}
              </Alert>
            )}
          </Card>

          <p className="text-xs text-slate-500 dark:text-slate-500">
            Tracking here is a personal reminder. It does not submit anything to the provider — you
            still need to apply on the official portal.
          </p>
        </aside>
      </div>
    </div>
  );
}
