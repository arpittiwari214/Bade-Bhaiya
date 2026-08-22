import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { titleCase } from '@/lib/format';
import type { Faq } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Card, CardHeader, PageHeader } from '@/components/ui/Surface';
import { FeedbackForm, FeedbackSummaryBar } from '@/components/FeedbackForm';
import { Alert, ErrorState, Skeleton } from '@/components/ui/Feedback';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().min(3, 'Add a subject').max(150),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
});

type ContactValues = z.infer<typeof contactSchema>;

function FaqSection() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.faqs,
    queryFn: () => apiGet<{ faqs: Faq[] }>('/faqs'),
  });

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (data.faqs.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No FAQs published yet.</p>;
  }

  // Grouped so related questions sit together rather than in one long list.
  const grouped = data.faqs.reduce<Record<string, Faq[]>>((accumulator, faq) => {
    (accumulator[faq.category] ??= []).push(faq);
    return accumulator;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, faqs]) => (
        <section key={category}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {titleCase(category)}
          </h3>

          <div className="space-y-2">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <summary className="cursor-pointer list-none p-4 font-medium text-slate-900 marker:hidden dark:text-slate-100">
                  <span className="flex items-center justify-between gap-3">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-slate-400 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <div className="border-t border-slate-200 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(values: ContactValues) {
    setFormError(null);

    try {
      await apiPost('/contact', {
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
        ...(values.phone ? { phone: values.phone } : {}),
      });

      reset();
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not send your message. Please try again.',
      );
    }
  }

  if (sent) {
    return (
      <Alert tone="success" title="Message sent">
        Thanks for getting in touch. We usually reply within two working days.
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => setSent(false)}>
            Send another
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Your name" required error={errors.name?.message} {...register('name')} />
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <Input
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        hint="Optional"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input label="Subject" required error={errors.subject?.message} {...register('subject')} />

      <Textarea
        label="Message"
        required
        rows={5}
        error={errors.message?.message}
        {...register('message')}
      />

      <Button type="submit" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Help and support"
        description="Common questions first. If your question is not answered here, send us a message."
      />

      <div className="space-y-8">
        <FaqSection />

        <Card id="feedback">
          <CardHeader
            title="Share your feedback"
            description="Tell us what helped and what did not."
            action={<FeedbackSummaryBar />}
          />
          <div className="p-4 sm:p-5">
            <FeedbackForm />
          </div>
        </Card>

        <Card id="contact">
          <CardHeader
            title="Contact us"
            description="We read every message. Please do not include passwords or ID numbers."
          />
          <div className="p-4 sm:p-5">
            <ContactForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
