import type { Prisma, User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { fakeVerify, hashPassword, verifyPassword } from '../../lib/password';
import { generateRefreshToken, hashRefreshToken, signAccessToken } from '../../lib/tokens';
import type { LoginInput, RegisterInput } from './auth.schema';

/**
 * The only shape of a user ever sent to a client. Selecting explicitly rather
 * than deleting fields from a full record means a new sensitive column added to
 * the schema is excluded by default instead of leaking until someone notices.
 */
export const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  role: true,
  emailVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface ClientContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

async function issueTokens(
  user: Pick<User, 'id' | 'role' | 'email'>,
  context: ClientContext,
): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const { token, tokenHash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: context.userAgent ?? null,
      ipAddress: context.ipAddress ?? null,
    },
  });

  return { accessToken, refreshToken: token, expiresAt };
}

export async function register(
  input: RegisterInput,
  context: ClientContext,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const existing = await prisma.user.findFirst({
    where: input.phone
      ? { OR: [{ email: input.email }, { phone: input.phone }] }
      : { email: input.email },
    select: { email: true, phone: true },
  });

  if (existing) {
    throw new ConflictError(
      existing.email === input.email
        ? 'An account with this email already exists'
        : 'An account with this mobile number already exists',
    );
  }

  const passwordHash = await hashPassword(input.password);

  // The profile row is created alongside the user so every downstream feature
  // can assume it exists rather than null-checking on each read.
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: input.role,
      profile: { create: {} },
    },
    select: publicUserSelect,
  });

  const tokens = await issueTokens({ id: user.id, role: user.role, email: user.email }, context);
  return { user, tokens };
}

export async function login(
  input: LoginInput,
  context: ClientContext,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    // Burn equivalent time so response latency does not reveal whether the
    // address is registered.
    await fakeVerify();
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('This account has been deactivated. Please contact support.');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(user, context);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    tokens,
  };
}

/**
 * Rotates the refresh token: the presented one is revoked and a new one issued.
 * A revoked-but-valid token being presented means it was replayed, so the
 * entire token family for that user is dropped and every session ends.
 */
export async function refresh(
  presentedToken: string,
  context: ClientContext,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const tokenHash = hashRefreshToken(presentedToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError('Refresh token has been revoked. Please sign in again.');
  }

  if (stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired. Please sign in again.');
  }

  if (!stored.user.isActive) {
    throw new UnauthorizedError('This account has been deactivated.');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(stored.user, context);

  return {
    user: {
      id: stored.user.id,
      email: stored.user.email,
      phone: stored.user.phone,
      name: stored.user.name,
      role: stored.user.role,
      emailVerified: stored.user.emailVerified,
      createdAt: stored.user.createdAt,
    },
    tokens,
  };
}

export async function logout(presentedToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(presentedToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);

  // Changing a password ends every other session, so a stolen token cannot
  // outlive the credential it was obtained with.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function getCurrentUser(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
}
