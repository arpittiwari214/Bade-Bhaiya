import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { corsOrigins, env, isProduction } from './config/env';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { httpLogger, requestId } from './middleware/requestContext';
import routes from './routes';

/**
 * Builds the Express app without binding a port, so integration tests can drive
 * it through supertest against an in-process server.
 */
export function createApp(): Express {
  const app = express();

  // Required for correct client IPs behind a load balancer, which rate limiting
  // depends on. Set to the exact hop count rather than `true`, since trusting
  // every proxy lets a client spoof X-Forwarded-For and evade limits.
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (curl, mobile apps, server-to-server)
        // are allowed; browsers always send one for cross-origin calls.
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 86400,
    }),
  );

  app.use(compression());
  app.use(requestId);
  app.use(httpLogger);

  // A body cap prevents a single request from exhausting memory.
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));

  app.use('/api', apiLimiter);

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
