import type { DegreeType, EducationLevel, StreamCode, TimelineEventType } from './types';

/**
 * Indian numbering: amounts are read as lakhs and crores, so a plain
 * Intl currency format ("₹12,00,000") is less legible than "₹12 L" on a card.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Not listed';
  if (amount === 0) return 'Free';

  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(amount % 10_000_000 === 0 ? 0 : 1)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 1)} L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`;

  return `₹${amount}`;
}

export function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min === null || min === undefined) {
    return max === null || max === undefined ? 'Not listed' : `Up to ${formatCurrency(max)}`;
  }
  if (max === null || max === undefined) return `From ${formatCurrency(min)}`;
  if (min === max) return formatCurrency(min);

  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

/**
 * Deadline urgency in plain words. Students act on "closes in 4 days" far more
 * reliably than on a date they have to compare against today themselves.
 */
export function formatDeadline(value: string | Date | null | undefined): {
  label: string;
  urgency: 'past' | 'urgent' | 'soon' | 'later';
} {
  if (!value) return { label: 'No deadline listed', urgency: 'later' };

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return { label: 'No deadline listed', urgency: 'later' };

  // Compared as calendar days, not elapsed hours. Rounding elapsed time would
  // report a deadline later this evening as "tomorrow", which is exactly the
  // kind of off-by-one that makes someone miss it.
  const startOfDay = (input: Date) =>
    new Date(input.getFullYear(), input.getMonth(), input.getDate()).getTime();

  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / (24 * 60 * 60 * 1000));

  if (days < 0) return { label: `Closed ${formatDate(date)}`, urgency: 'past' };
  if (days === 0) return { label: 'Closes today', urgency: 'urgent' };
  if (days === 1) return { label: 'Closes tomorrow', urgency: 'urgent' };
  if (days <= 7) return { label: `Closes in ${days} days`, urgency: 'urgent' };
  if (days <= 30) return { label: `Closes in ${days} days`, urgency: 'soon' };

  return { label: `Closes ${formatDate(date)}`, urgency: 'later' };
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(date);
}

// ---------------------------------------------------------------------------
// Enum labels
// ---------------------------------------------------------------------------

export const STREAM_LABELS: Record<StreamCode, string> = {
  SCIENCE: 'Science',
  COMMERCE: 'Commerce',
  ARTS: 'Arts & Humanities',
  VOCATIONAL: 'Vocational',
};

/** Tailwind classes per stream, kept together so colour use stays consistent. */
export const STREAM_STYLES: Record<StreamCode, { badge: string; bar: string; ring: string }> = {
  SCIENCE: {
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    bar: 'bg-sky-500',
    ring: 'ring-sky-500',
  },
  COMMERCE: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-500',
  },
  ARTS: {
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
    bar: 'bg-purple-500',
    ring: 'ring-purple-500',
  },
  VOCATIONAL: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    bar: 'bg-orange-500',
    ring: 'ring-orange-500',
  },
};

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  CLASS_9: 'Class 9',
  CLASS_10: 'Class 10',
  CLASS_11: 'Class 11',
  CLASS_12: 'Class 12',
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
  OTHER: 'Other',
};

export const DEGREE_LABELS: Record<DegreeType, string> = {
  DIPLOMA: 'Diploma',
  BACHELOR: "Bachelor's",
  MASTER: "Master's",
  DOCTORATE: 'Doctorate',
  CERTIFICATE: 'Certificate',
};

export const EVENT_LABELS: Record<TimelineEventType, string> = {
  ADMISSION: 'Admission',
  ENTRANCE_EXAM: 'Entrance exam',
  BOARD_EXAM: 'Board exam',
  SCHOLARSHIP: 'Scholarship',
  COUNSELLING: 'Counselling',
  RESULT: 'Result',
};

export const EVENT_STYLES: Record<TimelineEventType, string> = {
  ADMISSION: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  ENTRANCE_EXAM: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  BOARD_EXAM: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  SCHOLARSHIP: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  COUNSELLING: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  RESULT: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
};

export const COLLEGE_TYPE_LABELS: Record<string, string> = {
  GOVERNMENT: 'Government',
  GOVERNMENT_AIDED: 'Government aided',
  AUTONOMOUS: 'Autonomous',
  PRIVATE: 'Private',
};

export const APPLICATION_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SUBMITTED: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  WITHDRAWN: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDuration(years: number): string {
  if (Number.isInteger(years)) return `${years} ${years === 1 ? 'year' : 'years'}`;
  return `${years} years`;
}
