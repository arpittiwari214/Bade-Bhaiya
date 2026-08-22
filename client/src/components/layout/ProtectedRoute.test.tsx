import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/lib/types';

const student: User = {
  id: 'u1',
  email: 'student@example.test',
  phone: null,
  name: 'Test Student',
  role: 'STUDENT',
  emailVerified: true,
  createdAt: new Date().toISOString(),
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Sign in page</p>} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>Secret content</p>} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });

  it('redirects an anonymous visitor to sign in', () => {
    renderAt('/secret');

    expect(screen.getByText('Sign in page')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  // A refresh on a protected page must not bounce the user out before the
  // stored session has been checked.
  it('waits while the session is still loading', () => {
    useAuthStore.setState({ isLoading: true });
    renderAt('/secret');

    expect(screen.queryByText('Sign in page')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the route for an authenticated user', () => {
    useAuthStore.setState({ user: student, isAuthenticated: true, isLoading: false });
    renderAt('/secret');

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('keeps a non-admin out of an admin route', () => {
    useAuthStore.setState({ user: student, isAuthenticated: true, isLoading: false });
    renderAt('/admin');

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('lets an admin through', () => {
    useAuthStore.setState({
      user: { ...student, role: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
    });
    renderAt('/admin');

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
