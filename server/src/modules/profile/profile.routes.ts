import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { asyncHandler, sendData } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

/**
 * Explicit select. The previous implementation used `include: { user: true }`,
 * which returned the bcrypt hash of any user to any unauthenticated caller.
 */
const profileSelect = {
  id: true,
  avatarUrl: true,
  bio: true,
  dateOfBirth: true,
  educationLevel: true,
  currentStream: true,
  boardName: true,
  schoolName: true,
  city: true,
  district: true,
  state: true,
  pincode: true,
  latitude: true,
  longitude: true,
  interests: true,
  preferredLanguage: true,
  onboardingCompleted: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ProfileSelect;

/** Fields visible to someone other than the profile owner. */
const publicProfileSelect = {
  id: true,
  avatarUrl: true,
  bio: true,
  currentStream: true,
  city: true,
  district: true,
  state: true,
  interests: true,
  user: {
    select: { id: true, name: true, role: true },
  },
} satisfies Prisma.ProfileSelect;

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    avatarUrl: z.string().url().max(500).nullish(),
    bio: z.string().trim().max(1000).nullish(),
    dateOfBirth: z.coerce.date().nullish(),
    educationLevel: z
      .enum(['CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12', 'UNDERGRADUATE', 'POSTGRADUATE', 'OTHER'])
      .nullish(),
    currentStream: z.enum(['SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL']).nullish(),
    boardName: z.string().trim().max(100).nullish(),
    schoolName: z.string().trim().max(200).nullish(),
    city: z.string().trim().max(100).nullish(),
    district: z.string().trim().max(100).nullish(),
    state: z.string().trim().max(100).nullish(),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')
      .nullish(),
    latitude: z.coerce.number().min(-90).max(90).nullish(),
    longitude: z.coerce.number().min(-180).max(180).nullish(),
    interests: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    preferredLanguage: z.enum(['en', 'hi']).optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .strict();

/** The signed-in user's own profile, including contact details. */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id },
      update: {},
      select: profileSelect,
    });

    sendData(res, { profile });
  }),
);

router.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const { name, ...profileFields } = req.body as z.infer<typeof updateProfileSchema>;

    const profile = await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({ where: { id: req.user!.id }, data: { name } });
      }

      return tx.profile.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, ...profileFields },
        update: profileFields,
        select: profileSelect,
      });
    });

    sendData(res, { profile });
  }),
);

/**
 * Another user's profile. Returns only the public subset, and requires
 * authentication so profiles are not scrapeable anonymously.
 */
router.get(
  '/:userId',
  requireAuth,
  validate({ params: z.object({ userId: z.string().min(1).max(64) }) }),
  asyncHandler(async (req, res) => {
    const { userId } = req.params as { userId: string };

    if (userId === req.user!.id) {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: profileSelect,
      });
      if (!profile) throw new NotFoundError('Profile');
      sendData(res, { profile });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: publicProfileSelect,
    });

    if (!profile) throw new NotFoundError('Profile');
    sendData(res, { profile });
  }),
);

export default router;
