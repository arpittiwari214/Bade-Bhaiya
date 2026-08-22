import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingBlock } from '@/components/ui/Feedback';
import type { UserRole } from '@/lib/types';

/**
 * Guards authenticated routes. While the session is still being restored it
 * renders a loader rather than redirecting, otherwise a refresh on a protected
 * page would bounce the user to sign-in before the token check finishes.
 */
export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (isLoading) return <LoadingBlock label="Checking your session…" />;

  if (!isAuthenticated) {
    // Carries the attempted path so sign-in can return the user to it.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/** Keeps signed-in users off the sign-in and registration pages. */
export function PublicOnlyRoute() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isLoading) return <LoadingBlock />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
