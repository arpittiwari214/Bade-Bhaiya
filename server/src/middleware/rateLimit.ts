import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env, isTest } from '../config/env';

const disabled = isTest;

const shared = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  skip: () => disabled,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please wait a moment and try again.',
    },
  },
};

/** Baseline limit applied to the whole API surface. */
export const apiLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/**
 * Tighter limit for credential endpoints. Keyed on IP plus submitted email so
 * one attacker cannot lock out a shared-NAT school or cybercafe, which is a
 * realistic access pattern for this product's users.
 */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'anonymous';
    return `${ipKeyGenerator(req.ip ?? '')}:${email}`;
  },
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please wait a few minutes before trying again.',
    },
  },
});

/** For endpoints that create public records and are attractive to spam. */
export const writeLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 20,
});
