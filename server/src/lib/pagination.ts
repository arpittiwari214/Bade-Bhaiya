import { z } from 'zod';

export const MAX_PAGE_SIZE = 100;

/**
 * Shared query shape for every list endpoint. pageSize is capped so a single
 * request cannot ask the database for an unbounded result set.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function toPrismaPage({ page, pageSize }: Pagination): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/** Trimmed, length-capped free-text search term. */
export const searchSchema = z.string().trim().min(1).max(120).optional();

export const cuidSchema = z.string().min(1).max(64);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase hyphenated slug');
