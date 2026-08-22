import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiDelete, apiGetPage } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { APPLICATION_STATUS_STYLES, formatDate, formatDeadline, titleCase } from '@/lib/format';
import type { ScholarshipApplication } from '@/lib/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Card, PageHeader } from '@/components/ui/Surface';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';

export default function ApplicationsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => apiGetPage<ScholarshipApplication>('/scholarships/applications/mine', {
      params: { pageSize: '50' },
    }),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => apiDelete(`/scholarships/applications/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const applications = data.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My applications"
        description="Scholarships you are tracking. Remember that the actual application is submitted on the provider's own portal."
        action={<ButtonLink to="/scholarships" variant="secondary">Find scholarships</ButtonLink>}
      />

      {applications.length === 0 ? (
        <EmptyState
          title="You are not tracking any scholarships"
          description="When you find a scholarship you want to apply for, track it here so the deadline shows on your dashboard."
          action={<ButtonLink to="/scholarships">Browse scholarships</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => {
            const deadline = formatDeadline(application.scholarship.deadline);
            const isWithdrawn = application.status === 'WITHDRAWN';

            return (
              <li key={application.id}>
                <Card className={isWithdrawn ? 'p-4 opacity-60 sm:p-5' : 'p-4 sm:p-5'}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/scholarships/${application.scholarship.slug}`}
                        className="font-semibold text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                      >
                        {application.scholarship.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {application.scholarship.provider}
                      </p>
                    </div>

                    <Badge colorClass={APPLICATION_STATUS_STYLES[application.status]}>
                      {titleCase(application.status)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                    <span
                      className={
                        deadline.urgency === 'urgent'
                          ? 'font-medium text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }
                    >
                      {deadline.label}
                    </span>
                    <span className="text-slate-500 dark:text-slate-500">
                      Tracked {formatDate(application.appliedAt)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink to={application.scholarship.url} external size="sm">
                      Open official portal
                    </ButtonLink>

                    {!isWithdrawn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={withdraw.isPending}
                        onClick={() => withdraw.mutate(application.id)}
                      >
                        Stop tracking
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
