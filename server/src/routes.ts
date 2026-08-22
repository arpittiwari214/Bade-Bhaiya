import { Router } from 'express';
import { prisma } from './lib/prisma';
import { asyncHandler } from './lib/http';
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import collegeRoutes from './modules/colleges/colleges.routes';
import scholarshipRoutes from './modules/scholarships/scholarships.routes';
import quizRoutes from './modules/quiz/quiz.routes';
import roadmapRoutes from './modules/roadmap/roadmap.routes';
import timelineRoutes from './modules/timeline/timeline.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import engagementRoutes from './modules/engagement/engagement.routes';
import adminRoutes from './modules/admin/admin.routes';

const router = Router();

/** Liveness: the process is up. Used by the container orchestrator. */
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

/**
 * Readiness: the process can serve traffic, which requires the database.
 * Separated from liveness so a database blip restarts nothing.
 */
router.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready', database: 'up' });
    } catch {
      res.status(503).json({ status: 'not-ready', database: 'down' });
    }
  }),
);

router.use('/api/auth', authRoutes);
router.use('/api/profile', profileRoutes);
router.use('/api/catalog', catalogRoutes);
router.use('/api/colleges', collegeRoutes);
router.use('/api/scholarships', scholarshipRoutes);
router.use('/api/quiz', quizRoutes);
router.use('/api/roadmap', roadmapRoutes);
router.use('/api/timeline', timelineRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api', engagementRoutes);
router.use('/api/admin', adminRoutes);

export default router;
