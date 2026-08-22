import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';

/** Mirrors the server's policy so the user is told before the request is sent. */
const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(100),
    email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(10, 'Use at least 10 characters')
      .max(128)
      .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
        message: 'Include at least one letter and one number',
      }),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'PARENT']),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const registerUser = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT' },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);

    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        ...(values.phone ? { phone: values.phone } : {}),
      });

      // New accounts go straight to onboarding, which collects the class and
      // location that every recommendation depends on.
      navigate('/onboarding', { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not create your account. Please try again.',
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center py-8 sm:py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Free, and takes under a minute. No payment details needed.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-5 rounded-[--radius-card] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {formError && <Alert tone="error">{formError}</Alert>}

        <Select
          label="I am a"
          options={[
            { value: 'STUDENT', label: 'Student' },
            { value: 'PARENT', label: 'Parent or guardian' },
          ]}
          error={errors.role?.message}
          {...register('role')}
        />

        <Input
          label="Full name"
          autoComplete="name"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9876543210"
          hint="Optional. Used only for deadline reminders."
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
