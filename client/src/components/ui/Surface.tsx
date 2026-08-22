import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

const CARD_BASE =
  'rounded-[--radius-card] border border-slate-200 bg-surface shadow-sm ' +
  'dark:border-slate-800 dark:bg-slate-900';

export function Card({
  id,
  className,
  children,
}: {
  /** Allows an in-page anchor target, e.g. /help#contact. */
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={cn(CARD_BASE, className)}>
      {children}
    </div>
  );
}

/** Card that navigates. Rendered as a link so it keyboard-focuses correctly. */
export function CardLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        CARD_BASE,
        'block transition-shadow hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

export function Badge({
  tone = 'neutral',
  colorClass,
  className,
  children,
}: {
  tone?: BadgeTone;
  /** Overrides the tone palette, for per-enum colour maps like EVENT_STYLES. */
  colorClass?: string;
  /** Layout only. Kept separate so it cannot silently clobber the colours. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        colorClass ?? BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
    >
      <div
        className="h-full rounded-full bg-brand-600 transition-[width] duration-500 dark:bg-brand-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
