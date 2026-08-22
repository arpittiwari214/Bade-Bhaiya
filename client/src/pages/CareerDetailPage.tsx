import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { DEGREE_LABELS, STREAM_STYLES, formatDuration, formatRange } from '@/lib/format';
import type { CareerDetail } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { useBookmarkToggle } from '@/hooks/useBookmark';
import { Button } from '@/components/ui/Button';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback';

export default function CareerDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const detailKey = queryKeys.career(slug);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: detailKey,
    queryFn: () => apiGet<{ career: CareerDetail }>(`/catalog/careers/${slug}`),
    enabled: Boolean(slug),
  });

  const toggleBookmark = useBookmarkToggle('CAREER', detailKey);

  if (isPending) return <LoadingBlock />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const career = data.career;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/careers" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
        ← All careers
      </Link>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
            {career.title}
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-800 dark:text-slate-200">
            {formatRange(career.averageSalaryMin, career.averageSalaryMax)} per year
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {career.growthOutlook && (
              <Badge tone={career.growthOutlook === 'High' ? 'success' : 'neutral'}>
                {career.growthOutlook} growth
              </Badge>
            )}
            {career.sectors.map((sector) => (
              <Badge key={sector} tone="neutral">
                {sector}
              </Badge>
            ))}
          </div>
        </div>

        {isAuthenticated && (
          <Button
            variant="secondary"
            loading={toggleBookmark.isPending}
            onClick={() => toggleBookmark.mutate({ entityId: career.id, isBookmarked: false })}
          >
            Save career
          </Button>
        )}
      </header>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader title="What the work involves" />
          <div className="p-4 sm:p-5">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {career.description}
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Qualification needed
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {career.educationRequired}
              </p>
            </div>
          </div>
        </Card>

        {/* Reverse mapping: which courses lead here. */}
        <Card>
          <CardHeader
            title="How to get here"
            description="Courses that lead into this role, most direct route first."
          />

          {career.courses.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Course mappings have not been added for this career yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {career.courses.map(({ course, relevance, note }) => (
                <li key={course.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/courses/${course.slug}`}
                        className="font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                      >
                        {course.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {DEGREE_LABELS[course.degreeType]} · {formatDuration(course.durationYears)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STREAM_STYLES[course.stream.code].badge
                      }`}
                    >
                      {course.stream.name}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {course.eligibility}
                  </p>

                  {note && (
                    <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{note}</p>
                  )}

                  <Badge
                    tone={relevance >= 80 ? 'success' : relevance >= 60 ? 'brand' : 'neutral'}
                    className="mt-3"
                  >
                    {relevance >= 80 ? 'Direct route' : relevance >= 60 ? 'Common route' : 'Possible route'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
