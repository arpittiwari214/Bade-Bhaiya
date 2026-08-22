import { useQuery } from '@tanstack/react-query';
import { apiGetPage } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { EDUCATION_LABELS, STREAM_LABELS, formatCurrency, formatDeadline } from '@/lib/format';
import type { EducationLevel, Scholarship, StreamCode } from '@/lib/types';
import { useDebounced, useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/Field';
import { Badge, CardLink, PageHeader } from '@/components/ui/Surface';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

const DEFAULTS = {
  search: '',
  stream: '',
  level: '',
  state: '',
  includeExpired: '',
  sort: 'deadline',
  page: '1',
};

const STREAM_OPTIONS = (['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'] as StreamCode[]).map(
  (code) => ({ value: code, label: STREAM_LABELS[code] }),
);

const LEVEL_OPTIONS = (
  ['CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12', 'UNDERGRADUATE', 'POSTGRADUATE'] as EducationLevel[]
).map((level) => ({ value: level, label: EDUCATION_LABELS[level] }));

function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  const deadline = formatDeadline(scholarship.deadline);

  const tone =
    deadline.urgency === 'urgent'
      ? 'danger'
      : deadline.urgency === 'soon'
        ? 'warning'
        : deadline.urgency === 'past'
          ? 'neutral'
          : 'success';

  return (
    <CardLink to={`/scholarships/${scholarship.slug}`} className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {scholarship.title}
        </h2>
        <Badge tone={tone}>{deadline.label}</Badge>
      </div>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{scholarship.provider}</p>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
        {scholarship.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {scholarship.benefitAmount !== null && (
          <Badge tone="brand">Up to {formatCurrency(scholarship.benefitAmount)}</Badge>
        )}
        {scholarship.state ? (
          <Badge tone="neutral">{scholarship.state}</Badge>
        ) : (
          <Badge tone="neutral">All India</Badge>
        )}
        {scholarship.eligibleStreams.length > 0 &&
          scholarship.eligibleStreams.map((stream) => (
            <Badge key={stream} tone="neutral">
              {STREAM_LABELS[stream]}
            </Badge>
          ))}
      </div>
    </CardLink>
  );
}

export default function ScholarshipsPage() {
  const { filters, setFilter, resetFilters, activeCount } = useFilters(DEFAULTS);
  const debouncedSearch = useDebounced(filters.search);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.stream ? { stream: filters.stream } : {}),
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.includeExpired ? { includeExpired: 'true' } : {}),
    sort: filters.sort,
    page: filters.page,
    pageSize: '12',
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.scholarships(params),
    queryFn: () => apiGetPage<Scholarship>('/scholarships', { params }),
    placeholderData: (previous) => previous,
  });

  return (
    <div>
      <PageHeader
        title="Scholarships"
        description="Government and institutional scholarships, sorted by which deadline comes first. Applications are submitted on the official portal, which every listing links to."
      />

      <div className="mb-6 space-y-3 rounded-[--radius-card] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <SearchInput
          label="Search scholarships"
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by name or provider…"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Your class"
            placeholder="Any level"
            value={filters.level}
            options={LEVEL_OPTIONS}
            onChange={(event) => setFilter('level', event.target.value)}
          />

          <Select
            label="Stream"
            placeholder="Any stream"
            value={filters.stream}
            options={STREAM_OPTIONS}
            onChange={(event) => setFilter('stream', event.target.value)}
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
              { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
              { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
              { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
            ]}
            onChange={(event) => setFilter('state', event.target.value)}
          />

          <Select
            label="Sort by"
            value={filters.sort}
            options={[
              { value: 'deadline', label: 'Closing soonest' },
              { value: 'amount', label: 'Highest amount' },
              { value: 'title', label: 'Name (A–Z)' },
            ]}
            onChange={(event) => setFilter('sort', event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={filters.includeExpired === 'true'}
              onChange={(event) => setFilter('includeExpired', event.target.checked ? 'true' : '')}
              className="size-4 rounded accent-brand-700"
            />
            Show closed scholarships
          </label>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isPending ? (
        <CardSkeleton count={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No scholarships match those filters"
          description="Try clearing the stream or state filter. Scholarships with no stream restriction are open to everyone."
          action={
            activeCount > 0 ? (
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>

          <Pagination
            meta={data.meta}
            itemLabel="scholarships"
            onPageChange={(page) => setFilter('page', String(page))}
          />
        </>
      )}
    </div>
  );
}
