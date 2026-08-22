import { ButtonLink } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-bold text-brand-700 dark:text-brand-400">404</p>

      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
        We could not find that page
      </h1>

      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        The link may be out of date, or the page may have moved. Try one of these instead.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/">Go home</ButtonLink>
        <ButtonLink to="/colleges" variant="secondary">
          Browse colleges
        </ButtonLink>
        <ButtonLink to="/scholarships" variant="secondary">
          Find scholarships
        </ButtonLink>
      </div>
    </div>
  );
}
