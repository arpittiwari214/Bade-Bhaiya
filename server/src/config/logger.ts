import pino from 'pino';
import { env, isDevelopment, isTest } from './env';

/**
 * Structured JSON logging in every environment except local development, where
 * pino-pretty makes it readable. Anything that could identify a user or be
 * replayed as a credential is redacted before it reaches a log sink.
 */
export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.refreshToken',
      'res.headers["set-cookie"]',
      '*.passwordHash',
      '*.tokenHash',
    ],
    censor: '[redacted]',
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
