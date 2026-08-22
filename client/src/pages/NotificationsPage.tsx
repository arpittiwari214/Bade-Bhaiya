import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, apiPatch, apiPost } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Surface';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';

interface NotificationPage {
  data: Notification[];
  meta: { total: number; unreadCount: number };
}

export default function NotificationsPage() {
  const params = { pageSize: '50' };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: async () => {
      // This endpoint adds `unreadCount` to the standard page meta, so the
      // response is read directly rather than through apiGetPage.
      const response = await api.get<NotificationPage>('/notifications', { params });
      return response.data;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiPost('/notifications/read-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const notifications = data.data;
  const unread = data.meta.unreadCount;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : 'You are all caught up.'}
        action={
          unread > 0 ? (
            <Button variant="secondary" loading={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="Deadline reminders and updates about your applications will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => {
            const isUnread = notification.readAt === null;

            return (
              <li key={notification.id}>
                <Card
                  className={cn(
                    'p-4',
                    isUnread && 'border-brand-200 bg-brand-50/40 dark:border-brand-900 dark:bg-brand-950/20',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {isUnread && (
                          <span
                            aria-label="Unread"
                            className="mr-2 inline-block size-2 rounded-full bg-brand-600 align-middle"
                          />
                        )}
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-500">
                        {formatRelative(notification.createdAt)}
                      </p>
                    </div>

                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>

                  {notification.actionUrl && (
                    <Link
                      to={notification.actionUrl}
                      className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                      View
                    </Link>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
