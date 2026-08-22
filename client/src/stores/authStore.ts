import { create } from 'zustand';
import { apiGet, apiPost, getRefreshToken, setSessionExpiredHandler, setTokens } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  /** True until the initial session check finishes, so routes do not flash. */
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'STUDENT' | 'PARENT';
  }) => Promise<User>;
  logout: () => Promise<void>;
  /** Restores the session from a stored refresh token on app start. */
  initialise: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  async login(email, password) {
    const result = await apiPost<AuthResponse>('/auth/login', { email, password });
    setTokens(result.tokens);
    set({ user: result.user, isAuthenticated: true, isLoading: false });
    return result.user;
  },

  async register(input) {
    const result = await apiPost<AuthResponse>('/auth/register', input);
    setTokens(result.tokens);
    set({ user: result.user, isAuthenticated: true, isLoading: false });
    return result.user;
  },

  async logout() {
    const refreshToken = getRefreshToken();

    // Revoke server-side, but never let a failed call trap the user in a
    // signed-in state locally.
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken }).catch(() => undefined);
    }

    setTokens(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  async initialise() {
    if (!getRefreshToken()) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      // A 401 here is retried once with a refreshed token by the interceptor,
      // so this both validates and silently renews the session.
      const result = await apiGet<{ user: User }>('/auth/me');
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch {
      setTokens(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser(user) {
    set({ user });
  },
}));

// When a refresh fails mid-session, clear state so protected routes redirect.
setSessionExpiredHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});

export const selectIsAdmin = (state: AuthState): boolean => state.user?.role === 'ADMIN';
