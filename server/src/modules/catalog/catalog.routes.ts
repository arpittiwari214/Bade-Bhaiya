import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { asyncHandler, sendData, sendPage } from '../../lib/http';
import { paginationSchema, searchSchema, slugSchema, toPrismaPage } from '../../lib/pagination';
import { validate } from '../../middleware/validate';

const router = Router();

const streamCodes = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'] as const;
const degreeTypes = ['DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE'] as const;

const courseListItemSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  description: true,
  degreeType: true,
  durationYears: true,
  eligibility: true,
  averageFeeMin: true,
  averageFeeMax: true,
  stream: { select: { code: true, name: true } },
} satisfies Prisma.CourseSelect;

// ---------------------------------------------------------------------------
// Streams
// ---------------------------------------------------------------------------

router.get(
  '/streams',
  asyncHandler(async (_req, res) => {
    const streams = await prisma.stream.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        iconKey: true,
        _count: { select: { courses: true } },
      },
    });

    sendData(res, { streams });
  }),
);

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

const courseQuerySchema = paginationSchema.extend({
  search: searchSchema,
  stream: z.enum(streamCodes).optional(),
  degreeType: z.enum(degreeTypes).optional(),
  maxFee: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['name', 'duration', 'fee']).default('name'),
});

router.get(
  '/courses',
  validate({ query: courseQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof courseQuerySchema>;

    const where: Prisma.CourseWhereInput = {
      isActive: true,
      ...(query.stream ? { stream: { code: query.stream } } : {}),
      ...(query.degreeType ? { degreeType: query.degreeType } : {}),
      ...(query.maxFee !== undefined ? { averageFeeMin: { lte: query.maxFee } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { shortName: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.CourseOrderByWithRelationInput =
      query.sort === 'duration'
        ? { durationYears: 'asc' }
        : query.sort === 'fee'
          ? { averageFeeMin: 'asc' }
          : { name: 'asc' };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        select: courseListItemSelect,
        ...toPrismaPage(query),
      }),
      prisma.course.count({ where }),
    ]);

    sendPage(res, courses, query.page, query.pageSize, total);
  }),
);

/**
 * A course with the careers it leads to, ordered by relevance. This is the
 * data behind the course-to-career flowchart.
 */
router.get(
  '/courses/:slug',
  validate({ params: z.object({ slug: slugSchema }) }),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };

    const course = await prisma.course.findFirst({
      where: { slug, isActive: true },
      select: {
        ...courseListItemSelect,
        careers: {
          orderBy: { relevance: 'desc' },
          select: {
            relevance: true,
            note: true,
            career: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                educationRequired: true,
                averageSalaryMin: true,
                averageSalaryMax: true,
                growthOutlook: true,
                sectors: true,
              },
            },
          },
        },
        collegeCourses: {
          take: 12,
          orderBy: { annualFee: 'asc' },
          select: {
            seats: true,
            annualFee: true,
            cutoffPercentage: true,
            college: {
              select: { id: true, slug: true, name: true, city: true, district: true, state: true },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundError('Course');

    sendData(res, { course });
  }),
);

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------

const careerQuerySchema = paginationSchema.extend({
  search: searchSchema,
  sector: z.string().trim().max(60).optional(),
  minSalary: z.coerce.number().int().min(0).optional(),
});

router.get(
  '/careers',
  validate({ query: careerQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof careerQuerySchema>;

    const where: Prisma.CareerWhereInput = {
      isActive: true,
      ...(query.sector ? { sectors: { has: query.sector } } : {}),
      ...(query.minSalary !== undefined ? { averageSalaryMax: { gte: query.minSalary } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [careers, total] = await Promise.all([
      prisma.career.findMany({
        where,
        orderBy: { title: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          educationRequired: true,
          averageSalaryMin: true,
          averageSalaryMax: true,
          growthOutlook: true,
          sectors: true,
        },
        ...toPrismaPage(query),
      }),
      prisma.career.count({ where }),
    ]);

    sendPage(res, careers, query.page, query.pageSize, total);
  }),
);

/** A career plus the courses that lead into it, for the reverse lookup. */
router.get(
  '/careers/:slug',
  validate({ params: z.object({ slug: slugSchema }) }),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };

    const career = await prisma.career.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        educationRequired: true,
        averageSalaryMin: true,
        averageSalaryMax: true,
        growthOutlook: true,
        sectors: true,
        courses: {
          orderBy: { relevance: 'desc' },
          select: {
            relevance: true,
            note: true,
            course: { select: courseListItemSelect },
          },
        },
      },
    });

    if (!career) throw new NotFoundError('Career');

    sendData(res, { career });
  }),
);

export default router;
