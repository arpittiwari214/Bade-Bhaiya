import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/layout/ProtectedRoute';
import { LoadingBlock } from '@/components/ui/Feedback';

/*
 * Routes are code-split so the landing page does not carry the dashboard,
 * admin panel and PDF generator in its initial bundle.
 */
const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const QuizPage = lazy(() => import('@/pages/QuizPage'));
const QuizResultPage = lazy(() => import('@/pages/QuizResultPage'));
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage'));
const CollegesPage = lazy(() => import('@/pages/CollegesPage'));
const CollegeDetailPage = lazy(() => import('@/pages/CollegeDetailPage'));
const ScholarshipsPage = lazy(() => import('@/pages/ScholarshipsPage'));
const ScholarshipDetailPage = lazy(() => import('@/pages/ScholarshipDetailPage'));
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));
const CareersPage = lazy(() => import('@/pages/CareersPage'));
const CareerDetailPage = lazy(() => import('@/pages/CareerDetailPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function SessionLoader({ children }: { children: React.ReactNode }) {
  const initialise = useAuthStore((state) => state.initialise);

  // Restores the session once on mount, before any protected route renders.
  useEffect(() => {
    void initialise();
  }, [initialise]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionLoader>
            <Suspense fallback={<LoadingBlock />}>
              <Routes>
                <Route element={<Layout />}>
                  {/* Public */}
                  <Route index element={<HomePage />} />
                  <Route path="colleges" element={<CollegesPage />} />
                  <Route path="colleges/:slug" element={<CollegeDetailPage />} />
                  <Route path="scholarships" element={<ScholarshipsPage />} />
                  <Route path="scholarships/:slug" element={<ScholarshipDetailPage />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="courses/:slug" element={<CourseDetailPage />} />
                  <Route path="careers" element={<CareersPage />} />
                  <Route path="careers/:slug" element={<CareerDetailPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="help" element={<HelpPage />} />
                  <Route path="quiz" element={<QuizPage />} />

                  {/* Signed out only */}
                  <Route element={<PublicOnlyRoute />}>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                  </Route>

                  {/* Signed in */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="onboarding" element={<OnboardingPage />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="quiz/result/:attemptId" element={<QuizResultPage />} />
                    <Route path="roadmap" element={<RoadmapPage />} />
                    <Route path="applications" element={<ApplicationsPage />} />
                    <Route path="saved" element={<SavedPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>

                  {/* Admin */}
                  <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                    <Route path="admin" element={<AdminPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </SessionLoader>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
