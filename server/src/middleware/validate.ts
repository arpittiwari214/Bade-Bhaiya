import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ValidationError } from '../lib/errors';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Parses and replaces request parts with their validated, coerced values, so
 * handlers receive typed data and never re-check shapes. Unknown keys are
 * stripped by the schemas themselves, which keeps mass-assignment out of
 * write endpoints.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        // Express 5 exposes `query` as a getter, so it is redefined rather than assigned.
        const parsedQuery = schemas.query.parse(req.query);
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('The submitted data is invalid', formatZodError(error)));
        return;
      }
      next(error);
    }
  };
}
