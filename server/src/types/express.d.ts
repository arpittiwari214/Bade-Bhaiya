import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthenticatedUser {
      id: string;
      role: UserRole;
      email: string;
    }

    interface Request {
      /** Populated by requireAuth / optionalAuth. Never trust request body ids. */
      user?: AuthenticatedUser;
    }
  }
}

export {};
