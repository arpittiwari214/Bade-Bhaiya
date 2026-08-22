import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

/**
 * Single axios instance for the whole app. It attaches the access token,
 * transparently refreshes it once on a 401, and normalises server errors into
 * a shape the UI can render.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Token storage
//
// Kept in module scope with a localStorage mirror. The auth store is the owner;
// these setters exist so interceptors can read tokens without importing the
// store and creating a cycle.
// ---------------------------------------------------------------------------

const ACCESS_KEY = 'bade-bhaiya-access-token';
const REFRESH_KEY = 'bade-bhaiya-refresh-token';

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY);

export function setTokens(next: { accessToken: string; refreshToken: string } | null): void {
  if (next) {
    accessToken = next.accessToken;
    refreshToken = next.refreshToken;
    localStorage.setItem(ACCESS_KEY, next.accessToken);
    localStorage.setItem(REFRESH_KEY, next.refreshToken);
  } else {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

/** Set by the auth store so a failed refresh can clear app state and redirect. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  /** True when retrying the same request might succeed. */
  get isTransient(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      error?: { code?: string; message?: string; details?: FieldError[] };
    }>;

    if (axiosError.code === 'ECONNABORTED') {
      return new ApiError(0, 'TIMEOUT', 'The request took too long. Please try again.');
    }

    if (!axiosError.response) {
      return new ApiError(
        0,
        'NETWORK_ERROR',
        'Could not reach the server. Check your internet connection.',
      );
    }

    const body = axiosError.response.data?.error;
    return new ApiError(
      axiosError.response.status,
      body?.code ?? 'UNKNOWN',
      body?.message ?? 'Something went wrong. Please try again.',
      Array.isArray(body?.details) ? body.details : [],
    );
  }

  return new ApiError(0, 'UNKNOWN', 'Something went wrong. Please try again.');
}

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableRequest extends AxiosRequestConfig {
  _retried?: boolean;
}

/**
 * While a refresh is in flight, other 401s wait on the same promise instead of
 * each firing their own refresh. Without this, a dashboard that fires six
 * parallel requests would trigger six rotations and invalidate its own tokens.
 */
let refreshInFlight: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const token = refreshToken;
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Your session has ended. Please sign in.');

  // A bare axios call, so this request does not re-enter the interceptors.
  const response = await axios.post<{
    data: { tokens: { accessToken: string; refreshToken: string } };
  }>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken: token },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 },
  );

  const tokens = response.data.data.tokens;
  setTokens(tokens);
  return tokens.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(toApiError(error));
    }

    const original = error.config as RetriableRequest | undefined;
    const status = error.response.status;

    const isAuthEndpoint =
      typeof original?.url === 'string' && original.url.includes('/auth/');

    // Only a 401 on a normal request is worth refreshing for. A 401 from the
    // auth endpoints themselves means the credentials are the problem.
    if (status === 401 && original && !original._retried && !isAuthEndpoint && refreshToken) {
      original._retried = true;

      try {
        refreshInFlight ??= performRefresh().finally(() => {
          refreshInFlight = null;
        });

        const newToken = await refreshInFlight;

        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api.request(original);
      } catch {
        setTokens(null);
        onSessionExpired?.();
        return Promise.reject(
          new ApiError(401, 'UNAUTHORIZED', 'Your session has ended. Please sign in again.'),
        );
      }
    }

    return Promise.reject(toApiError(error));
  },
);

// ---------------------------------------------------------------------------
// Typed helpers
// ---------------------------------------------------------------------------

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/** Unwraps the `{ data }` envelope every endpoint returns. */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.get<{ data: T }>(url, config);
  return response.data.data;
}

export async function apiGetPage<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<Paginated<T>> {
  const response = await api.get<Paginated<T>>(url, config);
  return response.data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.post<{ data: T }>(url, body, config);
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.patch<{ data: T }>(url, body);
  return response.data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.put<{ data: T }>(url, body);
  return response.data.data;
}

export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const response = await api.delete<{ data: T }>(url, body ? { data: body } : undefined);
  return response.data.data;
}
