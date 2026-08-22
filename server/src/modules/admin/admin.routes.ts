import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { asyncHandler, sendData, sendPage } from '../../lib/http';
import { cuidSchema, paginationSchema, searchSchema, slugSchema, toPrismaPage } from '../../lib/pagination';
import { requireAdmin, requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// Every route in this module is admin-only. Applied at the router level so a
// new route cannot be added without inheriting the check.
router.use(requireAuth, requireAdmin);

const streamCodes = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'] as const;
const educationLevels = [
  'CLASS_9',
  'CLASS_10',
  'CLASS_11',
  'CLASS_12',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'OTHER',
] as const;
const collegeTypes = ['GOVERNMENT', 'GOVERNMENT_AIDED', 'AUTONOMOUS', 'PRIVATE'] as const;
const eventTypes = [
  'ADMISSION',
  'ENTRANCE_EXAM',
  'BOARD_EXAM',
  'SCHOLARSHIP',
  'COUNSELLING',
  'RESULT',
] as const;

// ---------------------------------------------------------------------------
// Overview statistics
// ---------------------------------------------------------------------------

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      totalColleges,
      totalScholarships,
      activeScholarships,
      totalApplications,
      completedQuizzes,
      openQueries,
      feedbackAggregate,
      streamBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.college.count({ where: { isActive: true } }),
      prisma.scholarship.count(),
      prisma.scholarship.count({ where: { isActive: true, deadline: { gte: new Date() } } }),
      prisma.scholarshipApplication.count(),
      prisma.quizAttempt.count({ where: { status: 'COMPLETED' } }),
      prisma.contactQuery.count({ where: { status: 'OPEN' } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.quizAttempt.groupBy({
        by: ['recommendedStream'],
        where: { status: 'COMPLETED' },
        _count: { _all: true },
      }),
    ]);

    sendData(res, {
      users: { total: totalUsers, newLast30Days: newUsers },
      content: { colleges: totalColleges, scholarships: totalScholarships, activeScholarships },
      engagement: {
        applications: totalApplications,
        completedQuizzes,
        openQueries,
        averageRating: feedbackAggregate._avg.rating
          ? Math.round(feedbackAggregate._avg.rating * 10) / 10
          : null,
        feedbackCount: feedbackAggregate._count._all,
      },
      streamBreakdown: streamBreakdown.map((row) => ({
        stream: row.recommendedStream,
        count: row._count._all,
      })),
    });
  }),
);

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

const scholarshipBody = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(3).max(200),
    provider: z.string().trim().min(2).max(150),
    description: z.string().trim().min(10).max(5000),
    criteria: z.string().trim().min(5).max(5000),
    benefitAmount: z.coerce.number().int().min(0).nullish(),
    benefitDescription: z.string().trim().max(500).nullish(),
    applicationStartDate: z.coerce.date().nullish(),
    deadline: z.coerce.date(),
    url: z.string().url().max(500),
    state: z.string().trim().max(100).nullish(),
    eligibleStreams: z.array(z.enum(streamCodes)).max(4).default([]),
    eligibleLevels: z.array(z.enum(educationLevels)).max(7).default([]),
    isActive: z.boolean().default(true),
  })
  .strict();

router.post(
  '/scholarships',
  validate({ body: scholarshipBody }),
  asyncHandler(async (req, res) => {
    const scholarship = await prisma.scholarship.create({ data: req.body });
    sendData(res, { scholarship }, 201);
  }),
);

router.patch(
  '/scholarships/:id',
  validate({ params: z.object({ id: cuidSchema }), body: scholarshipBody.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const scholarship = await prisma.scholarship.update({ where: { id }, data: req.body });
    sendData(res, { scholarship });
  }),
);

router.delete(
  '/scholarships/:id',
  validate({ params: z.object({ id: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    // Soft delete: applications reference this row and admins routinely
    // re-activate a scholarship for the next intake cycle.
    await prisma.scholarship.update({ where: { id }, data: { isActive: false } });
    sendData(res, { message: 'Scholarship deactivated' });
  }),
);

// ---------------------------------------------------------------------------
// Colleges
// ---------------------------------------------------------------------------

const collegeBody = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(3).max(250),
    type: z.enum(collegeTypes).default('GOVERNMENT'),
    affiliation: z.string().trim().max(200).nullish(),
    addressLine: z.string().trim().max(300).nullish(),
    city: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    pincode: z.string().trim().regex(/^\d{6}$/).nullish(),
    latitude: z.coerce.number().min(-90).max(90).nullish(),
    longitude: z.coerce.number().min(-180).max(180).nullish(),
    website: z.string().url().max(300).nullish(),
    email: z.string().email().max(255).nullish(),
    phone: z.string().trim().max(20).nullish(),
    establishedYear: z.coerce.number().int().min(1800).max(2100).nullish(),
    naacGrade: z.string().trim().max(10).nullish(),
    hostelAvailable: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .strict();

router.post(
  '/colleges',
  validate({ body: collegeBody }),
  asyncHandler(async (req, res) => {
    const college = await prisma.college.create({ data: req.body });
    sendData(res, { college }, 201);
  }),
);

router.patch(
  '/colleges/:id',
  validate({ params: z.object({ id: cuidSchema }), body: collegeBody.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const college = await prisma.college.update({ where: { id }, data: req.body });
    sendData(res, { college });
  }),
);

router.delete(
  '/colleges/:id',
  validate({ params: z.object({ id: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    await prisma.college.update({ where: { id }, data: { isActive: false } });
    sendData(res, { message: 'College deactivated' });
  }),
);

/** Attach or update a course offering at a college. */
router.put(
  '/colleges/:collegeId/courses',
  validate({
    params: z.object({ collegeId: cuidSchema }),
    body: z
      .object({
        courseId: cuidSchema,
        seats: z.coerce.number().int().min(0).nullish(),
        annualFee: z.coerce.number().int().min(0).nullish(),
        cutoffPercentage: z.coerce.number().min(0).max(100).nullish(),
        medium: z.string().trim().max(50).nullish(),
      })
      .strict(),
  }),
  asyncHandler(async (req, res) => {
    const { collegeId } = req.params as { collegeId: string };
    const { courseId, ...rest } = req.body as { courseId: string } & Record<string, unknown>;

    const offering = await prisma.collegeCourse.upsert({
      where: { collegeId_courseId: { collegeId, courseId } },
      create: { collegeId, courseId, ...rest },
      update: rest,
    });

    sendData(res, { offering }, 201);
  }),
);

// ---------------------------------------------------------------------------
// Timeline events
// ---------------------------------------------------------------------------

const eventFields = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(5).max(2000),
    type: z.enum(eventTypes),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullish(),
    url: z.string().url().max(500).nullish(),
    state: z.string().trim().max(100).nullish(),
    isNational: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .strict();

const endDateNotBeforeStart = {
  path: ['endDate'],
  message: 'End date must be on or after the start date',
};

const eventBody = eventFields.refine(
  (value) => !value.endDate || value.endDate >= value.startDate,
  endDateNotBeforeStart,
);

/**
 * Partial updates validate the same range rule, but only when both dates are
 * present in the patch. A patch touching one date alone is checked against the
 * stored row by the database, not here.
 */
const eventPatchBody = eventFields
  .partial()
  .refine(
    (value) => !value.endDate || !value.startDate || value.endDate >= value.startDate,
    endDateNotBeforeStart,
  );

router.post(
  '/timeline-events',
  validate({ body: eventBody }),
  asyncHandler(async (req, res) => {
    const event = await prisma.timelineEvent.create({ data: req.body });
    sendData(res, { event }, 201);
  }),
);

router.patch(
  '/timeline-events/:id',
  validate({
    params: z.object({ id: cuidSchema }),
    body: eventPatchBody,
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const event = await prisma.timelineEvent.update({ where: { id }, data: req.body });
    sendData(res, { event });
  }),
);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

router.get(
  '/users',
  validate({
    query: paginationSchema.extend({
      search: searchSchema,
      role: z.enum(['STUDENT', 'PARENT', 'MENTOR', 'ADMIN']).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      role?: 'STUDENT' | 'PARENT' | 'MENTOR' | 'ADMIN';
    };

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        // Never selects passwordHash, even for admins.
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        ...toPrismaPage(query),
      }),
      prisma.user.count({ where }),
    ]);

    sendPage(res, users, query.page, query.pageSize, total);
  }),
);

router.patch(
  '/users/:id/status',
  validate({
    params: z.object({ id: cuidSchema }),
    body: z.object({ isActive: z.boolean() }).strict(),
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { isActive } = req.body as { isActive: boolean };

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    // Deactivating must also end live sessions, otherwise the account keeps
    // working until its access token expires.
    if (!isActive) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    sendData(res, { user });
  }),
);

// ---------------------------------------------------------------------------
// Support queue
// ---------------------------------------------------------------------------

router.get(
  '/contact-queries',
  validate({
    query: paginationSchema.extend({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as {
      page: number;
      pageSize: number;
      status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    };

    const where: Prisma.ContactQueryWhereInput = query.status ? { status: query.status } : {};

    const [queries, total] = await Promise.all([
      prisma.contactQuery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toPrismaPage(query),
      }),
      prisma.contactQuery.count({ where }),
    ]);

    sendPage(res, queries, query.page, query.pageSize, total);
  }),
);

router.patch(
  '/contact-queries/:id',
  validate({
    params: z.object({ id: cuidSchema }),
    body: z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) }).strict(),
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' };

    const query = await prisma.contactQuery.update({ where: { id }, data: { status } });
    sendData(res, { query });
  }),
);

router.get(
  '/feedback',
  validate({ query: paginationSchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as { page: number; pageSize: number };

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          category: true,
          message: true,
          pageUrl: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
        ...toPrismaPage(query),
      }),
      prisma.feedback.count(),
    ]);

    sendPage(res, feedback, query.page, query.pageSize, total);
  }),
);

export default router;
