import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button } from './Button';

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const ALERT_TONES: Record<AlertTone, string> = {
  info: 'bg-brand-50 text-brand-900 border-brand-200 dark:bg-brand-950/50 dark:text-brand-100 dark:border-brand-900',
  success:
    'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100 dark:border-emerald-900',
  warning:
    'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-900',
  error:
    'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-100 dark:border-rose-900',
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      // Errors and warnings interrupt; info and success are announced politely.
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border p-3.5 text-sm', ALERT_TONES[tone], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-1')}>{children}</div>}
    </div>
  );
}

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-block', className)}>
      <svg className="size-full animate-spin text-brand-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
      </svg>
    </span>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
      <Spinner className="size-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)}
    />
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-[--radius-card] border border-slate-200 p-4 dark:border-slate-800"
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <Skeleton className="mt-4 h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[--radius-card] border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
      {icon && <div className="mb-3 text-slate-400 dark:text-slate-500">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * Turns a thrown error into something a student can act on. Network and server
 * faults offer a retry; anything else shows the server's message, which is
 * already written for end users.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error instanceof ApiError ? error : null;
  const canRetry = onRetry && (!apiError || apiError.isTransient);

  return (
    <div className="rounded-[--radius-card] border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/40">
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-100">
        {apiError?.status === 404 ? 'Not found' : 'Something went wrong'}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-rose-800 dark:text-rose-200">
        {apiError?.message ?? 'Please try again in a moment.'}
      </p>
      {canRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
