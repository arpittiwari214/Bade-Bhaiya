import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';
import { AppError, NotFoundError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
};

interface NormalisedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  /** Unexpected errors are logged at error level and alerted on. */
  unexpected: boolean;
}

function normalise(error: unknown): NormalisedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      unexpected: false,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'The submitted data is invalid',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
      unexpected: false,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | undefined)?.join(', ');
        return {
          statusCode: 409,
          code: 'CONFLICT',
          message: target
            ? `A record with this ${target} already exists`
            : 'A record with these details already exists',
          unexpected: false,
        };
      }
      case 'P2025':
        return {
          statusCode: 404,
          code: 'NOT_FOUND',
          message: 'The requested record does not exist',
          unexpected: false,
        };
      case 'P2003':
        return {
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'A referenced record does not exist',
          unexpected: false,
        };
      default:
        break;
    }
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Request body is not valid JSON',
      unexpected: false,
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    unexpected: true,
  };
}

/**
 * The single place errors become responses. Unexpected failures are logged
 * with their stack but reported to the client as a generic 500, so internal
 * structure and query details are never disclosed.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const normalised = normalise(error);

  const context = {
    method: req.method,
    path: req.originalUrl,
    statusCode: normalised.statusCode,
    userId: req.user?.id,
    requestId: res.getHeader('x-request-id'),
  };

  if (normalised.unexpected) {
    logger.error({ ...context, err: error }, 'Unhandled error');
  } else if (normalised.statusCode >= 500) {
    logger.error({ ...context, err: error }, normalised.message);
  } else {
    logger.warn(context, normalised.message);
  }

  const body: Record<string, unknown> = {
    error: {
      code: normalised.code,
      message: normalised.message,
    },
  };

  if (normalised.details !== undefined) {
    (body.error as Record<string, unknown>).details = normalised.details;
  }

  if (!isProduction && normalised.unexpected && error instanceof Error) {
    (body.error as Record<string, unknown>).stack = error.stack;
  }

  res.status(normalised.statusCode).json(body);
};
