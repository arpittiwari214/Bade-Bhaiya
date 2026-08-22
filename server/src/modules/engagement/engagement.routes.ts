import { Router } from 'express';
import { z } from 'zod';
import type { BookmarkEntity, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { asyncHandler, sendData } from '../../lib/http';
import { cuidSchema, paginationSchema, toPrismaPage } from '../../lib/pagination';
import { optionalAuth, requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimit';

const router = Router();

const bookmarkEntities = ['COLLEGE', 'SCHOLARSHIP', 'COURSE', 'CAREER'] as const;

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

const bookmarkSchema = z
  .object({
    entityType: z.enum(bookmarkEntities),
    entityId: cuidSchema,
  })
  .strict();

/** Confirms the target exists before saving, so bookmarks cannot dangle. */
async function assertEntityExists(entityType: BookmarkEntity, entityId: string): Promise<boolean> {
  switch (entityType) {
    case 'COLLEGE':
      return Boolean(await prisma.college.findUnique({ where: { id: entityId }, select: { id: true } }));
    case 'SCHOLARSHIP':
      return Boolean(
        await prisma.scholarship.findUnique({ where: { id: entityId }, select: { id: true } }),
      );
    case 'COURSE':
      return Boolean(await prisma.course.findUnique({ where: { id: entityId }, select: { id: true } }));
    case 'CAREER':
      return Boolean(await prisma.career.findUnique({ where: { id: entityId }, select: { id: true } }));
    default:
      return false;
  }
}

router.post(
  '/bookmarks',
  requireAuth,
  validate({ body: bookmarkSchema }),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.body as z.infer<typeof bookmarkSchema>;

    if (!(await assertEntityExists(entityType, entityId))) {
      throw new NotFoundError(entityType.charAt(0) + entityType.slice(1).toLowerCase());
    }

    const bookmark = await prisma.bookmark.upsert({
      where: { userId_entityType_entityId: { userId: req.user!.id, entityType, entityId } },
      create: { userId: req.user!.id, entityType, entityId },
      update: {},
      select: { id: true, entityType: true, entityId: true, createdAt: true },
    });

    sendData(res, { bookmark }, 201);
  }),
);

router.delete(
  '/bookmarks',
  requireAuth,
  validate({ body: bookmarkSchema }),
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.body as z.infer<typeof bookmarkSchema>;

    await prisma.bookmark.deleteMany({
      where: { userId: req.user!.id, entityType, entityId },
    });

    sendData(res, { message: 'Removed from saved items' });
  }),
);

/**
 * Saved items, resolved into their full records. Each entity type is fetched in
 * a single batched query rather than one query per bookmark.
 */
router.get(
  '/bookmarks',
  requireAuth,
  validate({ query: z.object({ entityType: z.enum(bookmarkEntities).optional() }) }),
  asyncHandler(async (req, res) => {
    const { entityType } = req.query as { entityType?: BookmarkEntity };

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.id, ...(entityType ? { entityType } : {}) },
      orderBy: { createdAt: 'desc' },
      select: { id: true, entityType: true, entityId: true, createdAt: true },
    });

    const idsByType = new Map<BookmarkEntity, string[]>();
    for (const bookmark of bookmarks) {
      const ids = idsByType.get(bookmark.entityType) ?? [];
      ids.push(bookmark.entityId);
      idsByType.set(bookmark.entityType, ids);
    }

    const [colleges, scholarships, courses, careers] = await Promise.all([
      prisma.college.findMany({
        where: { id: { in: idsByType.get('COLLEGE') ?? [] } },
        select: { id: true, slug: true, name: true, city: true, district: true, state: true, type: true },
      }),
      prisma.scholarship.findMany({
        where: { id: { in: idsByType.get('SCHOLARSHIP') ?? [] } },
        select: { id: true, slug: true, title: true, provider: true, deadline: true },
      }),
      prisma.course.findMany({
        where: { id: { in: idsByType.get('COURSE') ?? [] } },
        select: { id: true, slug: true, name: true, degreeType: true, durationYears: true },
      }),
      prisma.career.findMany({
        where: { id: { in: idsByType.get('CAREER') ?? [] } },
        select: { id: true, slug: true, title: true, averageSalaryMin: true, averageSalaryMax: true },
      }),
    ]);

    const lookup: Record<BookmarkEntity, Map<string, unknown>> = {
      COLLEGE: new Map(colleges.map((c) => [c.id, c])),
      SCHOLARSHIP: new Map(scholarships.map((s) => [s.id, s])),
      COURSE: new Map(courses.map((c) => [c.id, c])),
      CAREER: new Map(careers.map((c) => [c.id, c])),
    };

    sendData(res, {
      bookmarks: bookmarks
        .map((bookmark) => ({
          ...bookmark,
          entity: lookup[bookmark.entityType].get(bookmark.entityId) ?? null,
        }))
        // A bookmark whose target was deleted is skipped rather than rendered blank.
        .filter((bookmark) => bookmark.entity !== null),
    });
  }),
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

router.get(
  '/notifications',
  requireAuth,
  validate({
    query: paginationSchema.extend({
      unreadOnly: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .default(false),
    }),
  }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as { page: number; pageSize: number; unreadOnly: boolean };

    const where: Prisma.NotificationWhereInput = {
      userId: req.user!.id,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          actionUrl: true,
          readAt: true,
          createdAt: true,
        },
        ...toPrismaPage(query),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, readAt: null } }),
    ]);

    res.status(200).json({
      data: notifications,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
        hasNext: query.page * query.pageSize < total,
        hasPrevious: query.page > 1,
        unreadCount,
      },
    });
  }),
);

router.patch(
  '/notifications/:id/read',
  requireAuth,
  validate({ params: z.object({ id: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    // Scoped to the caller so one user cannot mark another's notification read.
    const result = await prisma.notification.updateMany({
      where: { id, userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });

    sendData(res, { updated: result.count });
  }),
);

router.post(
  '/notifications/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });

    sendData(res, { updated: result.count });
  }),
);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

const feedbackSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    category: z.string().trim().max(60).optional(),
    message: z.string().trim().min(3).max(2000),
    pageUrl: z.string().trim().max(500).optional(),
  })
  .strict();

router.post(
  '/feedback',
  optionalAuth,
  writeLimiter,
  validate({ body: feedbackSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof feedbackSchema>;

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user?.id ?? null,
        rating: body.rating,
        category: body.category ?? null,
        message: body.message,
        pageUrl: body.pageUrl ?? null,
      },
      select: { id: true, rating: true, createdAt: true },
    });

    sendData(res, { feedback }, 201);
  }),
);

/** Aggregate rating shown publicly; individual feedback text is never exposed. */
router.get(
  '/feedback/summary',
  asyncHandler(async (_req, res) => {
    const [aggregate, distribution] = await Promise.all([
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.feedback.groupBy({ by: ['rating'], _count: { _all: true }, orderBy: { rating: 'asc' } }),
    ]);

    sendData(res, {
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : null,
      totalResponses: aggregate._count._all,
      distribution: distribution.map((row) => ({ rating: row.rating, count: row._count._all })),
    });
  }),
);

// ---------------------------------------------------------------------------
// Help: contact form and FAQs
// ---------------------------------------------------------------------------

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
      .optional(),
    subject: z.string().trim().min(3).max(150),
    message: z.string().trim().min(10).max(2000),
  })
  .strict();

router.post(
  '/contact',
  writeLimiter,
  validate({ body: contactSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof contactSchema>;

    const query = await prisma.contactQuery.create({
      data: { ...body, phone: body.phone ?? null },
      select: { id: true, subject: true, status: true, createdAt: true },
    });

    sendData(res, { query, message: 'Thanks. We will get back to you soon.' }, 201);
  }),
);

router.get(
  '/faqs',
  validate({ query: z.object({ category: z.string().trim().max(60).optional() }) }),
  asyncHandler(async (req, res) => {
    const { category } = req.query as { category?: string };

    const faqs = await prisma.faq.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: { id: true, question: true, answer: true, category: true },
    });

    sendData(res, { faqs });
  }),
);

export default router;
