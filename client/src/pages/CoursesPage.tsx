import { useQuery } from '@tanstack/react-query';
import { apiGetPage } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { DEGREE_LABELS, STREAM_LABELS, STREAM_STYLES, formatDuration, formatRange } from '@/lib/format';
import type { Course, DegreeType, StreamCode } from '@/lib/types';
import { useDebounced, useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/Field';
import { Badge, CardLink, PageHeader } from '@/components/ui/Surface';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

const DEFAULTS = { search: '', stream: '', degreeType: '', sort: 'name', page: '1' };

const STREAM_OPTIONS = (['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'] as StreamCode[]).map(
  (code) => ({ value: code, label: STREAM_LABELS[code] }),
);

const DEGREE_OPTIONS = (
  ['CERTIFICATE', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE'] as DegreeType[]
).map((type) => ({ value: type, label: DEGREE_LABELS[type] }));

export default function CoursesPage() {
  const { filters, setFilter, resetFilters, activeCount } = useFilters(DEFAULTS);
  const debouncedSearch = useDebounced(filters.search);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.stream ? { stream: filters.stream } : {}),
    ...(filters.degreeType ? { degreeType: filters.degreeType } : {}),
    sort: filters.sort,
    page: filters.page,
    pageSize: '12',
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.courses(params),
    queryFn: () => apiGetPage<Course>('/catalog/courses', { params }),
    placeholderData: (previous) => previous,
  });

  return (
    <div>
      <PageHeader
        title="Courses"
        description="What each degree covers, who can apply, what it typically costs, and where it leads."
      />

      <div className="mb-6 space-y-3 rounded-[--radius-card] border border-slate-200 bg-surface p-4 dark:border-slate-800 dark:bg-slate-900">
        <SearchInput
          label="Search courses"
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by course name…"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Stream"
            placeholder="All streams"
            value={filters.stream}
            options={STREAM_OPTIONS}
            onChange={(event) => setFilter('stream', event.target.value)}
          />
          <Select
            label="Qualification"
            placeholder="All types"
            value={filters.degreeType}
            options={DEGREE_OPTIONS}
            onChange={(event) => setFilter('degreeType', event.target.value)}
          />
          <Select
            label="Sort by"
            value={filters.sort}
            options={[
              { value: 'name', label: 'Name (A–Z)' },
              { value: 'duration', label: 'Shortest first' },
              { value: 'fee', label: 'Lowest fee first' },
            ]}
            onChange={(event) => setFilter('sort', event.target.value)}
          />
        </div>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isPending ? (
        <CardSkeleton count={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title="No courses match those filters" action={<Button variant="secondary" onClick={resetFilters}>Clear filters</Button>} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((course) => (
              <CardLink key={course.id} to={`/courses/${course.slug}`} className="flex h-full flex-col p-5">
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STREAM_STYLES[course.stream.code].badge
                  }`}
                >
                  {course.stream.name}
                </span>

                <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {course.shortName ?? course.name}
                </h2>

                <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {course.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">{DEGREE_LABELS[course.degreeType]}</Badge>
                  <Badge tone="neutral">{formatDuration(course.durationYears)}</Badge>
                  <Badge tone="brand">{formatRange(course.averageFeeMin, course.averageFeeMax)}</Badge>
                </div>
              </CardLink>
            ))}
          </div>

          <Pagination
            meta={data.meta}
            itemLabel="courses"
            onPageChange={(page) => setFilter('page', String(page))}
          />
        </>
      )}
    </div>
  );
}
