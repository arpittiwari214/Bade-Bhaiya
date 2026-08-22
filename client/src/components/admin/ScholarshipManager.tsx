import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiDelete, apiGetPage, apiPatch, apiPost, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { EDUCATION_LABELS, STREAM_LABELS, formatCurrency, formatDate } from '@/lib/format';
import type { EducationLevel, Scholarship, StreamCode } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Badge, Card, CardHeader } from '@/components/ui/Surface';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { CheckboxGroup } from './shared';
import { slugify, toDateInput } from './format';

const STREAMS: StreamCode[] = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'];
const LEVELS: EducationLevel[] = [
  'CLASS_9',
  'CLASS_10',
  'CLASS_11',
  'CLASS_12',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'OTHER',
];

interface FormState {
  slug: string;
  title: string;
  provider: string;
  description: string;
  criteria: string;
  benefitAmount: string;
  benefitDescription: string;
  applicationStartDate: string;
  deadline: string;
  url: string;
  state: string;
  eligibleStreams: string[];
  eligibleLevels: string[];
  isActive: boolean;
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  provider: '',
  description: '',
  criteria: '',
  benefitAmount: '',
  benefitDescription: '',
  applicationStartDate: '',
  deadline: '',
  url: '',
  state: '',
  eligibleStreams: [],
  eligibleLevels: [],
  isActive: true,
};

function toForm(scholarship: Scholarship): FormState {
  return {
    slug: scholarship.slug,
    title: scholarship.title,
    provider: scholarship.provider,
    description: scholarship.description,
    criteria: scholarship.criteria,
    benefitAmount: scholarship.benefitAmount === null ? '' : String(scholarship.benefitAmount),
    benefitDescription: scholarship.benefitDescription ?? '',
    applicationStartDate: toDateInput(scholarship.applicationStartDate),
    deadline: toDateInput(scholarship.deadline),
    url: scholarship.url,
    state: scholarship.state ?? '',
    eligibleStreams: scholarship.eligibleStreams,
    eligibleLevels: scholarship.eligibleLevels,
    isActive: true,
  };
}

/**
 * Builds the request body. The server schemas are strict, so only known keys
 * may be sent, and empty optional strings become null rather than '' which
 * would fail url and date validation.
 */
function toPayload(form: FormState) {
  return {
    slug: form.slug,
    title: form.title,
    provider: form.provider,
    description: form.description,
    criteria: form.criteria,
    benefitAmount: form.benefitAmount === '' ? null : Number(form.benefitAmount),
    benefitDescription: form.benefitDescription || null,
    applicationStartDate: form.applicationStartDate || null,
    deadline: form.deadline,
    url: form.url,
    state: form.state || null,
    eligibleStreams: form.eligibleStreams,
    eligibleLevels: form.eligibleLevels,
    isActive: form.isActive,
  };
}

export function ScholarshipManager() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);

  const params = { page: String(page), pageSize: '10', includeExpired: 'true', sort: 'deadline' };

  const list = useQuery({
    queryKey: ['admin', 'scholarships', params],
    queryFn: () => apiGetPage<Scholarship>('/scholarships', { params }),
    placeholderData: (previous) => previous,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'scholarships'] });
    void queryClient.invalidateQueries({ queryKey: ['scholarships'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  }

  const save = useMutation({
    mutationFn: (input: { id: string | null; form: FormState }) =>
      input.id
        ? apiPatch(`/admin/scholarships/${input.id}`, toPayload(input.form))
        : apiPost('/admin/scholarships', toPayload(input.form)),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/scholarships/${id}`),
    onSuccess: invalidate,
  });

  if (list.isPending) return <Skeleton className="h-96" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;

  const form = editing?.form;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ id: null, form: EMPTY })}>Add scholarship</Button>
      </div>

      {editing && form && (
        <Card>
          <CardHeader title={editing.id ? 'Edit scholarship' : 'New scholarship'} />

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
                onChange={(event) => {
                  const title = event.target.value;
                  setEditing((current) =>
                    current
                      ? {
                          ...current,
                          form: {
                            ...current.form,
                            title,
                            // Slug follows the title only while creating; changing
                            // it later would break existing links.
                            slug: current.id ? current.form.slug : slugify(title),
                          },
                        }
                      : current,
                  );
                }}
              />
              <Input
                label="Slug"
                required
                hint="Lowercase, hyphenated. Used in the URL."
                value={form.slug}
                onChange={(event) =>
                  setEditing((c) => (c ? { ...c, form: { ...c.form, slug: event.target.value } } : c))
                }
              />
              <Input
                label="Provider"
                required
                value={form.provider}
                onChange={(event) =>
                  setEditing((c) => (c ? { ...c, form: { ...c.form, provider: event.target.value } } : c))
                }
              />
              <Input
                label="Official URL"
                type="url"
                required
                value={form.url}
                onChange={(event) =>
                  setEditing((c) => (c ? { ...c, form: { ...c.form, url: event.target.value } } : c))
                }
              />
              <Input
                label="Opens on"
                type="date"
                value={form.applicationStartDate}
                onChange={(event) =>
                  setEditing((c) =>
                    c ? { ...c, form: { ...c.form, applicationStartDate: event.target.value } } : c,
                  )
                }
              />
              <Input
                label="Deadline"
                type="date"
                required
                value={form.deadline}
                onChange={(event) =>
                  setEditing((c) => (c ? { ...c, form: { ...c.form, deadline: event.target.value } } : c))
                }
              />
              <Input
                label="Benefit amount (₹)"
                type="number"
                min={0}
                value={form.benefitAmount}
                onChange={(event) =>
                  setEditing((c) =>
                    c ? { ...c, form: { ...c.form, benefitAmount: event.target.value } } : c,
                  )
                }
              />
              <Input
                label="State"
                hint="Leave blank for an all-India scholarship."
                value={form.state}
                onChange={(event) =>
                  setEditing((c) => (c ? { ...c, form: { ...c.form, state: event.target.value } } : c))
                }
              />
            </div>

            <Input
              label="Benefit description"
              value={form.benefitDescription}
              onChange={(event) =>
                setEditing((c) =>
                  c ? { ...c, form: { ...c.form, benefitDescription: event.target.value } } : c,
                )
              }
            />

            <Textarea
              label="Description"
              required
              rows={3}
              value={form.description}
              onChange={(event) =>
                setEditing((c) => (c ? { ...c, form: { ...c.form, description: event.target.value } } : c))
              }
            />

            <Textarea
              label="Eligibility criteria"
              required
              rows={3}
              value={form.criteria}
              onChange={(event) =>
                setEditing((c) => (c ? { ...c, form: { ...c.form, criteria: event.target.value } } : c))
              }
            />

            <CheckboxGroup
              legend="Eligible streams"
              hint="Leave all unchecked to make it open to every stream."
              options={STREAMS.map((code) => ({ value: code, label: STREAM_LABELS[code] }))}
              selected={form.eligibleStreams}
              onChange={(eligibleStreams) =>
                setEditing((c) => (c ? { ...c, form: { ...c.form, eligibleStreams } } : c))
              }
            />

            <CheckboxGroup
              legend="Eligible levels"
              hint="Leave all unchecked to make it open to every level."
              options={LEVELS.map((level) => ({ value: level, label: EDUCATION_LABELS[level] }))}
              selected={form.eligibleLevels}
              onChange={(eligibleLevels) =>
                setEditing((c) => (c ? { ...c, form: { ...c.form, eligibleLevels } } : c))
              }
            />

            <div className="flex gap-2">
              <Button type="submit" loading={save.isPending}>
                {editing.id ? 'Save changes' : 'Create scholarship'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {list.data.data.length === 0 ? (
        <EmptyState title="No scholarships listed yet" />
      ) : (
        <ul className="space-y-2">
          {list.data.data.map((scholarship) => (
            <li key={scholarship.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {scholarship.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {scholarship.provider} · closes {formatDate(scholarship.deadline)} ·{' '}
                    {formatCurrency(scholarship.benefitAmount)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">{scholarship.state ?? 'All India'}</Badge>
                    {new Date(scholarship.deadline) < new Date() && (
                      <Badge tone="warning">Closed</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing({ id: scholarship.id, form: toForm(scholarship) })}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deactivate.isPending}
                    onClick={() => deactivate.mutate(scholarship.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={list.data.meta} itemLabel="scholarships" onPageChange={setPage} />
    </div>
  );
}

