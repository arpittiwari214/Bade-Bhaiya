import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Where the user was heading before the guard redirected them here.
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  async function onSubmit(values: FormValues) {
    setFormError(null);

    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not sign you in. Please try again.',
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center py-8 sm:py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to see your roadmap, saved colleges and scholarship deadlines.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-5 rounded-[--radius-card] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            Create a free account
          </Link>
        </p>
      </form>
    </div>
  );
}
