import { afterAll, beforeAll, describe, expect, it, type TestContext } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

/**
 * Database-backed flows. Run against a throwaway database: these tests write
 * and delete rows.
 *
 * When no database is reachable each test calls ctx.skip(), so the run reports
 * them as skipped. An early `return` would report them as passing while
 * asserting nothing, which reads as coverage that does not exist.
 */
let databaseAvailable = false;

const app: Express = createApp();

const testEmail = `vitest-${Date.now()}@example.test`;
const password = 'TestPassword123';

/** Marks the current test skipped unless a database is reachable. */
function requireDatabase(ctx: TestContext): void {
  if (!databaseAvailable) ctx.skip();
}

beforeAll(async () => {
  databaseAvailable = await prisma
    .$queryRaw`SELECT 1`.then(() => true)
    .catch(() => false);
});

afterAll(async () => {
  if (databaseAvailable) {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'vitest-' } } });
  }
  await prisma.$disconnect();
});

describe('database-backed flows', () => {
  it('reports readiness when the database is up', async (ctx) => {
    requireDatabase(ctx);

    const response = await request(app).get('/health/ready');
    expect(response.status).toBe(200);
    expect(response.body.database).toBe('up');
  });

  it('registers a user and returns tokens without exposing the password hash', async (ctx) => {
    requireDatabase(ctx);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Vitest User', email: testEmail, password });

    expect(response.status).toBe(201);
    expect(response.body.data.tokens.accessToken).toBeTruthy();
    expect(response.body.data.tokens.refreshToken).toBeTruthy();
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('$2b$');
  });

  it('rejects a duplicate registration with 409', async (ctx) => {
    requireDatabase(ctx);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Vitest User', email: testEmail, password });

    expect(response.status).toBe(409);
  });

  it('signs in and returns a usable access token', async (ctx) => {
    requireDatabase(ctx);

    const login = await request(app).post('/api/auth/login').send({ email: testEmail, password });
    expect(login.status).toBe(200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(testEmail);
    expect(me.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password with the same message as an unknown email', async (ctx) => {
    requireDatabase(ctx);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword123' });

    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody-here@example.test', password: 'WrongPassword123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    // Identical wording prevents account enumeration.
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('never exposes another user password hash through the profile endpoint', async (ctx) => {
    requireDatabase(ctx);

    const login = await request(app).post('/api/auth/login').send({ email: testEmail, password });
    const token = login.body.data.tokens.accessToken;

    const other = await prisma.user.findFirst({
      where: { email: { not: testEmail } },
      select: { id: true },
    });

    // Needs a second account to compare against; the seed provides them.
    if (!other) ctx.skip();

    const response = await request(app)
      .get(`/api/profile/${other!.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('$2b$');
  });

  it('rotates refresh tokens and revokes the presented one', async (ctx) => {
    requireDatabase(ctx);

    const login = await request(app).post('/api/auth/login').send({ email: testEmail, password });
    const original = login.body.data.tokens.refreshToken;

    const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken: original });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.tokens.refreshToken).not.toBe(original);

    // Replaying the old token must fail and invalidate the family.
    const replay = await request(app).post('/api/auth/refresh').send({ refreshToken: original });
    expect(replay.status).toBe(401);
  });
});
