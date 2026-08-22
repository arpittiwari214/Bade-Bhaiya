import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

const ISSUER = 'bade-bhaiya';
const AUDIENCE = 'bade-bhaiya-client';

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (typeof decoded === 'string') {
      throw new UnauthorizedError('Malformed access token');
    }

    return {
      sub: String(decoded.sub),
      role: decoded.role as UserRole,
      email: String(decoded.email),
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

/**
 * Refresh tokens are opaque random strings rather than JWTs. They are stored
 * as SHA-256 hashes, so the database never holds a usable credential, and can
 * be revoked individually on logout or rotation.
 */
export function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash: hashRefreshToken(token), expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
