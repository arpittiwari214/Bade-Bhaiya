import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300 dark:disabled:bg-brand-900/50',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300',
  accent:
    'bg-accent-500 text-slate-950 hover:bg-accent-400 active:bg-accent-600 disabled:bg-accent-500/50',
};

const SIZES: Record<Size, string> = {
  // Minimum 44px tall at md and lg: these are tap targets on a phone first.
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const BASE =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-70 select-none';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, CommonProps {}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      // Prevents a double submit while a request is in flight.
      disabled={disabled || loading}
      // Announces the pending state to screen readers, which a spinner alone does not.
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends CommonProps {
  to: string;
  className?: string;
  children: React.ReactNode;
  /** Renders an <a> for external destinations instead of a router Link. */
  external?: boolean;
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  fullWidth,
  external,
  className,
  children,
}: ButtonLinkProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {children}
    </Link>
  );
}
