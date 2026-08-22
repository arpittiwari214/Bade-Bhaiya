import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps list filters in the URL so a filtered view can be bookmarked, shared,
 * and survives the back button. Empty values are removed rather than written as
 * blanks, which keeps the query string readable.
 */
export function useFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = searchParams.get(String(key));
      if (value !== null) result[key] = value as T[keyof T];
    }
    return result;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key: keyof T, value: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          if (value) {
            next.set(String(key), value);
          } else {
            next.delete(String(key));
          }

          // Any filter change invalidates the current page position.
          if (key !== 'page') next.delete('page');

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const activeCount = useMemo(
    () =>
      (Object.keys(defaults) as (keyof T)[]).filter(
        (key) => key !== 'page' && filters[key] && filters[key] !== defaults[key],
      ).length,
    [filters, defaults],
  );

  return { filters, setFilter, resetFilters, activeCount };
}

/**
 * Delays propagating a value until typing pauses, so each keystroke in a search
 * box does not fire a request.
 */
export function useDebounced<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
