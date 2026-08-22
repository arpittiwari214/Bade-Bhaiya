import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler, sendData } from '../../lib/http';
import { cuidSchema } from '../../lib/pagination';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as quizService from './quiz.service';

const router = Router();

/**
 * Questions and options for the quiz. `streamWeights` is deliberately not
 * selected: exposing the scoring key would let a user reverse-engineer the
 * result they want rather than answering honestly.
 */
router.get(
  '/questions',
  asyncHandler(async (_req, res) => {
    const questions = await prisma.quizQuestion.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        category: true,
        text: true,
        helpText: true,
        displayOrder: true,
        options: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, text: true, displayOrder: true },
        },
      },
    });

    sendData(res, { questions, total: questions.length });
  }),
);

router.post(
  '/attempts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const attempt = await quizService.startAttempt(req.user!.id);
    sendData(res, { attempt }, attempt.resumed ? 200 : 201);
  }),
);

const answerSchema = z
  .object({
    questionId: cuidSchema,
    optionId: cuidSchema,
  })
  .strict();

router.put(
  '/attempts/:attemptId/answers',
  requireAuth,
  validate({ params: z.object({ attemptId: cuidSchema }), body: answerSchema }),
  asyncHandler(async (req, res) => {
    const { attemptId } = req.params as { attemptId: string };
    const { questionId, optionId } = req.body as z.infer<typeof answerSchema>;

    const answer = await quizService.saveAnswer(req.user!.id, attemptId, questionId, optionId);
    sendData(res, { answer });
  }),
);

router.post(
  '/attempts/:attemptId/complete',
  requireAuth,
  validate({ params: z.object({ attemptId: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { attemptId } = req.params as { attemptId: string };
    const result = await quizService.completeAttempt(req.user!.id, attemptId);

    // Suggested courses for the winning stream give the results page something
    // actionable rather than just a label.
    const suggestedCourses = await prisma.course.findMany({
      where: { isActive: true, stream: { code: result.recommendedStream } },
      orderBy: { name: 'asc' },
      take: 6,
      select: {
        id: true,
        slug: true,
        name: true,
        shortName: true,
        degreeType: true,
        durationYears: true,
      },
    });

    sendData(res, { result, suggestedCourses });
  }),
);

router.get(
  '/attempts/:attemptId',
  requireAuth,
  validate({ params: z.object({ attemptId: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { attemptId } = req.params as { attemptId: string };
    const attempt = await quizService.getAttempt(req.user!.id, attemptId);
    sendData(res, { attempt });
  }),
);

router.get(
  '/attempts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user!.id },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        scores: true,
        recommendedStream: true,
        startedAt: true,
        completedAt: true,
      },
    });

    sendData(res, { attempts });
  }),
);

export default router;
