import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler, sendData } from '../../lib/http';
import { cuidSchema } from '../../lib/pagination';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as roadmapService from './roadmap.service';

const router = Router();

router.post(
  '/generate',
  requireAuth,
  validate({ body: z.object({ attemptId: cuidSchema.optional() }).strict() }),
  asyncHandler(async (req, res) => {
    const { attemptId } = req.body as { attemptId?: string };
    const roadmap = await roadmapService.generateRoadmap(req.user!.id, attemptId);
    sendData(res, { roadmap }, 201);
  }),
);

router.get(
  '/current',
  requireAuth,
  asyncHandler(async (req, res) => {
    const roadmap = await roadmapService.getCurrentRoadmap(req.user!.id);
    sendData(res, { roadmap });
  }),
);

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        stream: true,
        isCurrent: true,
        createdAt: true,
        _count: { select: { steps: true } },
      },
    });

    sendData(res, { roadmaps });
  }),
);

router.patch(
  '/steps/:stepId',
  requireAuth,
  validate({
    params: z.object({ stepId: cuidSchema }),
    body: z.object({ status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED']) }).strict(),
  }),
  asyncHandler(async (req, res) => {
    const { stepId } = req.params as { stepId: string };
    const { status } = req.body as { status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' };

    const step = await roadmapService.updateStepStatus(req.user!.id, stepId, status);
    sendData(res, { step });
  }),
);

export default router;
