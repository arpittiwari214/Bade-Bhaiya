import { useQuery } from '@tanstack/react-query';
import { apiGetPage } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatRange } from '@/lib/format';
import type { Career } from '@/lib/types';
import { useDebounced, useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/Field';
import { Badge, CardLink, PageHeader } from '@/components/ui/Surface';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

const DEFAULTS = { search: '', sector: '', page: '1' };

const SECTORS = [
  'Technology',
  'Finance',
  'Government',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Media',
  'Hospitality',
  'Banking',
];

export default function CareersPage() {
  const { filters, setFilter, resetFilters, activeCount } = useFilters(DEFAULTS);
  const debouncedSearch = useDebounced(filters.search);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.sector ? { sector: filters.sector } : {}),
    page: filters.page,
    pageSize: '12',
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.careers(params),
    queryFn: () => apiGetPage<Career>('/catalog/careers', { params }),
    placeholderData: (previous) => previous,
  });

  return (
    <div>
      <PageHeader
        title="Careers"
        description="What each role involves, what qualification it needs, and the salary range to expect. Open one to see which courses lead into it."
      />

      <div className="mb-6 grid gap-3 rounded-[--radius-card] border border-slate-200 bg-surface p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <SearchInput
          label="Search careers"
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by role…"
        />
        <Select
          label="Sector"
          placeholder="All sectors"
          value={filters.sector}
          options={SECTORS.map((sector) => ({ value: sector, label: sector }))}
          onChange={(event) => setFilter('sector', event.target.value)}
        />
      </div>

      {isPending ? (
        <CardSkeleton count={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No careers match that search"
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
            {data.data.map((career) => (
              <CardLink key={career.id} to={`/careers/${career.slug}`} className="flex h-full flex-col p-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {career.title}
                </h2>

                <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {career.description}
                </p>

                <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {formatRange(career.averageSalaryMin, career.averageSalaryMax)} per year
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {career.growthOutlook && (
                    <Badge tone={career.growthOutlook === 'High' ? 'success' : 'neutral'}>
                      {career.growthOutlook} growth
                    </Badge>
                  )}
                  {career.sectors.slice(0, 2).map((sector) => (
                    <Badge key={sector} tone="neutral">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </CardLink>
            ))}
          </div>

          <Pagination
            meta={data.meta}
            itemLabel="careers"
            onPageChange={(page) => setFilter('page', String(page))}
          />
        </>
      )}
    </div>
  );
}
