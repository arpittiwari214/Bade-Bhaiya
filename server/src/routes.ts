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

/**
 * Public catalogue counts for the landing page. One small cached query beats
 * the three paginated list calls the page would otherwise make just to read
 * `meta.total`, which matters on the low-bandwidth connections this product
 * targets.
 */
router.get(
  '/api/stats',
  asyncHandler(async (_req, res) => {
    const [colleges, courses, scholarships] = await Promise.all([
      prisma.college.count({ where: { isActive: true } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.scholarship.count({ where: { isActive: true, deadline: { gte: new Date() } } }),
    ]);

    res.set('Cache-Control', 'public, max-age=300');
    res.status(200).json({ data: { colleges, courses, scholarships } });
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
