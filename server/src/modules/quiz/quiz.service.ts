import type { StreamCode } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';

export const STREAM_CODES: StreamCode[] = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'];

export type StreamScores = Record<StreamCode, number>;

function emptyScores(): StreamScores {
  return { SCIENCE: 0, COMMERCE: 0, ARTS: 0, VOCATIONAL: 0 };
}

/**
 * `streamWeights` is authored JSON, so it is validated per key rather than
 * trusted. An unknown key or non-numeric value contributes nothing instead of
 * corrupting the totals with NaN.
 */
function accumulate(scores: StreamScores, weights: unknown): void {
  if (typeof weights !== 'object' || weights === null || Array.isArray(weights)) return;

  for (const code of STREAM_CODES) {
    const raw = (weights as Record<string, unknown>)[code];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      scores[code] += raw;
    }
  }
}

export interface QuizResult {
  scores: StreamScores;
  /** Percentage of the total points earned, per stream. Sums to 100. */
  percentages: StreamScores;
  recommendedStream: StreamCode;
  /** Streams within 10 percentage points of the winner, worth showing as alternatives. */
  closeAlternatives: StreamCode[];
  answeredCount: number;
}

export function scoreAnswers(
  answers: { streamWeights: unknown }[],
): Omit<QuizResult, 'answeredCount'> {
  const scores = emptyScores();
  for (const answer of answers) {
    accumulate(scores, answer.streamWeights);
  }

  const total = STREAM_CODES.reduce((sum, code) => sum + Math.max(0, scores[code]), 0);

  const percentages = emptyScores();
  for (const code of STREAM_CODES) {
    percentages[code] = total > 0 ? Math.round((Math.max(0, scores[code]) / total) * 1000) / 10 : 0;
  }

  // Ties resolve by the fixed STREAM_CODES order, which keeps results stable
  // across repeated reads of the same attempt.
  let recommendedStream: StreamCode = 'SCIENCE';
  let best = -Infinity;
  for (const code of STREAM_CODES) {
    if (scores[code] > best) {
      best = scores[code];
      recommendedStream = code;
    }
  }

  const winnerPct = percentages[recommendedStream];
  const closeAlternatives = STREAM_CODES.filter(
    (code) => code !== recommendedStream && winnerPct - percentages[code] <= 10,
  );

  return { scores, percentages, recommendedStream, closeAlternatives };
}

export async function startAttempt(userId: string) {
  // Reuse an in-progress attempt so a refresh mid-quiz does not lose answers.
  const existing = await prisma.quizAttempt.findFirst({
    where: { userId, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
    select: { id: true, startedAt: true },
  });

  if (existing) return { ...existing, resumed: true };

  const attempt = await prisma.quizAttempt.create({
    data: { userId, status: 'IN_PROGRESS' },
    select: { id: true, startedAt: true },
  });

  return { ...attempt, resumed: false };
}

export async function saveAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  optionId: string,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, status: true },
  });

  if (!attempt || attempt.userId !== userId) throw new NotFoundError('Quiz attempt');
  if (attempt.status !== 'IN_PROGRESS') {
    throw new BadRequestError('This quiz attempt has already been completed');
  }

  // The option must belong to the question, otherwise a caller could submit a
  // high-scoring option from a different question.
  const option = await prisma.quizOption.findUnique({
    where: { id: optionId },
    select: { id: true, questionId: true },
  });

  if (!option || option.questionId !== questionId) {
    throw new BadRequestError('The selected option does not belong to that question');
  }

  return prisma.quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, optionId },
    update: { optionId, answeredAt: new Date() },
    select: { id: true, questionId: true, optionId: true },
  });
}

export async function completeAttempt(userId: string, attemptId: string): Promise<QuizResult> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      status: true,
      answers: { select: { option: { select: { streamWeights: true } } } },
    },
  });

  if (!attempt || attempt.userId !== userId) throw new NotFoundError('Quiz attempt');

  const activeQuestions = await prisma.quizQuestion.count({ where: { isActive: true } });
  if (attempt.answers.length < activeQuestions) {
    throw new BadRequestError(
      `Please answer all questions. ${attempt.answers.length} of ${activeQuestions} answered.`,
    );
  }

  const result = scoreAnswers(attempt.answers.map((a) => ({ streamWeights: a.option.streamWeights })));

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      scores: result.scores,
      recommendedStream: result.recommendedStream,
    },
  });

  return { ...result, answeredCount: attempt.answers.length };
}

export async function getAttempt(userId: string, attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      status: true,
      scores: true,
      recommendedStream: true,
      startedAt: true,
      completedAt: true,
      answers: {
        select: {
          questionId: true,
          optionId: true,
          option: { select: { streamWeights: true } },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) throw new NotFoundError('Quiz attempt');

  const scored = scoreAnswers(attempt.answers.map((a) => ({ streamWeights: a.option.streamWeights })));

  return {
    id: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    answers: attempt.answers.map((a) => ({ questionId: a.questionId, optionId: a.optionId })),
    result: attempt.status === 'COMPLETED' ? { ...scored, answeredCount: attempt.answers.length } : null,
  };
}
