import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiDelete, apiGetPage, apiPatch, apiPost, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { COLLEGE_TYPE_LABELS } from '@/lib/format';
import type { College } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, SearchInput, Select } from '@/components/ui/Field';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounced } from '@/hooks/useFilters';
import { slugify } from './format';

interface FormState {
  slug: string;
  name: string;
  type: string;
  affiliation: string;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  website: string;
  email: string;
  phone: string;
  establishedYear: string;
  naacGrade: string;
  hostelAvailable: boolean;
  isActive: boolean;
}

const EMPTY: FormState = {
  slug: '',
  name: '',
  type: 'GOVERNMENT',
  affiliation: '',
  addressLine: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  website: '',
  email: '',
  phone: '',
  establishedYear: '',
  naacGrade: '',
  hostelAvailable: false,
  isActive: true,
};

function toForm(college: College): FormState {
  return {
    ...EMPTY,
    slug: college.slug,
    name: college.name,
    type: college.type,
    affiliation: college.affiliation ?? '',
    city: college.city,
    district: college.district,
    state: college.state,
    establishedYear: college.establishedYear === null ? '' : String(college.establishedYear),
    naacGrade: college.naacGrade ?? '',
    hostelAvailable: college.hostelAvailable,
  };
}

function toPayload(form: FormState) {
  return {
    slug: form.slug,
    name: form.name,
    type: form.type,
    affiliation: form.affiliation || null,
    addressLine: form.addressLine || null,
    city: form.city,
    district: form.district,
    state: form.state,
    pincode: form.pincode || null,
    website: form.website || null,
    email: form.email || null,
    phone: form.phone || null,
    establishedYear: form.establishedYear === '' ? null : Number(form.establishedYear),
    naacGrade: form.naacGrade || null,
    hostelAvailable: form.hostelAvailable,
    isActive: form.isActive,
  };
}

export function CollegeManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);

  const debouncedSearch = useDebounced(search);
  const params = {
    page: String(page),
    pageSize: '10',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const list = useQuery({
    queryKey: ['admin', 'colleges', params],
    queryFn: () => apiGetPage<College>('/colleges', { params }),
    placeholderData: (previous) => previous,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'colleges'] });
    void queryClient.invalidateQueries({ queryKey: ['colleges'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  }

  const save = useMutation({
    mutationFn: (input: { id: string | null; form: FormState }) =>
      input.id
        ? apiPatch(`/admin/colleges/${input.id}`, toPayload(input.form))
        : apiPost('/admin/colleges', toPayload(input.form)),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/colleges/${id}`),
    onSuccess: invalidate,
  });

  if (list.isPending) return <Skeleton className="h-96" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;

  const form = editing?.form;
  const update = (patch: Partial<FormState>) =>
    setEditing((current) => (current ? { ...current, form: { ...current.form, ...patch } } : current));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-sm">
          <SearchInput
            label="Search colleges"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name or city…"
          />
        </div>
        <Button onClick={() => setEditing({ id: null, form: EMPTY })}>Add college</Button>
      </div>

      {editing && form && (
        <Card>
          <CardHeader title={editing.id ? 'Edit college' : 'New college'} />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate(editing);
            }}
            className="space-y-4 p-4 sm:p-5"
          >
            {save.isError && (
              <Alert tone="error">
                {save.error instanceof ApiError ? save.error.message : 'Could not save.'}
                {save.error instanceof ApiError && save.error.fieldErrors.length > 0 && (
                  <ul className="mt-2 list-inside list-disc">
                    {save.error.fieldErrors.map((fieldError) => (
                      <li key={fieldError.field}>
                        {fieldError.field}: {fieldError.message}
                      </li>
                    ))}
                  </ul>
                )}
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                required
                value={form.name}
                onChange={(event) =>
                  update({
                    name: event.target.value,
                    ...(editing.id ? {} : { slug: slugify(event.target.value) }),
                  })
                }
              />
              <Input
                label="Slug"
                required
                hint="Lowercase, hyphenated."
                value={form.slug}
                onChange={(event) => update({ slug: event.target.value })}
              />
              <Select
                label="Type"
                value={form.type}
                options={Object.entries(COLLEGE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                onChange={(event) => update({ type: event.target.value })}
              />
              <Input
                label="Affiliated university"
                value={form.affiliation}
                onChange={(event) => update({ affiliation: event.target.value })}
              />
              <Input
                label="City"
                required
                value={form.city}
                onChange={(event) => update({ city: event.target.value })}
              />
              <Input
                label="District"
                required
                value={form.district}
                onChange={(event) => update({ district: event.target.value })}
              />
              <Input
                label="State"
                required
                value={form.state}
                onChange={(event) => update({ state: event.target.value })}
              />
              <Input
                label="Pincode"
                inputMode="numeric"
                value={form.pincode}
                onChange={(event) => update({ pincode: event.target.value })}
              />
              <Input
                label="Website"
                type="url"
                value={form.website}
                onChange={(event) => update({ website: event.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => update({ email: event.target.value })}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => update({ phone: event.target.value })}
              />
              <Input
                label="Established year"
                type="number"
                min={1800}
                max={2100}
                value={form.establishedYear}
                onChange={(event) => update({ establishedYear: event.target.value })}
              />
              <Input
                label="NAAC grade"
                placeholder="A++, A+, A, B++…"
                value={form.naacGrade}
                onChange={(event) => update({ naacGrade: event.target.value })}
              />
            </div>

            <Input
              label="Address"
              value={form.addressLine}
              onChange={(event) => update({ addressLine: event.target.value })}
            />

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.hostelAvailable}
                onChange={(event) => update({ hostelAvailable: event.target.checked })}
                className="size-4 rounded accent-brand-700"
              />
              Hostel available
            </label>

            <div className="flex gap-2">
              <Button type="submit" loading={save.isPending}>
                {editing.id ? 'Save changes' : 'Create college'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {list.data.data.length === 0 ? (
        <EmptyState title="No colleges match" />
      ) : (
        <ul className="space-y-2">
          {list.data.data.map((college) => (
            <li key={college.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{college.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {college.city}, {college.district}, {college.state}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="brand">{COLLEGE_TYPE_LABELS[college.type] ?? college.type}</Badge>
                    <Badge tone="neutral">{college._count.courses} courses</Badge>
                    {college.naacGrade && <Badge tone="success">NAAC {college.naacGrade}</Badge>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing({ id: college.id, form: toForm(college) })}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deactivate.isPending}
                    onClick={() => deactivate.mutate(college.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={list.data.meta} itemLabel="colleges" onPageChange={setPage} />

      <p className="text-xs text-slate-500 dark:text-slate-500">
        Editing a college here does not change which courses it offers. Course offerings, seats and
        fees are managed per college through the API and are not yet exposed in this panel.
      </p>
    </div>
  );
}
