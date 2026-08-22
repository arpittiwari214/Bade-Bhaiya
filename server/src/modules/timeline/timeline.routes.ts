import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { asyncHandler, sendData, sendPage } from '../../lib/http';
import { cuidSchema, paginationSchema, searchSchema, toPrismaPage } from '../../lib/pagination';
import { optionalAuth, requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

const eventTypes = [
  'ADMISSION',
  'ENTRANCE_EXAM',
  'BOARD_EXAM',
  'SCHOLARSHIP',
  'COUNSELLING',
  'RESULT',
] as const;

const eventSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  startDate: true,
  endDate: true,
  url: true,
  state: true,
  isNational: true,
} satisfies Prisma.TimelineEventSelect;

const listQuerySchema = paginationSchema.extend({
  search: searchSchema,
  type: z.enum(eventTypes).optional(),
  state: z.string().trim().max(100).optional(),
  /** Include events whose window has already closed. Off by default. */
  includePast: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default(false),
  /** Restrict to events starting within N days, for the dashboard widget. */
  withinDays: z.coerce.number().int().min(1).max(730).optional(),
});

router.get(
  '/',
  optionalAuth,
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;
    const now = new Date();

    const upperBound = query.withinDays
      ? new Date(now.getTime() + query.withinDays * 24 * 60 * 60 * 1000)
      : undefined;

    const where: Prisma.TimelineEventWhereInput = {
      isActive: true,
      ...(query.type ? { type: query.type } : {}),
      // A national event applies everywhere, so it must survive a state filter.
      ...(query.state
        ? { OR: [{ state: { equals: query.state, mode: 'insensitive' } }, { isNational: true }] }
        : {}),
      ...(query.includePast
        ? {}
        : {
            AND: [
              { OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }] },
              ...(upperBound ? [{ startDate: { lte: upperBound } }] : []),
            ],
          }),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.timelineEvent.findMany({
        where,
        orderBy: { startDate: 'asc' },
        select: eventSelect,
        ...toPrismaPage(query),
      }),
      prisma.timelineEvent.count({ where }),
    ]);

    // Attach the caller's subscription state in one extra query rather than
    // per-event lookups.
    let subscribedIds = new Set<string>();
    if (req.user && events.length > 0) {
      const subs = await prisma.timelineSubscription.findMany({
        where: { userId: req.user.id, eventId: { in: events.map((e) => e.id) } },
        select: { eventId: true },
      });
      subscribedIds = new Set(subs.map((s) => s.eventId));
    }

    sendPage(
      res,
      events.map((event) => ({ ...event, isSubscribed: subscribedIds.has(event.id) })),
      query.page,
      query.pageSize,
      total,
    );
  }),
);

router.post(
  '/:eventId/subscribe',
  requireAuth,
  validate({
    params: z.object({ eventId: cuidSchema }),
    body: z.object({ remindAt: z.coerce.date().optional() }).strict(),
  }),
  asyncHandler(async (req, res) => {
    const { eventId } = req.params as { eventId: string };
    const { remindAt } = req.body as { remindAt?: Date };

    const event = await prisma.timelineEvent.findFirst({
      where: { id: eventId, isActive: true },
      select: { id: true, startDate: true },
    });

    if (!event) throw new NotFoundError('Timeline event');

    // Default to a reminder three days before the event opens.
    const defaultRemindAt = new Date(event.startDate.getTime() - 3 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.timelineSubscription.upsert({
      where: { userId_eventId: { userId: req.user!.id, eventId } },
      create: { userId: req.user!.id, eventId, remindAt: remindAt ?? defaultRemindAt },
      update: { remindAt: remindAt ?? defaultRemindAt, notifiedAt: null },
      select: { id: true, eventId: true, remindAt: true },
    });

    sendData(res, { subscription }, 201);
  }),
);

router.delete(
  '/:eventId/subscribe',
  requireAuth,
  validate({ params: z.object({ eventId: cuidSchema }) }),
  asyncHandler(async (req, res) => {
    const { eventId } = req.params as { eventId: string };

    await prisma.timelineSubscription.deleteMany({
      where: { userId: req.user!.id, eventId },
    });

    sendData(res, { message: 'Reminder removed' });
  }),
);

router.get(
  '/subscriptions/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const subscriptions = await prisma.timelineSubscription.findMany({
      where: { userId: req.user!.id },
      orderBy: { event: { startDate: 'asc' } },
      select: {
        id: true,
        remindAt: true,
        notifiedAt: true,
        event: { select: eventSelect },
      },
    });

    sendData(res, { subscriptions });
  }),
);

export default router;
