import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so one broken component does not blank the whole
 * app. Data-fetching failures are handled by ErrorState inside each page; this
 * is the last resort for unexpected exceptions.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with a reporting service (Sentry or similar) before launch.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The page ran into an unexpected problem. Reloading usually fixes it.
          </p>

          {import.meta.env.DEV && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-rose-700 dark:bg-slate-900 dark:text-rose-300">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Reload page</Button>
            <ButtonLink to="/" variant="secondary">
              Go home
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }
}
