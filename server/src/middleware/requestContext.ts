import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger';

/**
 * Assigns every request an id, echoes it back on the response, and makes it
 * available to the logger. When a user reports an error, the id shown in the
 * UI locates the exact request in the logs.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.length <= 128 ? incoming : crypto.randomUUID();
  res.setHeader('x-request-id', id);
  next();
};

export const httpLogger = pinoHttp({
  logger,
  genReqId: (_req, res) => res.getHeader('x-request-id') as string,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/health/ready',
  },
});
