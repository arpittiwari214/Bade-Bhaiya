import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiPatch, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { EDUCATION_LABELS, STREAM_LABELS } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { EducationLevel, StreamCode } from '@/lib/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Card, PageHeader } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Feedback';

const LEVELS: EducationLevel[] = [
  'CLASS_9',
  'CLASS_10',
  'CLASS_11',
  'CLASS_12',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'OTHER',
];

const STREAMS: StreamCode[] = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'];

const INTERESTS = [
  'Mathematics',
  'Science experiments',
  'Computers and coding',
  'Business and money',
  'Reading and writing',
  'History and politics',
  'Art and design',
  'Helping people',
  'Building and repairing',
  'Sports',
  'Teaching',
  'Healthcare',
];

const schema = z.object({
  educationLevel: z.enum(LEVELS as [EducationLevel, ...EducationLevel[]]),
  currentStream: z.string().optional(),
  boardName: z.string().trim().max(100).optional(),
  schoolName: z.string().trim().max(200).optional(),
  state: z.string().trim().min(1, 'Enter your state').max(100),
  district: z.string().trim().min(1, 'Enter your district').max(100),
  city: z.string().trim().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const level = watch('educationLevel');
  // Stream only applies once a student has actually chosen one.
  const streamApplies = level === 'CLASS_11' || level === 'CLASS_12' || level === 'UNDERGRADUATE';

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length >= 8
          ? current
          : [...current, interest],
    );
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setFormError(null);

    try {
      await apiPatch('/profile/me', {
        educationLevel: values.educationLevel,
        currentStream: streamApplies && values.currentStream ? values.currentStream : null,
        boardName: values.boardName || null,
        schoolName: values.schoolName || null,
        state: values.state,
        district: values.district,
        city: values.city || null,
        interests,
        onboardingCompleted: true,
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });

      navigate('/quiz');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not save your profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Tell us where you are"
        description="This decides which colleges, scholarships and deadlines you see. It takes about a minute and you can change it later."
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Your education
          </h2>

          <Select
            label="Which class are you in?"
            required
            placeholder="Select your class"
            options={LEVELS.map((value) => ({ value, label: EDUCATION_LABELS[value] }))}
            error={errors.educationLevel?.message}
            {...register('educationLevel')}
          />

          {streamApplies && (
            <Select
              label="Which stream are you in?"
              placeholder="Not decided yet"
              hint="Leave blank if you have not chosen one."
              options={STREAMS.map((value) => ({ value, label: STREAM_LABELS[value] }))}
              {...register('currentStream')}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Board" placeholder="CBSE, ICSE, State board…" {...register('boardName')} />
            <Input label="School or college" placeholder="Optional" {...register('schoolName')} />
          </div>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Where you live
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Used to show colleges near you and state-specific scholarships.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="State" required error={errors.state?.message} {...register('state')} />
            <Input
              label="District"
              required
              error={errors.district?.message}
              {...register('district')}
            />
          </div>

          <Input label="City or town" placeholder="Optional" {...register('city')} />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            What interests you?
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pick up to eight. Optional, but it improves your recommendations.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = interests.includes(interest);

              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    selected
                      ? 'bg-brand-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
            {interests.length} of 8 selected
          </p>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} size="lg">
            Save and take the quiz
          </Button>
          <ButtonLink to="/dashboard" variant="ghost">
            Skip for now
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
