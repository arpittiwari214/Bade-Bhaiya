import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { asyncHandler, sendData, sendPage } from '../../lib/http';
import { cuidSchema, paginationSchema, searchSchema, slugSchema, toPrismaPage } from '../../lib/pagination';
import { optionalAuth, requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

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

const scholarshipSelect = {
  id: true,
  slug: true,
  title: true,
  provider: true,
  description: true,
  criteria: true,
  benefitAmount: true,
  benefitDescription: true,
  applicationStartDate: true,
  deadline: true,
  url: true,
  state: true,
  eligibleStreams: true,
  eligibleLevels: true,
} satisfies Prisma.ScholarshipSelect;

const listQuerySchema = paginationSchema.extend({
  search: searchSchema,
  state: z.string().trim().max(100).optional(),
  stream: z.enum(streamCodes).optional(),
  level: z.enum(educationLevels).optional(),
  /** Hide scholarships whose deadline has already passed. Defaults to on. */
  includeExpired: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default(false),
  sort: z.enum(['deadline', 'amount', 'title']).default('deadline'),
});

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;

    const where: Prisma.ScholarshipWhereInput = {
      isActive: true,
      ...(query.includeExpired ? {} : { deadline: { gte: new Date() } }),
      // A scholarship with an empty eligibility array is open to everyone, so
      // it must still match when the user filters by stream or level.
      ...(query.stream ? { OR: [{ eligibleStreams: { has: query.stream } }, { eligibleStreams: { isEmpty: true } }] } : {}),
      ...(query.level ? { AND: [{ OR: [{ eligibleLevels: { has: query.level } }, { eligibleLevels: { isEmpty: true } }] }] } : {}),
      ...(query.state ? { OR: [{ state: { equals: query.state, mode: 'insensitive' } }, { state: null }] } : {}),
      ...(query.search
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: query.search, mode: 'insensitive' } },
                  { provider: { contains: query.search, mode: 'insensitive' } },
                  { description: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ScholarshipOrderByWithRelationInput =
      query.sort === 'amount'
        ? { benefitAmount: 'desc' }
        : query.sort === 'title'
          ? { title: 'asc' }
          : { deadline: 'asc' };

    const [scholarships, total] = await Promise.all([
      prisma.scholarship.findMany({
        where,
        orderBy,
        select: scholarshipSelect,
        ...toPrismaPage(query),
      }),
      prisma.scholarship.count({ where }),
    ]);

    sendPage(res, scholarships, query.page, query.pageSize, total);
  }),
);

router.get(
  '/:slug',
  optionalAuth,
  validate({ params: z.object({ slug: slugSchema }) }),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };

    const scholarship = await prisma.scholarship.findFirst({
      where: { slug, isActive: true },
      select: scholarshipSelect,
    });

    if (!scholarship) throw new NotFoundError('Scholarship');

    let application = null;
    if (req.user) {
      application = await prisma.scholarshipApplication.findUnique({
        where: {
          userId_scholarshipId: { userId: req.user.id, scholarshipId: scholarship.id },
        },
        select: { id: true, status: true, appliedAt: true },
      });
    }

    sendData(res, { scholarship, application });
  }),
);

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

/**
 * The applicant is always the authenticated user. The previous implementation
 * read `userId` from the request body, which let any caller create an
 * application on behalf of any account.
 */
const applySchema = z
  .object({
    scholarshipId: cuidSchema,
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

router.post(
  '/applications',
  requireAuth,
  validate({ body: applySchema }),
  asyncHandler(async (req, res) => {
    const { scholarshipId, notes } = req.body as z.infer<typeof applySchema>;

    const scholarship = await prisma.scholarship.findFirst({
      where: { id: scholarshipId, isActive: true },
      select: { id: true, deadline: true, title: true },
    });

    if (!scholarship) throw new NotFoundError('Scholarship');

    if (scholarship.deadline < new Date()) {
      throw new ConflictError('The deadline for this scholarship has passed');
    }

    try {
      const application = await prisma.scholarshipApplication.create({
        data: {
          userId: req.user!.id,
          scholarshipId,
          notes: notes ?? null,
          status: 'SUBMITTED',
        },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          scholarship: { select: { id: true, slug: true, title: true, deadline: true } },
        },
      });

      // Best-effort notification; a failure here must not fail the application.
      await prisma.notification
        .create({
          data: {
            userId: req.user!.id,
            type: 'APPLICATION_UPDATE',
            title: 'Application submitted',
            message: `Your application for ${scholarship.title} has been recorded.`,
            actionUrl: '/scholarships/applications',
          },
        })
        .catch(() => undefined);

      sendData(res, { application }, 201);
    } catch (error) {
      // The unique constraint on (userId, scholarshipId) is what actually
      // prevents duplicates; a read-then-write check would race.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError('You have already applied for this scholarship');
      }
      throw error;
    }
  }),
);

router.get(
  '/applications/mine',
  requireAuth,
  validate({ query: paginationSchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof paginationSchema>;
    const where: Prisma.ScholarshipApplicationWhereInput = { userId: req.user!.id };

    const [applications, total] = await Promise.all([
      prisma.scholarshipApplication.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          status: true,
          notes: true,
          appliedAt: true,
          scholarship: {
            select: { id: true, slug: true, title: true, provider: true, deadline: true, url: true },
          },
        },
        ...toPrismaPage(query),
      }),
      prisma.scholarshipApplication.count({ where }),
    ]);

    sendPage(res, applications, query.page, query.pageSize, total);
  }),
);

router.delete(
  '/applications/:id',
  requireAuth,
  validate({ params: z.object({ id: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const application = await prisma.scholarshipApplication.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!application) throw new NotFoundError('Application');

    // Ownership is checked explicitly rather than relying on the delete filter,
    // so an attempt to withdraw someone else's application is a clear 403.
    if (application.userId !== req.user!.id) {
      throw new ForbiddenError('You can only withdraw your own applications');
    }

    await prisma.scholarshipApplication.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });

    sendData(res, { message: 'Application withdrawn' });
  }),
);

export default router;
