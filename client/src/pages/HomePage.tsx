import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { STREAM_STYLES, STREAM_LABELS } from '@/lib/format';
import type { Stream } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Surface';
import { Skeleton } from '@/components/ui/Feedback';

const STEPS = [
  {
    title: 'Take the aptitude quiz',
    body: 'Twelve questions about what you enjoy and what you are good at. No right or wrong answers.',
  },
  {
    title: 'Get your stream and courses',
    body: 'See which stream fits you, the degrees it opens, and what each one actually leads to.',
  },
  {
    title: 'Find colleges and scholarships',
    body: 'Filter government colleges by your district and course, and track scholarship deadlines.',
  },
];

const CONCERNS = [
  {
    question: '"Is a degree even worth it?"',
    answer:
      'We show what each course leads to, with salary ranges and the exams involved, so the decision is based on outcomes rather than assumptions.',
  },
  {
    question: '"Government colleges are not good."',
    answer:
      'Many government colleges have decades of results and fees a fraction of private institutions. The directory shows NAAC grades, fees and courses side by side.',
  },
  {
    question: '"I do not know what comes after Class 12."',
    answer:
      'The roadmap lays out every step from where you are now to a career, with target dates you can actually plan around.',
  },
];

function StreamCards() {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.streams,
    queryFn: () => apiGet<{ streams: Stream[] }>('/catalog/streams'),
  });

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
    );
  }

  const streams = data?.streams ?? [];
  if (streams.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {streams.map((stream) => (
        <Link
          key={stream.id}
          to={`/courses?stream=${stream.code}`}
          className="group rounded-[--radius-card] border border-slate-200 bg-surface p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STREAM_STYLES[stream.code].badge}`}
          >
            {STREAM_LABELS[stream.code]}
          </span>
          <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
            {stream.description}
          </p>
          <p className="mt-3 text-sm font-medium text-brand-700 group-hover:underline dark:text-brand-400">
            {stream._count.courses} courses →
          </p>
        </Link>
      ))}
    </div>
  );
}

interface CatalogStats {
  colleges: number;
  courses: number;
  scholarships: number;
}

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiGet<CatalogStats>('/stats'),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-16 pb-8 sm:space-y-24">
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden px-4 pb-4 pt-10 text-center sm:-mx-6 sm:px-6 sm:pt-14 lg:-mx-8 lg:px-8">
        {/*
         * A soft brand wash behind the headline. Without it the hero is a flat
         * expanse of background colour, which reads as an unstyled page rather
         * than a deliberate one. Rendered as a sibling behind relative content
         * so it needs no negative z-index.
         */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(58%_100%_at_50%_0%,var(--color-brand-100),transparent_72%)] dark:bg-[radial-gradient(58%_100%_at_50%_0%,rgba(81,131,206,0.20),transparent_72%)]"
        />

        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-800 dark:border-brand-800/60 dark:bg-brand-950 dark:text-brand-200">
            <span className="size-1.5 rounded-full bg-accent-500" aria-hidden="true" />
            Free guidance for Class 10 and 12 students
          </p>

          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Pick your stream with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              a reason
            </span>
            , not a guess
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Most students choose a stream because of what a relative said or what a friend picked.
            Bade Bhaiya shows you which stream fits your interests, what each degree actually leads
            to, and which government colleges near you offer it.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to={isAuthenticated ? '/dashboard' : '/quiz'} size="lg">
              {isAuthenticated ? 'Go to dashboard' : 'Take the free quiz'}
            </ButtonLink>
            <ButtonLink to="/colleges" variant="secondary" size="lg">
              Browse government colleges
            </ButtonLink>
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            No payment. No spam. Your results stay private to you.
          </p>

          {/* Grounds the claims in the actual catalogue rather than leaving the
              hero to trail off into empty space. Hidden until the counts load
              so the layout does not jump or show placeholder zeros. */}
          {stats && (
            <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-slate-200 pt-8 dark:border-slate-800">
              {[
                { value: stats.colleges, label: 'Government colleges' },
                { value: stats.courses, label: 'Courses mapped' },
                { value: stats.scholarships, label: 'Scholarships open' },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="sr-only">{item.label}</dt>
                  <dd className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50 sm:text-3xl">
                    {item.value}
                  </dd>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    {item.label}
                  </p>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
          Three steps to a decision you can explain
        </h2>

        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full p-5">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Streams */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Explore the four streams
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Each one opens more paths than most people realise.
          </p>
        </div>

        <StreamCards />
      </section>

      {/* Objections */}
      <section>
        <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
          The things families actually worry about
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CONCERNS.map((concern) => (
            <Card key={concern.question} className="p-5">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {concern.question}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{concern.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="rounded-2xl bg-brand-800 px-6 py-12 text-center dark:bg-brand-900">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Start with twelve questions
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-100">
          You will get a recommended stream, the courses that follow from it, and a step-by-step
          roadmap you can share with your parents.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink to="/quiz" variant="accent" size="lg">
            Take the quiz
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
