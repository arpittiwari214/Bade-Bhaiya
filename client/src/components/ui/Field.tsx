import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 ' +
  'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800';

const BORDER_OK = 'border-slate-300 focus:border-brand-600 dark:border-slate-700';
const BORDER_ERROR = 'border-rose-500 focus:border-rose-600 dark:border-rose-500';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean | undefined;
  children: React.ReactNode;
  describedBy: string;
}

function FieldShell({ label, htmlFor, error, hint, required, children, describedBy }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-600 dark:text-rose-400" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={`${describedBy}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}

      {/* role="alert" so the message is announced when validation fails. */}
      {error && (
        <p id={`${describedBy}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, required, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      describedBy={fieldId}
    >
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(CONTROL, error ? BORDER_ERROR : BORDER_OK, className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, id, required, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      describedBy={fieldId}
    >
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(CONTROL, error ? BORDER_ERROR : BORDER_OK, className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, required, rows = 4, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      required={required}
      describedBy={fieldId}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(CONTROL, 'resize-y', error ? BORDER_ERROR : BORDER_OK, className)}
        {...props}
      />
    </FieldShell>
  );
});

/** Standalone search box used by the directory pages. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}) {
  const id = useId();

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 3.4 9.84l3.38 3.38a1 1 0 0 0 1.42-1.42l-3.39-3.38A5.5 5.5 0 0 0 9 3.5ZM5.5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(CONTROL, BORDER_OK, 'pl-9')}
      />
    </div>
  );
}
