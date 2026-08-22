import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { DEGREE_LABELS, STREAM_STYLES, formatCurrency, formatDuration, formatRange } from '@/lib/format';
import type { CourseDetail } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { useBookmarkToggle } from '@/hooks/useBookmark';
import { Button } from '@/components/ui/Button';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback';

export default function CourseDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const detailKey = queryKeys.course(slug);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: detailKey,
    queryFn: () => apiGet<{ course: CourseDetail }>(`/catalog/courses/${slug}`),
    enabled: Boolean(slug),
  });

  const toggleBookmark = useBookmarkToggle('COURSE', detailKey);

  if (isPending) return <LoadingBlock />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const course = data.course;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/courses" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
        ← All courses
      </Link>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STREAM_STYLES[course.stream.code].badge
            }`}
          >
            {course.stream.name}
          </span>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
            {course.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{DEGREE_LABELS[course.degreeType]}</Badge>
            <Badge tone="neutral">{formatDuration(course.durationYears)}</Badge>
            <Badge tone="brand">
              {formatRange(course.averageFeeMin, course.averageFeeMax)} per year
            </Badge>
          </div>
        </div>

        {isAuthenticated && (
          <Button
            variant="secondary"
            loading={toggleBookmark.isPending}
            onClick={() => toggleBookmark.mutate({ entityId: course.id, isBookmarked: false })}
          >
            Save course
          </Button>
        )}
      </header>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader title="What this course is" />
          <div className="p-4 sm:p-5">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {course.description}
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Eligibility
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{course.eligibility}</p>
            </div>
          </div>
        </Card>

        {/* Course-to-career mapping, ordered by relevance. */}
        <Card>
          <CardHeader
            title="Where this course leads"
            description="Roles this degree commonly opens, strongest match first."
          />

          {course.careers.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Career mappings have not been added for this course yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {course.careers.map(({ career, relevance, note }) => (
                <li key={career.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link
                      to={`/careers/${career.slug}`}
                      className="font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                    >
                      {career.title}
                    </Link>
                    <Badge tone={relevance >= 80 ? 'success' : relevance >= 60 ? 'brand' : 'neutral'}>
                      {relevance >= 80 ? 'Direct route' : relevance >= 60 ? 'Common route' : 'Possible route'}
                    </Badge>
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                    {career.description}
                  </p>

                  {note && (
                    <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{note}</p>
                  )}

                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {formatRange(career.averageSalaryMin, career.averageSalaryMax)} per year
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Colleges offering this course"
            description="Lowest annual fee first."
          />

          {course.collegeCourses.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              No colleges in the directory list this course yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {course.collegeCourses.map((offering) => (
                <li
                  key={offering.college.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/colleges/${offering.college.slug}`}
                      className="font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                    >
                      {offering.college.name}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {offering.college.district}, {offering.college.state}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(offering.annualFee)}
                    </p>
                    {offering.cutoffPercentage !== null && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cutoff {offering.cutoffPercentage}%
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
