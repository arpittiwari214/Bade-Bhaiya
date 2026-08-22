import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import {
  APPLICATION_STATUS_STYLES,
  EDUCATION_LABELS,
  EVENT_LABELS,
  EVENT_STYLES,
  STREAM_LABELS,
  formatDate,
  formatDeadline,
  titleCase,
} from '@/lib/format';
import type { DashboardData } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, Card, CardHeader, ProgressBar } from '@/components/ui/Surface';
import { Alert, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback';

function StatTile({ label, value, to }: { label: string; value: string | number; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-[--radius-card] border border-slate-200 bg-surface p-4 transition-colors hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
    >
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiGet<DashboardData>('/dashboard'),
  });

  if (isPending) return <LoadingBlock label="Loading your dashboard…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const firstName = (data.profile?.user.name ?? user?.name ?? '').split(' ')[0] || 'there';
  const savedTotal = Object.values(data.bookmarks).reduce((sum, count) => sum + (count ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
          Hello, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {data.profile?.educationLevel
            ? `${EDUCATION_LABELS[data.profile.educationLevel]}${
                data.profile.district ? ` · ${data.profile.district}` : ''
              }`
            : 'Complete your profile to get recommendations that fit where you are.'}
        </p>
      </header>

      {/* The two things that unblock everything else. */}
      {!data.profile?.onboardingCompleted && (
        <Alert tone="info" title="Finish setting up your profile">
          Your class and district decide which colleges, scholarships and deadlines you see.
          <div className="mt-3">
            <ButtonLink to="/onboarding" size="sm">
              Complete profile
            </ButtonLink>
          </div>
        </Alert>
      )}

      {!data.quiz.hasCompleted && (
        <Alert tone="warning" title="You have not taken the quiz yet">
          Twelve questions is all it takes to get a recommended stream and a personalised roadmap.
          <div className="mt-3">
            <ButtonLink to="/quiz" size="sm">
              Take the quiz
            </ButtonLink>
          </div>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Saved items" value={savedTotal} to="/saved" />
        <StatTile label="Applications" value={data.applications.length} to="/applications" />
        <StatTile label="Upcoming dates" value={data.upcomingEvents.length} to="/timeline" />
        <StatTile label="Unread alerts" value={data.unreadNotifications} to="/notifications" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Roadmap progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Your roadmap"
              description={data.roadmap ? data.roadmap.title : 'Not generated yet'}
              action={
                data.roadmap && (
                  <ButtonLink to="/roadmap" variant="secondary" size="sm">
                    Open
                  </ButtonLink>
                )
              }
            />

            <div className="p-4 sm:p-5">
              {data.roadmap ? (
                <>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {data.roadmap.completedSteps} of {data.roadmap.totalSteps} steps done
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {data.roadmap.progress}%
                    </span>
                  </div>
                  <ProgressBar value={data.roadmap.progress} label="Roadmap progress" />

                  {data.roadmap.nextStep && (
                    <div className="mt-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-400">
                        Next step
                      </p>
                      <p className="mt-1.5 font-medium text-slate-900 dark:text-slate-100">
                        {data.roadmap.nextStep.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {data.roadmap.nextStep.description}
                      </p>
                      {data.roadmap.nextStep.targetDate && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                          Target: {formatDate(data.roadmap.nextStep.targetDate)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No roadmap yet"
                  description="Take the aptitude quiz and we will build a step-by-step plan from your results."
                  action={<ButtonLink to="/quiz">Take the quiz</ButtonLink>}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming dates */}
        <Card>
          <CardHeader
            title="Coming up"
            action={
              <ButtonLink to="/timeline" variant="ghost" size="sm">
                All
              </ButtonLink>
            }
          />

          <div className="p-4">
            {data.upcomingEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Nothing in the next 60 days.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <Badge colorClass={EVENT_STYLES[event.type]}>{EVENT_LABELS[event.type]}</Badge>
                    <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(event.startDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Applications */}
      <Card>
        <CardHeader
          title="Scholarship applications"
          action={
            <ButtonLink to="/scholarships" variant="secondary" size="sm">
              Find more
            </ButtonLink>
          }
        />

        <div className="p-4 sm:p-5">
          {data.applications.length === 0 ? (
            <EmptyState
              title="No applications tracked"
              description="Track the scholarships you are applying for so you never miss a deadline."
              action={<ButtonLink to="/scholarships">Browse scholarships</ButtonLink>}
            />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.applications.map((application) => {
                const deadline = formatDeadline(application.scholarship.deadline);

                return (
                  <li key={application.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/scholarships/${application.scholarship.slug}`}
                        className="truncate font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                      >
                        {application.scholarship.title}
                      </Link>
                      <p
                        className={
                          deadline.urgency === 'urgent'
                            ? 'text-xs font-medium text-rose-600 dark:text-rose-400'
                            : 'text-xs text-slate-500 dark:text-slate-400'
                        }
                      >
                        {deadline.label}
                      </p>
                    </div>

                    <Badge colorClass={APPLICATION_STATUS_STYLES[application.status]}>
                      {titleCase(application.status)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {data.quiz.latestAttempt?.recommendedStream && (
        <Card className="p-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your quiz recommended{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {STREAM_LABELS[data.quiz.latestAttempt.recommendedStream]}
            </span>{' '}
            on {formatDate(data.quiz.latestAttempt.completedAt)}.{' '}
            <Link
              to={`/quiz/result/${data.quiz.latestAttempt.id}`}
              className="font-medium text-brand-700 hover:underline dark:text-brand-400"
            >
              See the full result
            </Link>
          </p>
        </Card>
      )}
    </div>
  );
}
