import { useQuery } from '@tanstack/react-query';
import { apiGetPage, apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { COLLEGE_TYPE_LABELS, STREAM_LABELS } from '@/lib/format';
import type { College, StreamCode } from '@/lib/types';
import { useDebounced, useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/Field';
import { Badge, CardLink, PageHeader } from '@/components/ui/Surface';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

const DEFAULTS = {
  search: '',
  state: '',
  district: '',
  type: '',
  stream: '',
  hostel: '',
  page: '1',
};

const STREAM_OPTIONS = (['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'] as StreamCode[]).map(
  (code) => ({ value: code, label: STREAM_LABELS[code] }),
);

const TYPE_OPTIONS = Object.entries(COLLEGE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

function CollegeCard({ college }: { college: College }) {
  return (
    <CardLink to={`/colleges/${college.slug}`} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {college.name}
        </h2>
        {college.naacGrade && <Badge tone="success">NAAC {college.naacGrade}</Badge>}
      </div>

      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
        {college.city}, {college.district}, {college.state}
      </p>

      {college.affiliation && (
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-500">
          Affiliated to {college.affiliation}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="brand">{COLLEGE_TYPE_LABELS[college.type] ?? college.type}</Badge>
        <Badge tone="neutral">{college._count.courses} courses</Badge>
        {college.hostelAvailable && <Badge tone="neutral">Hostel</Badge>}
        {college.establishedYear && <Badge tone="neutral">Est. {college.establishedYear}</Badge>}
      </div>
    </CardLink>
  );
}

export default function CollegesPage() {
  const { filters, setFilter, resetFilters, activeCount } = useFilters(DEFAULTS);
  const debouncedSearch = useDebounced(filters.search);

  const locationsQuery = useQuery({
    queryKey: queryKeys.collegeLocations,
    queryFn: () => apiGet<{ states: { state: string; districts: string[] }[] }>('/colleges/locations'),
    staleTime: 30 * 60 * 1000,
  });

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.district ? { district: filters.district } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.stream ? { stream: filters.stream } : {}),
    ...(filters.hostel ? { hostel: filters.hostel } : {}),
    page: filters.page,
    pageSize: '12',
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.colleges(params),
    queryFn: () => apiGetPage<College>('/colleges', { params }),
    // Keeps the previous page visible while the next one loads, so the list
    // does not collapse to a spinner on every filter change.
    placeholderData: (previous) => previous,
  });

  const states = locationsQuery.data?.states ?? [];
  const districts = states.find((entry) => entry.state === filters.state)?.districts ?? [];

  return (
    <div>
      <PageHeader
        title="Government colleges"
        description="Filter by district, course and stream to find colleges you can realistically get into and afford."
      />

      <div className="mb-6 space-y-3 rounded-[--radius-card] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <SearchInput
          label="Search colleges"
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by name, city or university…"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="State"
            placeholder="All states"
            value={filters.state}
            options={states.map((entry) => ({ value: entry.state, label: entry.state }))}
            onChange={(event) => {
              setFilter('state', event.target.value);
              // A district from the previous state would exclude every result.
              setFilter('district', '');
            }}
          />

          <Select
            label="District"
            placeholder={filters.state ? 'All districts' : 'Pick a state first'}
            value={filters.district}
            disabled={!filters.state}
            options={districts.map((district) => ({ value: district, label: district }))}
            onChange={(event) => setFilter('district', event.target.value)}
          />

          <Select
            label="Stream offered"
            placeholder="Any stream"
            value={filters.stream}
            options={STREAM_OPTIONS}
            onChange={(event) => setFilter('stream', event.target.value)}
          />

          <Select
            label="College type"
            placeholder="All types"
            value={filters.type}
            options={TYPE_OPTIONS}
            onChange={(event) => setFilter('type', event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={filters.hostel === 'true'}
              onChange={(event) => setFilter('hostel', event.target.checked ? 'true' : '')}
              className="size-4 rounded accent-brand-700"
            />
            Hostel available
          </label>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
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
          title="No colleges match those filters"
          description="Try widening the search: remove the district, or clear the stream filter."
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
          <div
            aria-busy={isFetching}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.data.map((college) => (
              <CollegeCard key={college.id} college={college} />
            ))}
          </div>

          <Pagination
            meta={data.meta}
            itemLabel="colleges"
            onPageChange={(page) => setFilter('page', String(page))}
          />
        </>
      )}
    </div>
  );
}
