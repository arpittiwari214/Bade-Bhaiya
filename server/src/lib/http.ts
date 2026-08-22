import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 5 forwards rejected promises to the error handler, but only for
 * handlers it recognises as returning one. Wrapping keeps that behaviour
 * explicit and consistent across every route.
 */
export function asyncHandler<T extends RequestHandler>(handler: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function buildPageMeta(page: number, pageSize: number, total: number): PageMeta {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/** Envelope used by every successful response, so clients parse one shape. */
export function sendData<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ data });
}

export function sendPage<T>(
  res: Response,
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): Response {
  return res.status(200).json({ data: items, meta: buildPageMeta(page, pageSize, total) });
}
