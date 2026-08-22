import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '../../src/lib/tokens';
import { UnauthorizedError } from '../../src/lib/errors';

const payload = { sub: 'user_1', role: 'STUDENT' as const, email: 'a@b.com' };

describe('access tokens', () => {
  it('round-trips a payload', () => {
    const decoded = verifyAccessToken(signAccessToken(payload));

    expect(decoded.sub).toBe('user_1');
    expect(decoded.role).toBe('STUDENT');
    expect(decoded.email).toBe('a@b.com');
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign(payload, 'a-completely-different-secret-value-32chars', {
      issuer: 'bade-bhaiya',
      audience: 'bade-bhaiya-client',
    });

    expect(() => verifyAccessToken(forged)).toThrow(UnauthorizedError);
  });

  it('rejects a token with the wrong audience', () => {
    const wrongAudience = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      issuer: 'bade-bhaiya',
      audience: 'someone-else',
    });

    expect(() => verifyAccessToken(wrongAudience)).toThrow(UnauthorizedError);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      issuer: 'bade-bhaiya',
      audience: 'bade-bhaiya-client',
      expiresIn: '-1s',
    });

    expect(() => verifyAccessToken(expired)).toThrow(/expired/i);
  });

  it('rejects malformed input', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow(UnauthorizedError);
  });
});

describe('refresh tokens', () => {
  it('never returns the value it stores', () => {
    const { token, tokenHash } = generateRefreshToken();

    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toHaveLength(64);
  });

  it('hashes deterministically so lookup by hash works', () => {
    const { token, tokenHash } = generateRefreshToken();

    expect(hashRefreshToken(token)).toBe(tokenHash);
  });

  it('generates a distinct token each call', () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    expect(first.token).not.toBe(second.token);
  });

  it('sets an expiry in the future', () => {
    const { expiresAt } = generateRefreshToken();

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
