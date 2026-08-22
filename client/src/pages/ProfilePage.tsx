import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiGet, apiPatch, apiPost, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { EDUCATION_LABELS, STREAM_LABELS, formatDate } from '@/lib/format';
import type { EducationLevel, Profile, StreamCode } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Card, CardHeader, PageHeader } from '@/components/ui/Surface';
import { Alert, ErrorState, LoadingBlock } from '@/components/ui/Feedback';

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

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  bio: z.string().trim().max(1000).optional(),
  educationLevel: z.string().optional(),
  currentStream: z.string().optional(),
  boardName: z.string().trim().max(100).optional(),
  schoolName: z.string().trim().max(200).optional(),
  state: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(10, 'Use at least 10 characters')
      .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
        message: 'Include at least one letter and one number',
      }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function PasswordSection() {
  const logout = useAuthStore((state) => state.logout);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordValues) {
    setMessage(null);

    try {
      await apiPost('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      reset();
      setMessage({
        tone: 'success',
        text: 'Password updated. You will be signed out of all devices in a moment.',
      });

      // The server revokes every session on a password change, so the local
      // one has to end too rather than sitting on a dead token.
      setTimeout(() => void logout(), 2500);
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof ApiError ? error.message : 'Could not update your password.',
      });
    }
  }

  return (
    <Card>
      <CardHeader
        title="Password"
        description="Changing your password signs you out everywhere else."
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4 sm:p-5">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

/**
 * Revokes every refresh token for the account. The recovery step if a device
 * is lost or a session is suspected stolen, without needing a password change.
 */
function SessionsSection() {
  const logout = useAuthStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);

  const signOutEverywhere = useMutation({
    mutationFn: () => apiPost('/auth/logout-all'),
    onSuccess: () => void logout(),
    onError: (mutationError) =>
      setError(
        mutationError instanceof ApiError
          ? mutationError.message
          : 'Could not sign out other devices.',
      ),
  });

  return (
    <Card>
      <CardHeader
        title="Signed-in devices"
        description="Ends every session, including this one."
      />

      <div className="space-y-4 p-4 sm:p-5">
        {error && <Alert tone="error">{error}</Alert>}

        <p className="text-sm text-slate-600 dark:text-slate-400">
          If you signed in on a shared or lost device, sign out everywhere and then sign back in
          here.
        </p>

        <Button
          variant="secondary"
          loading={signOutEverywhere.isPending}
          onClick={() => signOutEverywhere.mutate()}
        >
          Sign out of all devices
        </Button>
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const setUser = useAuthStore((state) => state.setUser);
  const [saved, setSaved] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiGet<{ profile: Profile }>('/profile/me'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  // Populates the form once the profile arrives; react-hook-form defaults are
  // captured at mount, so they cannot be set from async data directly.
  useEffect(() => {
    if (!data) return;

    const profile = data.profile;
    reset({
      name: profile.user.name,
      bio: profile.bio ?? '',
      educationLevel: profile.educationLevel ?? '',
      currentStream: profile.currentStream ?? '',
      boardName: profile.boardName ?? '',
      schoolName: profile.schoolName ?? '',
      state: profile.state ?? '',
      district: profile.district ?? '',
      city: profile.city ?? '',
      pincode: profile.pincode ?? '',
    });
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (values: ProfileValues) =>
      apiPatch<{ profile: Profile }>('/profile/me', {
        name: values.name,
        bio: values.bio || null,
        educationLevel: values.educationLevel || null,
        currentStream: values.currentStream || null,
        boardName: values.boardName || null,
        schoolName: values.schoolName || null,
        state: values.state || null,
        district: values.district || null,
        city: values.city || null,
        pincode: values.pincode || null,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });

      // Keeps the name in the navbar in sync without a full reload.
      setUser({
        id: result.profile.user.id,
        name: result.profile.user.name,
        email: result.profile.user.email,
        phone: result.profile.user.phone,
        role: result.profile.user.role,
        emailVerified: true,
        createdAt: result.profile.user.createdAt,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isPending) return <LoadingBlock />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        description={`Member since ${formatDate(data.profile.user.createdAt)}`}
      />

      <Card>
        <CardHeader title="Your details" />

        <form
          onSubmit={handleSubmit((values) => save.mutate(values))}
          noValidate
          className="space-y-5 p-4 sm:p-5"
        >
          {saved && <Alert tone="success">Profile saved.</Alert>}
          {save.isError && (
            <Alert tone="error">
              {save.error instanceof ApiError ? save.error.message : 'Could not save your profile.'}
            </Alert>
          )}

          <Input label="Full name" required error={errors.name?.message} {...register('name')} />

          <Input label="Email" value={data.profile.user.email} disabled readOnly />

          <Textarea
            label="About you"
            rows={3}
            placeholder="Optional"
            error={errors.bio?.message}
            {...register('bio')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Class"
              placeholder="Not set"
              options={LEVELS.map((value) => ({ value, label: EDUCATION_LABELS[value] }))}
              {...register('educationLevel')}
            />
            <Select
              label="Stream"
              placeholder="Not set"
              options={STREAMS.map((value) => ({ value, label: STREAM_LABELS[value] }))}
              {...register('currentStream')}
            />
            <Input label="Board" {...register('boardName')} />
            <Input label="School or college" {...register('schoolName')} />
            <Input label="State" {...register('state')} />
            <Input label="District" {...register('district')} />
            <Input label="City" {...register('city')} />
            <Input
              label="Pincode"
              inputMode="numeric"
              error={errors.pincode?.message}
              {...register('pincode')}
            />
          </div>

          <Button type="submit" loading={isSubmitting || save.isPending}>
            Save changes
          </Button>
        </form>
      </Card>

      <PasswordSection />
      <SessionsSection />
    </div>
  );
}
