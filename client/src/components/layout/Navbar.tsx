import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { ButtonLink } from '@/components/ui/Button';

const PUBLIC_LINKS = [
  { to: '/colleges', label: 'Colleges' },
  { to: '/scholarships', label: 'Scholarships' },
  { to: '/courses', label: 'Courses' },
  { to: '/careers', label: 'Careers' },
  { to: '/timeline', label: 'Timeline' },
];

const AUTH_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/roadmap', label: 'My roadmap' },
  { to: '/saved', label: 'Saved' },
];

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const label = `Theme: ${theme}. Switch to ${next}.`;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? (
        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.75 15.5A9.75 9.75 0 1 1 8.5 2.25a7.75 7.75 0 0 0 13.25 13.25Z" />
        </svg>
      ) : theme === 'light' ? (
        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 1.5v2.25M12 20.25v2.25M4.22 4.22l1.59 1.59M18.19 18.19l1.59 1.59M1.5 12h2.25M20.25 12h2.25M4.22 19.78l1.59-1.59M18.19 5.81l1.59-1.59" />
        </svg>
      ) : (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 18v3" />
        </svg>
      )}
    </button>
  );
}

function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiGet<{ unreadNotifications: number }>('/dashboard'),
    // Cheap freshness: the badge matters, but not to the second.
    staleTime: 60_000,
    retry: false,
  });

  const count = data?.unreadNotifications ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape, which a bare onBlur would miss.
  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex size-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white"
      >
        {initials || 'U'}
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>

          <div className="py-1">
            <Link role="menuitem" to="/profile" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Profile
            </Link>
            <Link role="menuitem" to="/applications" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              My applications
            </Link>
            {user.role === 'ADMIN' && (
              <Link role="menuitem" to="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                Admin
              </Link>
            )}
          </div>

          <div className="border-t border-slate-200 py-1 dark:border-slate-800">
            <button
              role="menuitem"
              type="button"
              onClick={async () => {
                setOpen(false);
                await logout();
                navigate('/');
              }}
              className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Route changes must close the drawer, otherwise it covers the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = isAuthenticated ? [...AUTH_LINKS, ...PUBLIC_LINKS] : PUBLIC_LINKS;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-8" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Bade Bhaiya
          </span>
        </Link>

        <div className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink to="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" size="sm">
                Get started
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {!isAuthenticated && (
            <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <ButtonLink to="/login" variant="secondary" fullWidth>
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" fullWidth>
                Get started
              </ButtonLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

