import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler, sendData } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import { roadmapSelect } from '../roadmap/roadmap.service';

const router = Router();

const UPCOMING_WINDOW_DAYS = 60;

/**
 * Everything the personalised dashboard needs in one request. The page would
 * otherwise fire seven separate calls on load, which is slow on the low-bandwidth
 * connections this product targets.
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [
      profile,
      latestAttempt,
      roadmap,
      applications,
      upcomingEvents,
      unreadNotifications,
      bookmarkCounts,
    ] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId },
        select: {
          onboardingCompleted: true,
          educationLevel: true,
          currentStream: true,
          state: true,
          district: true,
          interests: true,
          user: { select: { name: true } },
        },
      }),
      prisma.quizAttempt.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        select: { id: true, scores: true, recommendedStream: true, completedAt: true },
      }),
      prisma.roadmap.findFirst({
        where: { userId, isCurrent: true },
        orderBy: { createdAt: 'desc' },
        select: roadmapSelect,
      }),
      prisma.scholarshipApplication.findMany({
        where: { userId, status: { not: 'WITHDRAWN' } },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          scholarship: { select: { id: true, slug: true, title: true, deadline: true } },
        },
      }),
      prisma.timelineEvent.findMany({
        where: { isActive: true, startDate: { gte: now, lte: windowEnd } },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: { id: true, slug: true, title: true, type: true, startDate: true, endDate: true },
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.bookmark.groupBy({
        by: ['entityType'],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    const steps = roadmap?.steps ?? [];
    const completedSteps = steps.filter((step) => step.status === 'DONE').length;

    // Percent complete drives the progress ring on the dashboard.
    const roadmapProgress =
      steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

    const nextStep = steps.find((step) => step.status !== 'DONE' && step.status !== 'SKIPPED') ?? null;

    sendData(res, {
      profile,
      quiz: {
        hasCompleted: Boolean(latestAttempt),
        latestAttempt,
      },
      roadmap: roadmap
        ? {
            id: roadmap.id,
            title: roadmap.title,
            stream: roadmap.stream,
            totalSteps: steps.length,
            completedSteps,
            progress: roadmapProgress,
            nextStep,
          }
        : null,
      applications,
      upcomingEvents,
      unreadNotifications,
      bookmarks: Object.fromEntries(
        bookmarkCounts.map((row) => [row.entityType, row._count._all]),
      ),
    });
  }),
);

export default router;
