import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="size-7" aria-hidden="true" />
              <span className="font-bold text-slate-900 dark:text-slate-50">Bade Bhaiya</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Free, independent guidance for students choosing what to study after Class 10 and 12.
            </p>
          </div>

          <nav aria-label="Explore">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Explore</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/colleges" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Government colleges</Link></li>
              <li><Link to="/scholarships" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Scholarships</Link></li>
              <li><Link to="/courses" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Courses</Link></li>
              <li><Link to="/careers" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Careers</Link></li>
            </ul>
          </nav>

          <nav aria-label="Get started">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Get started</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/quiz" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Aptitude quiz</Link></li>
              <li><Link to="/timeline" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Important dates</Link></li>
              <li><Link to="/register" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Create an account</Link></li>
            </ul>
          </nav>

          <nav aria-label="Support">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Support</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/help" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Help and FAQs</Link></li>
              <li><Link to="/help#contact" className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400">Contact us</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Course, college and scholarship details are indicative. Always confirm fees, cutoffs and
            deadlines on the official college or government portal before you rely on them.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} Bade Bhaiya
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Restores scroll on navigation, which a client-side router does not do. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <ScrollToTop />
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
