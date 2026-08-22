import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { STREAM_LABELS, formatDate } from '@/lib/format';
import type { Roadmap, RoadmapStage, RoadmapStep, StepStatus } from '@/lib/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge, Card, PageHeader, ProgressBar } from '@/components/ui/Surface';
import { Alert, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/Feedback';

const STAGE_LABELS: Record<RoadmapStage, string> = {
  CURRENT: 'Right now',
  NEXT_EXAM: 'Exams ahead',
  STREAM_CHOICE: 'Choosing a stream',
  DEGREE: 'Degree and admissions',
  HIGHER_STUDY: 'Higher study',
  CAREER: 'Career',
};

const STATUS_ACTIONS: { value: StepStatus; label: string }[] = [
  { value: 'PENDING', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'SKIPPED', label: 'Skip' },
];

function StepCard({
  step,
  isLast,
  onStatusChange,
  isUpdating,
}: {
  step: RoadmapStep;
  isLast: boolean;
  onStatusChange: (status: StepStatus) => void;
  isUpdating: boolean;
}) {
  const done = step.status === 'DONE';
  const skipped = step.status === 'SKIPPED';

  return (
    <li className="relative pl-10">
      {/* Connector line, hidden on the last item so the timeline ends cleanly. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-8 h-full w-px bg-slate-200 dark:bg-slate-800"
        />
      )}

      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-1 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold',
          done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : step.status === 'IN_PROGRESS'
              ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
              : 'border-slate-300 bg-surface text-slate-400 dark:border-slate-700 dark:bg-slate-900',
        )}
      >
        {done ? '✓' : step.displayOrder + 1}
      </span>

      <Card className={cn('p-4', skipped && 'opacity-60')}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{STAGE_LABELS[step.stage]}</Badge>
          {step.targetDate && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target: {formatDate(step.targetDate)}
            </span>
          )}
        </div>

        <h3
          className={cn(
            'mt-2 text-base font-semibold text-slate-900 dark:text-slate-100',
            (done || skipped) && 'line-through decoration-slate-400',
          )}
        >
          {step.title}
        </h3>

        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{step.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_ACTIONS.filter((action) => action.value !== step.status).map((action) => (
            <Button
              key={action.value}
              variant={action.value === 'DONE' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isUpdating}
              onClick={() => onStatusChange(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </Card>
    </li>
  );
}

export default function RoadmapPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.roadmap,
    queryFn: () => apiGet<{ roadmap: Roadmap | null }>('/roadmap/current'),
  });

  const regenerate = useMutation({
    mutationFn: () => apiPost('/roadmap/generate', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roadmap });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const updateStep = useMutation({
    mutationFn: (input: { stepId: string; status: StepStatus }) =>
      apiPatch(`/roadmap/steps/${input.stepId}`, { status: input.status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roadmap });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  if (isPending) return <LoadingBlock label="Loading your roadmap…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const roadmap = data.roadmap;

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Your roadmap" />
        <EmptyState
          title="No roadmap yet"
          description="Finish the aptitude quiz and we will build a step-by-step plan from your result, adjusted for the class you are in."
          action={<ButtonLink to="/quiz">Take the quiz</ButtonLink>}
        />
      </div>
    );
  }

  const steps = roadmap.steps;
  const completed = steps.filter((step) => step.status === 'DONE').length;
  const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={roadmap.title}
        description={roadmap.summary ?? undefined}
        action={
          <Button variant="secondary" loading={regenerate.isPending} onClick={() => regenerate.mutate()}>
            Regenerate
          </Button>
        }
      />

      {regenerate.isError && (
        <Alert tone="error" className="mb-6">
          Could not regenerate. Make sure you have completed the quiz, then try again.
        </Alert>
      )}

      <Card className="mb-8 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {completed} of {steps.length} steps done
            </p>
            {roadmap.stream && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                Based on {STREAM_LABELS[roadmap.stream]} · created {formatDate(roadmap.createdAt)}
              </p>
            )}
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {progress}%
          </p>
        </div>
        <ProgressBar value={progress} label="Roadmap progress" />
      </Card>

      <ol className="space-y-5">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            isLast={index === steps.length - 1}
            isUpdating={updateStep.isPending}
            onStatusChange={(status) => updateStep.mutate({ stepId: step.id, status })}
          />
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
        Regenerating replaces this roadmap with a new one based on your latest quiz result and
        profile. Earlier roadmaps are kept in your history.
      </p>
    </div>
  );
}
