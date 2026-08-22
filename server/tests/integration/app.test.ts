import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { signAccessToken } from '../../src/lib/tokens';

/**
 * These exercise the middleware stack end to end and deliberately avoid any
 * route that reaches the database, so they run without Postgres. Database-backed
 * behaviour is covered by tests/integration/db.test.ts, which skips when no
 * database is reachable.
 */
const app: Express = createApp();

describe('health', () => {
  it('reports liveness without touching the database', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  it('echoes a request id for log correlation', async () => {
    const response = await request(app).get('/health').set('x-request-id', 'abc-123');

    expect(response.headers['x-request-id']).toBe('abc-123');
  });

  it('generates a request id when the client does not send one', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toMatch(/[0-9a-f-]{36}/);
  });
});

describe('CORS', () => {
  it('allows a configured origin', async () => {
    const response = await request(app).get('/health').set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not echo an unconfigured origin', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://evil.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('not found handling', () => {
  it('returns the standard error envelope', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(typeof response.body.error.message).toBe('string');
  });
});

describe('authentication guard', () => {
  const protectedRoutes: ['get' | 'post', string][] = [
    ['get', '/api/auth/me'],
    ['get', '/api/profile/me'],
    ['get', '/api/dashboard'],
    ['get', '/api/roadmap/current'],
    ['post', '/api/quiz/attempts'],
    ['get', '/api/bookmarks'],
    ['get', '/api/notifications'],
    ['get', '/api/scholarships/applications/mine'],
    ['get', '/api/admin/stats'],
  ];

  it.each(protectedRoutes)('rejects an anonymous %s %s', async (method, path) => {
    const response =
      method === 'get' ? await request(app).get(path) : await request(app).post(path).send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed Authorization header', async () => {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Token abc');

    expect(response.status).toBe(401);
  });

  it('rejects a forged token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(response.status).toBe(401);
  });

  // A valid non-admin token must not reach an admin route.
  it('rejects a student token on an admin route', async () => {
    const token = signAccessToken({ sub: 'u1', role: 'STUDENT', email: 'a@b.com' });

    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});

describe('request validation', () => {
  it('rejects a registration missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it('rejects a weak password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'a@b.com', password: 'short' });

    expect(response.status).toBe(422);
    const fields = response.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('password');
  });

  it('rejects unknown fields rather than silently ignoring them', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'a@b.com',
      password: 'Password123',
      role: 'ADMIN',
    });

    // role only accepts STUDENT or PARENT, so self-promotion to ADMIN fails.
    expect(response.status).toBe(422);
  });

  it('rejects malformed JSON with a 400', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects an oversized body', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'x'.repeat(300 * 1024) });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
