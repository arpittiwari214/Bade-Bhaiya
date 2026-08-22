import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { asyncHandler, sendData, sendPage } from '../../lib/http';
import { paginationSchema, searchSchema, slugSchema, toPrismaPage } from '../../lib/pagination';
import { optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

const collegeTypes = ['GOVERNMENT', 'GOVERNMENT_AIDED', 'AUTONOMOUS', 'PRIVATE'] as const;
const streamCodes = ['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'] as const;

const collegeListSelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  affiliation: true,
  city: true,
  district: true,
  state: true,
  latitude: true,
  longitude: true,
  naacGrade: true,
  hostelAvailable: true,
  establishedYear: true,
  _count: { select: { courses: true } },
} satisfies Prisma.CollegeSelect;

const listQuerySchema = paginationSchema.extend({
  search: searchSchema,
  state: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  type: z.enum(collegeTypes).optional(),
  stream: z.enum(streamCodes).optional(),
  courseSlug: slugSchema.optional(),
  maxFee: z.coerce.number().int().min(0).optional(),
  hostel: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  sort: z.enum(['name', 'established', 'fee']).default('name'),
});

/**
 * Directory search. Every filter is optional and composes, so the client can
 * offer a single results page that narrows progressively.
 */
router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;

    // Course-level filters constrain the college via its CollegeCourse rows.
    const courseFilter: Prisma.CollegeCourseWhereInput = {
      ...(query.stream ? { course: { stream: { code: query.stream } } } : {}),
      ...(query.courseSlug ? { course: { slug: query.courseSlug } } : {}),
      ...(query.maxFee !== undefined ? { annualFee: { lte: query.maxFee } } : {}),
    };
    const hasCourseFilter = Object.keys(courseFilter).length > 0;

    const where: Prisma.CollegeWhereInput = {
      isActive: true,
      ...(query.state ? { state: { equals: query.state, mode: 'insensitive' } } : {}),
      ...(query.district ? { district: { equals: query.district, mode: 'insensitive' } } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.hostel !== undefined ? { hostelAvailable: query.hostel } : {}),
      ...(hasCourseFilter ? { courses: { some: courseFilter } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
              { district: { contains: query.search, mode: 'insensitive' } },
              { affiliation: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.CollegeOrderByWithRelationInput =
      query.sort === 'established' ? { establishedYear: 'desc' } : { name: 'asc' };

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({ where, orderBy, select: collegeListSelect, ...toPrismaPage(query) }),
      prisma.college.count({ where }),
    ]);

    sendPage(res, colleges, query.page, query.pageSize, total);
  }),
);

/** Distinct states and districts, used to populate the filter dropdowns. */
router.get(
  '/locations',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.college.findMany({
      where: { isActive: true },
      select: { state: true, district: true },
      distinct: ['state', 'district'],
      orderBy: [{ state: 'asc' }, { district: 'asc' }],
    });

    const byState = new Map<string, string[]>();
    for (const row of rows) {
      const districts = byState.get(row.state) ?? [];
      districts.push(row.district);
      byState.set(row.state, districts);
    }

    const states = Array.from(byState.entries()).map(([state, districts]) => ({
      state,
      districts,
    }));

    sendData(res, { states });
  }),
);

router.get(
  '/:slug',
  optionalAuth,
  validate({ params: z.object({ slug: slugSchema }) }),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };

    const college = await prisma.college.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        affiliation: true,
        addressLine: true,
        city: true,
        district: true,
        state: true,
        pincode: true,
        latitude: true,
        longitude: true,
        website: true,
        email: true,
        phone: true,
        establishedYear: true,
        naacGrade: true,
        hostelAvailable: true,
        courses: {
          orderBy: { course: { name: 'asc' } },
          select: {
            id: true,
            seats: true,
            annualFee: true,
            cutoffPercentage: true,
            medium: true,
            course: {
              select: {
                id: true,
                slug: true,
                name: true,
                shortName: true,
                degreeType: true,
                durationYears: true,
                stream: { select: { code: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!college) throw new NotFoundError('College');

    // Signed-in users get their bookmark state so the UI can render the
    // correct toggle without a second round trip.
    let isBookmarked = false;
    if (req.user) {
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_entityType_entityId: {
            userId: req.user.id,
            entityType: 'COLLEGE',
            entityId: college.id,
          },
        },
        select: { id: true },
      });
      isBookmarked = Boolean(bookmark);
    }

    sendData(res, { college: { ...college, isBookmarked } });
  }),
);

export default router;
