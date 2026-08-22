import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { STREAM_LABELS, STREAM_STYLES } from '@/lib/format';
import type { QuizAttempt, StreamCode } from '@/lib/types';
import { downloadCareerReport } from '@/lib/report';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Surface';
import { Alert, ErrorState, LoadingBlock } from '@/components/ui/Feedback';

const STREAM_ORDER: StreamCode[] = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'];

export default function QuizResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.quizAttempt(attemptId ?? ''),
    queryFn: () => apiGet<{ attempt: QuizAttempt }>(`/quiz/attempts/${attemptId}`),
    enabled: Boolean(attemptId),
  });

  const generateRoadmap = useMutation({
    mutationFn: () => apiPost('/roadmap/generate', { attemptId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roadmap });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      navigate('/roadmap');
    },
  });

  if (isPending) return <LoadingBlock label="Working out your result…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const attempt = data.attempt;
  const result = attempt.result;

  if (!result) {
    return (
      <Alert tone="warning" title="This quiz is not finished">
        Go back and answer the remaining questions to see your result.
        <div className="mt-3">
          <ButtonLink to="/quiz" size="sm">
            Continue the quiz
          </ButtonLink>
        </div>
      </Alert>
    );
  }

  const top = result.recommendedStream;
  const ranked = [...STREAM_ORDER].sort((a, b) => result.percentages[b] - result.percentages[a]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Your result"
        description="A starting point based on your answers, not a verdict. You can retake this whenever you want."
      />

      {/* Headline recommendation */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-6 text-center dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Best fit for you</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {STREAM_LABELS[top]}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {result.percentages[top]}% of your answers pointed here
          </p>
        </div>

        <div className="space-y-4 p-6">
          {ranked.map((stream) => (
            <div key={stream}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {STREAM_LABELS[stream]}
                </span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {result.percentages[stream]}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${STREAM_STYLES[stream].bar}`}
                  style={{ width: `${result.percentages[stream]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {result.closeAlternatives.length > 0 && (
        <Alert tone="info" className="mt-6" title="Worth considering too">
          {result.closeAlternatives.map((stream) => STREAM_LABELS[stream]).join(' and ')}{' '}
          {result.closeAlternatives.length === 1 ? 'scored' : 'scored'} close to your top result.
          A narrow gap means either could suit you, so compare the courses before deciding.
        </Alert>
      )}

      {/* Next actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Build your roadmap
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Turn this into a step-by-step plan from where you are now to a career, with target
            dates.
          </p>
          <Button
            className="mt-4"
            loading={generateRoadmap.isPending}
            onClick={() => generateRoadmap.mutate()}
          >
            Generate my roadmap
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Explore {STREAM_LABELS[top]} courses
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            See the degrees this stream opens, what they cost, and where they lead.
          </p>
          <ButtonLink to={`/courses?stream=${top}`} variant="secondary" className="mt-4">
            View courses
          </ButtonLink>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          onClick={() =>
            downloadCareerReport({
              streamLabel: STREAM_LABELS[top],
              percentages: ranked.map((stream) => ({
                label: STREAM_LABELS[stream],
                value: result.percentages[stream],
              })),
              completedAt: attempt.completedAt,
            })
          }
        >
          Download as PDF
        </Button>
        <Link
          to="/quiz"
          className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          Retake the quiz
        </Link>
      </div>

      {generateRoadmap.isError && (
        <Alert tone="error" className="mt-6">
          Could not generate the roadmap. Please try again.
        </Alert>
      )}
    </div>
  );
}
