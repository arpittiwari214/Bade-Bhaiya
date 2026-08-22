import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import type { QuizAttempt, QuizQuestion } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, PageHeader, ProgressBar } from '@/components/ui/Surface';
import { Alert, ErrorState, LoadingBlock } from '@/components/ui/Feedback';

const CATEGORY_LABELS: Record<string, string> = {
  INTEREST: 'Interest',
  APTITUDE: 'Aptitude',
  PERSONALITY: 'Working style',
};

export default function QuizPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const questionsQuery = useQuery({
    queryKey: queryKeys.quizQuestions,
    queryFn: () => apiGet<{ questions: QuizQuestion[]; total: number }>('/quiz/questions'),
  });

  const questions = useMemo(() => questionsQuery.data?.questions ?? [], [questionsQuery.data]);

  const startAttempt = useMutation({
    mutationFn: () => apiPost<{ attempt: { id: string; resumed: boolean } }>('/quiz/attempts'),
    onSuccess: (data) => setAttemptId(data.attempt.id),
  });

  // Signed-in users get a server-side attempt so answers survive a reload and
  // the result can be scored and saved. Anonymous visitors can still read the
  // questions, but are asked to sign in before submitting.
  useEffect(() => {
    if (isAuthenticated && !attemptId && !startAttempt.isPending) {
      startAttempt.mutate();
    }
    // startAttempt is stable enough for this one-shot kick-off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, attemptId]);

  // Resume: pull back any answers already recorded for this attempt.
  const attemptQuery = useQuery({
    queryKey: queryKeys.quizAttempt(attemptId ?? ''),
    queryFn: () => apiGet<{ attempt: QuizAttempt }>(`/quiz/attempts/${attemptId}`),
    enabled: Boolean(attemptId),
  });

  useEffect(() => {
    const existing = attemptQuery.data?.attempt.answers;
    if (!existing?.length) return;

    setAnswers(Object.fromEntries(existing.map((answer) => [answer.questionId, answer.optionId])));

    // Drop the user at the first unanswered question rather than back at one.
    const answeredIds = new Set(existing.map((answer) => answer.questionId));
    const firstUnanswered = questions.findIndex((question) => !answeredIds.has(question.id));
    setIndex(firstUnanswered === -1 ? Math.max(0, questions.length - 1) : firstUnanswered);
  }, [attemptQuery.data, questions]);

  const saveAnswer = useMutation({
    mutationFn: (input: { questionId: string; optionId: string }) =>
      apiPut(`/quiz/attempts/${attemptId}/answers`, input),
  });

  const complete = useMutation({
    mutationFn: () => apiPost(`/quiz/attempts/${attemptId}/complete`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.quizAttempts });

      // This page already cached the attempt while it was IN_PROGRESS, when
      // `result` was still null. Without invalidating that exact key the
      // results page is served the stale copy and reports the quiz as
      // unfinished. `quizAttempts` (the list) does not prefix-match
      // `quizAttempt(id)`, so it has to be named explicitly.
      if (attemptId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.quizAttempt(attemptId) });
      }

      navigate(`/quiz/result/${attemptId}`);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiError
          ? mutationError.message
          : 'Could not submit your answers. Please try again.',
      );
    },
  });

  if (questionsQuery.isPending) return <LoadingBlock label="Loading the quiz…" />;
  if (questionsQuery.isError) {
    return <ErrorState error={questionsQuery.error} onRetry={() => void questionsQuery.refetch()} />;
  }
  if (questions.length === 0) {
    return (
      <Alert tone="warning" title="The quiz is not available yet">
        No questions have been published. Please check back shortly.
      </Alert>
    );
  }

  const question = questions[index];
  if (!question) return null;

  const selected = answers[question.id];
  const answeredCount = Object.keys(answers).length;
  const isLast = index === questions.length - 1;
  const progress = (answeredCount / questions.length) * 100;

  function choose(optionId: string) {
    if (!question) return;

    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    setError(null);

    // Persist immediately so a dropped connection does not lose progress.
    if (attemptId) {
      saveAnswer.mutate({ questionId: question.id, optionId });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Aptitude and interest quiz"
        description="Twelve questions. There are no right or wrong answers, so pick what is actually true for you."
      />

      {!isAuthenticated && (
        <Alert tone="info" className="mb-6">
          You can read through the questions now, but you will need a free account to save your
          answers and get a result.{' '}
          <ButtonLink to="/register" size="sm" className="mt-2">
            Create an account
          </ButtonLink>
        </Alert>
      )}

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Question {index + 1} of {questions.length}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{answeredCount} answered</span>
        </div>
        <ProgressBar value={progress} label="Quiz progress" />
      </div>

      <Card className="p-5 sm:p-6">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {CATEGORY_LABELS[question.category] ?? question.category}
        </span>

        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          {question.text}
        </h2>

        {question.helpText && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{question.helpText}</p>
        )}

        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">{question.text}</legend>

          {question.options.map((option) => {
            const isSelected = selected === option.id;

            return (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                  isSelected
                    ? 'border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/50'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => choose(option.id)}
                  className="mt-0.5 size-4 shrink-0 accent-brand-700"
                />
                <span className="text-sm text-slate-800 dark:text-slate-200">{option.text}</span>
              </label>
            );
          })}
        </fieldset>

        {error && (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            Back
          </Button>

          {isLast ? (
            <Button
              loading={complete.isPending}
              disabled={!isAuthenticated || answeredCount < questions.length}
              onClick={() => complete.mutate()}
            >
              {answeredCount < questions.length
                ? `${questions.length - answeredCount} left`
                : 'See my result'}
            </Button>
          ) : (
            <Button disabled={!selected} onClick={() => setIndex((value) => value + 1)}>
              Next
            </Button>
          )}
        </div>
      </Card>

      {/* Lets a user jump back to any question they want to change. */}
      <nav aria-label="Jump to question" className="mt-6 flex flex-wrap justify-center gap-2">
        {questions.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(itemIndex)}
            aria-label={`Question ${itemIndex + 1}${answers[item.id] ? ', answered' : ''}`}
            aria-current={itemIndex === index ? 'step' : undefined}
            className={cn(
              'size-8 rounded-lg text-xs font-medium transition-colors',
              itemIndex === index
                ? 'bg-brand-700 text-white'
                : answers[item.id]
                  ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            )}
          >
            {itemIndex + 1}
          </button>
        ))}
      </nav>
    </div>
  );
}
