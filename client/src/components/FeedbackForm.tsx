import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';

interface FeedbackSummary {
  averageRating: number | null;
  totalResponses: number;
  distribution: { rating: number; count: number }[];
}

const CATEGORIES = [
  { value: 'quiz', label: 'The aptitude quiz' },
  { value: 'colleges', label: 'College directory' },
  { value: 'scholarships', label: 'Scholarships' },
  { value: 'roadmap', label: 'My roadmap' },
  { value: 'accuracy', label: 'Incorrect information' },
  { value: 'other', label: 'Something else' },
];

const RATING_LABELS = ['', 'Not useful', 'Slightly useful', 'Useful', 'Very useful', 'Excellent'];

/** Accessible star rating built from radio inputs rather than clickable icons. */
function RatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        How useful was this?
        <span className="ml-0.5 text-rose-600 dark:text-rose-400" aria-hidden="true">
          *
        </span>
      </legend>

      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            onMouseEnter={() => setHovered(star)}
            className="cursor-pointer p-0.5"
            title={RATING_LABELS[star]}
          >
            <input
              type="radio"
              name="rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <span className="sr-only">
              {star} out of 5, {RATING_LABELS[star]}
            </span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={cn(
                'size-8 transition-colors',
                star <= shown ? 'text-accent-500' : 'text-slate-300 dark:text-slate-700',
              )}
              fill="currentColor"
            >
              <path d="m12 17.27-5.18 3.13 1.37-5.89-4.56-3.95 6.01-.51L12 4.5l2.36 5.55 6.01.51-4.56 3.95 1.37 5.89z" />
            </svg>
          </label>
        ))}

        {shown > 0 && (
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            {RATING_LABELS[shown]}
          </span>
        )}
      </div>
    </fieldset>
  );
}

export function FeedbackSummaryBar() {
  const { data } = useQuery({
    queryKey: queryKeys.feedbackSummary,
    queryFn: () => apiGet<FeedbackSummary>('/feedback/summary'),
    staleTime: 10 * 60 * 1000,
  });

  if (!data || data.totalResponses === 0 || data.averageRating === null) return null;

  return (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      <span className="font-semibold text-slate-900 dark:text-slate-100">
        {data.averageRating} / 5
      </span>{' '}
      from {data.totalResponses} {data.totalResponses === 1 ? 'response' : 'responses'}
    </p>
  );
}

export function FeedbackForm() {
  const location = useLocation();

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiPost('/feedback', {
        rating,
        message: message.trim(),
        ...(category ? { category } : {}),
        pageUrl: location.pathname,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedbackSummary });
      setSent(true);
      setRating(0);
      setCategory('');
      setMessage('');
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError(null);

    if (rating === 0) {
      setValidationError('Please choose a rating.');
      return;
    }
    if (message.trim().length < 3) {
      setValidationError('Please tell us a little more.');
      return;
    }

    submit.mutate();
  }

  if (sent) {
    return (
      <Alert tone="success" title="Thanks for the feedback">
        We read every response. It genuinely shapes what gets built next.
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => setSent(false)}>
            Send more feedback
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {validationError && <Alert tone="error">{validationError}</Alert>}
      {submit.isError && (
        <Alert tone="error">
          {submit.error instanceof ApiError
            ? submit.error.message
            : 'Could not send your feedback. Please try again.'}
        </Alert>
      )}

      <RatingInput value={rating} onChange={setRating} />

      <Select
        label="What is this about?"
        placeholder="Choose a topic (optional)"
        value={category}
        options={CATEGORIES}
        onChange={(event) => setCategory(event.target.value)}
      />

      <Textarea
        label="Your feedback"
        required
        rows={4}
        maxLength={2000}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What worked, what did not, or what information was wrong?"
        hint="Do not include passwords, ID numbers or other personal details."
      />

      <Button type="submit" loading={submit.isPending}>
        Send feedback
      </Button>
    </form>
  );
}
