import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Catalogue data (colleges, courses, scholarships) changes rarely, so a
      // generous stale time avoids refetching on every navigation. This matters
      // on the low-bandwidth connections the product targets.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry(failureCount, error) {
        // Retrying a 4xx just repeats the same rejection.
        if (error instanceof ApiError && !error.isTransient) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
});

/** Query keys in one place, so invalidation after a mutation cannot drift. */
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  profile: ['profile', 'me'] as const,

  streams: ['streams'] as const,
  courses: (filters: unknown) => ['courses', filters] as const,
  course: (slug: string) => ['course', slug] as const,
  careers: (filters: unknown) => ['careers', filters] as const,
  career: (slug: string) => ['career', slug] as const,

  colleges: (filters: unknown) => ['colleges', filters] as const,
  college: (slug: string) => ['college', slug] as const,
  collegeLocations: ['colleges', 'locations'] as const,

  scholarships: (filters: unknown) => ['scholarships', filters] as const,
  scholarship: (slug: string) => ['scholarship', slug] as const,
  applications: ['applications', 'mine'] as const,

  quizQuestions: ['quiz', 'questions'] as const,
  quizAttempt: (id: string) => ['quiz', 'attempt', id] as const,
  quizAttempts: ['quiz', 'attempts'] as const,

  roadmap: ['roadmap', 'current'] as const,

  timeline: (filters: unknown) => ['timeline', filters] as const,
  timelineSubscriptions: ['timeline', 'subscriptions'] as const,

  bookmarks: (entityType?: string) => ['bookmarks', entityType ?? 'all'] as const,
  notifications: (filters: unknown) => ['notifications', filters] as const,

  faqs: ['faqs'] as const,
  feedbackSummary: ['feedback', 'summary'] as const,

  adminStats: ['admin', 'stats'] as const,
  adminUsers: (filters: unknown) => ['admin', 'users', filters] as const,
  adminQueries: (filters: unknown) => ['admin', 'contact-queries', filters] as const,
};
