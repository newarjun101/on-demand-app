import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AppProviders } from '@/app/AppProviders';
import { useAdminAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { WorkersPage } from '@/pages/WorkersPage';
import { KycPage } from '@/pages/KycPage';
import { KycDetailPage } from '@/pages/KycDetailPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { BoostTiersPage } from '@/pages/BoostTiersPage';
import { BroadcastPage } from '@/pages/BroadcastPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { RolesPage } from '@/pages/RolesPage';
import { AuditPage } from '@/pages/AuditPage';
import { ReviewsPage, DisputesPage, NotificationsPage } from '@/pages/MiscPages';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Spinner } from '@/components/UI';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={40} />
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    </div>
  );
}

function RequireAuth() {
  const { user, isLoading } = useAdminAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  return <AdminLayout />;
}

function RedirectIfAuthed() {
  const { user, isLoading } = useAdminAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<RequireAuth />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/workers" element={<WorkersPage />} />
                  <Route path="/kyc" element={<KycPage />} />
                  <Route path="/kyc/:workerProfileId" element={<KycDetailPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/boost-tiers" element={<BoostTiersPage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/config" element={<ConfigPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/disputes" element={<DisputesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/broadcast" element={<BroadcastPage />} />
                  <Route path="*" element={<RedirectIfAuthed />} />
                </Route>
          </Routes>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}
