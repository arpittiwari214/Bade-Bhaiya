import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGetPage, apiGet, apiPatch } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { STREAM_LABELS, formatDate, formatRelative, titleCase } from '@/lib/format';
import type { AdminStats, QueryStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui/Surface';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: QueryStatus;
  createdAt: string;
}

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'users', label: 'Users' },
  { value: 'queries', label: 'Support queue' },
] as const;

type Tab = (typeof TABS)[number]['value'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">{sub}</p>}
    </Card>
  );
}

function Overview() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: () => apiGet<AdminStats>('/admin/stats'),
  });

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const totalQuizzes = data.streamBreakdown.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={data.users.total}
          sub={`+${data.users.newLast30Days} in the last 30 days`}
        />
        <StatCard
          label="Active scholarships"
          value={data.content.activeScholarships}
          sub={`${data.content.scholarships} listed in total`}
        />
        <StatCard label="Colleges" value={data.content.colleges} />
        <StatCard label="Completed quizzes" value={data.engagement.completedQuizzes} />
        <StatCard label="Applications tracked" value={data.engagement.applications} />
        <StatCard label="Open support queries" value={data.engagement.openQueries} />
        <StatCard
          label="Average rating"
          value={data.engagement.averageRating ?? '—'}
          sub={`${data.engagement.feedbackCount} responses`}
        />
      </div>

      <Card>
        <CardHeader
          title="Recommended streams"
          description="Distribution across completed quiz attempts."
        />

        <div className="space-y-3 p-4 sm:p-5">
          {totalQuizzes === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No completed quizzes yet.
            </p>
          ) : (
            data.streamBreakdown.map((row) => {
              const percent = Math.round((row.count / totalQuizzes) * 100);

              return (
                <div key={row.stream ?? 'none'}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {row.stream ? STREAM_LABELS[row.stream] : 'Not determined'}
                    </span>
                    <span className="tabular-nums text-slate-500 dark:text-slate-400">
                      {row.count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function Users() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');

  const params = { page: String(page), pageSize: '20', ...(role ? { role } : {}) };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => apiGetPage<AdminUser>('/admin/users', { params }),
    placeholderData: (previous) => previous,
  });

  const setStatus = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      apiPatch(`/admin/users/${input.id}/status`, { isActive: input.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  if (isPending) return <Skeleton className="h-96" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select
          label="Filter by role"
          placeholder="All roles"
          value={role}
          options={[
            { value: 'STUDENT', label: 'Student' },
            { value: 'PARENT', label: 'Parent' },
            { value: 'MENTOR', label: 'Mentor' },
            { value: 'ADMIN', label: 'Admin' },
          ]}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card className="overflow-hidden">
        {/* Horizontal scroll rather than a squeezed table on narrow screens. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="p-3 font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th scope="col" className="p-3 font-medium text-slate-700 dark:text-slate-300">Role</th>
                <th scope="col" className="p-3 font-medium text-slate-700 dark:text-slate-300">Joined</th>
                <th scope="col" className="p-3 font-medium text-slate-700 dark:text-slate-300">Last login</th>
                <th scope="col" className="p-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.data.map((user) => (
                <tr key={user.id}>
                  <td className="p-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </td>
                  <td className="p-3">
                    <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>
                      {titleCase(user.role)}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {user.lastLoginAt ? formatRelative(user.lastLoginAt) : 'Never'}
                  </td>
                  <td className="p-3">
                    <Button
                      variant={user.isActive ? 'ghost' : 'secondary'}
                      size="sm"
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: user.id, isActive: !user.isActive })}
                    >
                      {user.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination meta={data.meta} itemLabel="users" onPageChange={setPage} />
    </div>
  );
}

function SupportQueue() {
  const [page, setPage] = useState(1);
  const [status, setStatusFilter] = useState('OPEN');

  const params = { page: String(page), pageSize: '20', ...(status ? { status } : {}) };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminQueries(params),
    queryFn: () => apiGetPage<ContactQuery>('/admin/contact-queries', { params }),
    placeholderData: (previous) => previous,
  });

  const updateStatus = useMutation({
    mutationFn: (input: { id: string; status: QueryStatus }) =>
      apiPatch(`/admin/contact-queries/${input.id}`, { status: input.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'contact-queries'] }),
  });

  if (isPending) return <Skeleton className="h-96" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select
          label="Filter by status"
          placeholder="All statuses"
          value={status}
          options={[
            { value: 'OPEN', label: 'Open' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'RESOLVED', label: 'Resolved' },
            { value: 'CLOSED', label: 'Closed' },
          ]}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {data.data.length === 0 ? (
        <EmptyState title="Nothing in this queue" />
      ) : (
        <ul className="space-y-3">
          {data.data.map((query) => (
            <li key={query.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {query.subject}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {query.name} · {query.email} · {formatRelative(query.createdAt)}
                    </p>
                  </div>
                  <Badge tone={query.status === 'OPEN' ? 'warning' : 'neutral'}>
                    {titleCase(query.status)}
                  </Badge>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                  {query.message}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(['IN_PROGRESS', 'RESOLVED', 'CLOSED'] as QueryStatus[])
                    .filter((option) => option !== query.status)
                    .map((option) => (
                      <Button
                        key={option}
                        variant="secondary"
                        size="sm"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: query.id, status: option })}
                      >
                        Mark {titleCase(option).toLowerCase()}
                      </Button>
                    ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={data.meta} itemLabel="queries" onPageChange={setPage} />
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Platform statistics, user management and the support queue."
      />

      <div role="tablist" aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((option) => (
          <button
            key={option.value}
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === option.value
                ? 'bg-brand-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <Users />}
      {tab === 'queries' && <SupportQueue />}
    </div>
  );
}
