import 'dotenv/config';
import { z } from 'zod';

/**
 * Every environment variable the server reads is declared here and validated at
 * boot. Nothing else in the codebase touches `process.env` directly, so a
 * missing or malformed variable fails fast with a readable message instead of
 * surfacing as an undefined value deep inside a request.
 */

const MIN_SECRET_LENGTH = 32;

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

const secret = (label: string) =>
  z
    .string()
    .min(
      MIN_SECRET_LENGTH,
      `${label} must be at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -base64 48`,
    );

const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default('0.0.0.0'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

    /** Comma-separated list of browser origins allowed to call the API. */
    CORS_ORIGINS: z.string().default('http://localhost:5173'),

    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    /** Number of proxies in front of the app; needed for correct client IPs. */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    // Logger depends on env, so this one case writes directly to stderr.
    console.error(`\nInvalid environment configuration:\n${details}\n`);
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
