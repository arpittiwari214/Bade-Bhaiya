import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { verifyAccessToken } from '../lib/tokens';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') return null;

  return token;
}

/**
 * Rejects the request unless it carries a valid access token. Every handler
 * downstream can rely on `req.user` being present, and must use `req.user.id`
 * rather than any user id supplied in the body or query.
 */
export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attaches `req.user` when a valid token is present but allows anonymous
 * access. Used by endpoints that return extra fields for signed-in users, such
 * as whether a college is bookmarked.
 */
export const optionalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    // An invalid token on an optional route is treated as anonymous rather
    // than an error, so an expired session never blocks public content.
  }

  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
