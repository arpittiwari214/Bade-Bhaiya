import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGetPage, apiPatch, apiPost, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { EVENT_LABELS, EVENT_STYLES, formatDate } from '@/lib/format';
import type { TimelineEvent, TimelineEventType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { slugify, toDateInput } from './format';

const TYPES: TimelineEventType[] = [
  'ADMISSION',
  'ENTRANCE_EXAM',
  'BOARD_EXAM',
  'SCHOLARSHIP',
  'COUNSELLING',
  'RESULT',
];

interface FormState {
  slug: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  url: string;
  state: string;
  isNational: boolean;
  isActive: boolean;
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  description: '',
  type: 'ADMISSION',
  startDate: '',
  endDate: '',
  url: '',
  state: '',
  isNational: true,
  isActive: true,
};

function toForm(event: TimelineEvent): FormState {
  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    type: event.type,
    startDate: toDateInput(event.startDate),
    endDate: toDateInput(event.endDate),
    url: event.url ?? '',
    state: event.state ?? '',
    isNational: event.isNational,
    isActive: true,
  };
}

function toPayload(form: FormState) {
  return {
    slug: form.slug,
    title: form.title,
    description: form.description,
    type: form.type,
    startDate: form.startDate,
    endDate: form.endDate || null,
    url: form.url || null,
    state: form.state || null,
    isNational: form.isNational,
    isActive: form.isActive,
  };
}

export function TimelineManager() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);

  const params = { page: String(page), pageSize: '10', includePast: 'true' };

  const list = useQuery({
    queryKey: ['admin', 'timeline', params],
    queryFn: () => apiGetPage<TimelineEvent>('/timeline', { params }),
    placeholderData: (previous) => previous,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'timeline'] });
    void queryClient.invalidateQueries({ queryKey: ['timeline'] });
  }

  const save = useMutation({
    mutationFn: (input: { id: string | null; form: FormState }) =>
      input.id
        ? apiPatch(`/admin/timeline-events/${input.id}`, toPayload(input.form))
        : apiPost('/admin/timeline-events', toPayload(input.form)),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  if (list.isPending) return <Skeleton className="h-96" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;

  const form = editing?.form;
  const update = (patch: Partial<FormState>) =>
    setEditing((current) => (current ? { ...current, form: { ...current.form, ...patch } } : current));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ id: null, form: EMPTY })}>Add date</Button>
      </div>

      {editing && form && (
        <Card>
          <CardHeader title={editing.id ? 'Edit date' : 'New date'} />

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
                label="Title"
                required
                value={form.title}
                onChange={(event) =>
                  update({
                    title: event.target.value,
                    ...(editing.id ? {} : { slug: slugify(event.target.value) }),
                  })
                }
              />
              <Input
                label="Slug"
                required
                value={form.slug}
                onChange={(event) => update({ slug: event.target.value })}
              />
              <Select
                label="Type"
                value={form.type}
                options={TYPES.map((type) => ({ value: type, label: EVENT_LABELS[type] }))}
                onChange={(event) => update({ type: event.target.value })}
              />
              <Input
                label="Official URL"
                type="url"
                value={form.url}
                onChange={(event) => update({ url: event.target.value })}
              />
              <Input
                label="Starts"
                type="date"
                required
                value={form.startDate}
                onChange={(event) => update({ startDate: event.target.value })}
              />
              <Input
                label="Ends"
                type="date"
                hint="Leave blank for a single-day event."
                value={form.endDate}
                onChange={(event) => update({ endDate: event.target.value })}
              />
            </div>

            <Textarea
              label="Description"
              required
              rows={3}
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isNational}
                  onChange={(event) =>
                    // A national event applies everywhere, so a state would be
                    // contradictory and is cleared.
                    update({ isNational: event.target.checked, ...(event.target.checked ? { state: '' } : {}) })
                  }
                  className="size-4 rounded accent-brand-700"
                />
                Applies all over India
              </label>

              {!form.isNational && (
                <Input
                  label="State"
                  required
                  value={form.state}
                  onChange={(event) => update({ state: event.target.value })}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={save.isPending}>
                {editing.id ? 'Save changes' : 'Create date'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {list.data.data.length === 0 ? (
        <EmptyState title="No dates listed yet" />
      ) : (
        <ul className="space-y-2">
          {list.data.data.map((event) => (
            <li key={event.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(event.startDate)}
                    {event.endDate ? ` – ${formatDate(event.endDate)}` : ''}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge colorClass={EVENT_STYLES[event.type]}>{EVENT_LABELS[event.type]}</Badge>
                    <Badge tone="neutral">{event.isNational ? 'All India' : event.state}</Badge>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing({ id: event.id, form: toForm(event) })}
                >
                  Edit
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={list.data.meta} itemLabel="dates" onPageChange={setPage} />
    </div>
  );
}
