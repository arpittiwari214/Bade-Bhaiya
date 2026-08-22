import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import {
  COLLEGE_TYPE_LABELS,
  DEGREE_LABELS,
  STREAM_STYLES,
  formatCurrency,
  formatDuration,
} from '@/lib/format';
import type { CollegeDetail } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { useBookmarkToggle } from '@/hooks/useBookmark';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { ErrorState, LoadingBlock } from '@/components/ui/Feedback';

export default function CollegeDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const detailKey = queryKeys.college(slug);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: detailKey,
    queryFn: () => apiGet<{ college: CollegeDetail }>(`/colleges/${slug}`),
    enabled: Boolean(slug),
  });

  const toggleBookmark = useBookmarkToggle('COLLEGE', detailKey);

  if (isPending) return <LoadingBlock />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const college = data.college;

  const mapsUrl =
    college.latitude !== null && college.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${college.latitude},${college.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${college.name}, ${college.city}, ${college.state}`,
        )}`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/colleges"
        className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
      >
        ← All colleges
      </Link>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
            {college.name}
          </h1>
          <p className="mt-1.5 text-slate-600 dark:text-slate-400">
            {[college.addressLine, college.city, college.district, college.state, college.pincode]
              .filter(Boolean)
              .join(', ')}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="brand">{COLLEGE_TYPE_LABELS[college.type] ?? college.type}</Badge>
            {college.naacGrade && <Badge tone="success">NAAC {college.naacGrade}</Badge>}
            {college.hostelAvailable && <Badge tone="neutral">Hostel available</Badge>}
            {college.establishedYear && (
              <Badge tone="neutral">Established {college.establishedYear}</Badge>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <Button
            variant={college.isBookmarked ? 'secondary' : 'primary'}
            loading={toggleBookmark.isPending}
            onClick={() =>
              toggleBookmark.mutate({ entityId: college.id, isBookmarked: college.isBookmarked })
            }
          >
            {college.isBookmarked ? 'Saved' : 'Save college'}
          </Button>
        )}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Courses offered"
              description={`${college.courses.length} course${college.courses.length === 1 ? '' : 's'} listed`}
            />

            {college.courses.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                No course details have been published for this college yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {college.courses.map((offering) => (
                  <li key={offering.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/courses/${offering.course.slug}`}
                          className="font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                        >
                          {offering.course.name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {DEGREE_LABELS[offering.course.degreeType]} ·{' '}
                          {formatDuration(offering.course.durationYears)}
                          {offering.medium ? ` · ${offering.medium} medium` : ''}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STREAM_STYLES[offering.course.stream.code].badge
                        }`}
                      >
                        {offering.course.stream.name}
                      </span>
                    </div>

                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div className="flex gap-1.5">
                        <dt className="text-slate-500 dark:text-slate-400">Annual fee:</dt>
                        <dd className="font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(offering.annualFee)}
                        </dd>
                      </div>
                      {offering.seats !== null && (
                        <div className="flex gap-1.5">
                          <dt className="text-slate-500 dark:text-slate-400">Seats:</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">
                            {offering.seats}
                          </dd>
                        </div>
                      )}
                      {offering.cutoffPercentage !== null && (
                        <div className="flex gap-1.5">
                          <dt className="text-slate-500 dark:text-slate-400">Recent cutoff:</dt>
                          <dd className="font-medium text-slate-800 dark:text-slate-200">
                            {offering.cutoffPercentage}%
                          </dd>
                        </div>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Contact" />
            <dl className="space-y-3 p-4 text-sm">
              {college.website && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Website</dt>
                  <dd>
                    <a
                      href={college.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {college.website.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              )}
              {college.phone && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${college.phone}`}
                      className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {college.phone}
                    </a>
                  </dd>
                </div>
              )}
              {college.email && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${college.email}`}
                      className="break-all font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {college.email}
                    </a>
                  </dd>
                </div>
              )}
              {college.affiliation && (
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Affiliated to</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {college.affiliation}
                  </dd>
                </div>
              )}
            </dl>

            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <ButtonLink to={mapsUrl} external variant="secondary" fullWidth size="sm">
                Open in Maps
              </ButtonLink>
            </div>
          </Card>

          <p className="text-xs text-slate-500 dark:text-slate-500">
            Fees, seats and cutoffs are indicative and change each admission cycle. Confirm current
            figures with the college before applying.
          </p>
        </aside>
      </div>
    </div>
  );
}
