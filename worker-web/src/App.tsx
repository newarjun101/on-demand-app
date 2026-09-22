import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/app/AppProviders';
import { WorkerLayout } from '@/layouts/WorkerLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BoostPage } from '@/pages/BoostPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { RequestDetailWorkerPage } from '@/pages/RequestDetailWorkerPage';
import { JobsPage } from '@/pages/JobsPage';
import { JobDetailPage } from '@/pages/JobDetailPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { EarningsPage } from '@/pages/EarningsPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { AvailabilityPage } from '@/pages/AvailabilityPage';
import { ConversationsListPage } from '@/pages/ConversationsListPage';
import { ConversationPage } from '@/pages/ConversationPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<WorkerLayout />}>
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute requireApproved><DashboardPage /></ProtectedRoute>} />
                <Route path="/boost" element={<ProtectedRoute requireApproved><BoostPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute requireApproved><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/requests" element={<ProtectedRoute requireApproved><RequestsPage /></ProtectedRoute>} />
                <Route path="/requests/:id" element={<ProtectedRoute requireApproved><RequestDetailWorkerPage /></ProtectedRoute>} />
                <Route path="/jobs" element={<ProtectedRoute requireApproved><JobsPage /></ProtectedRoute>} />
                <Route path="/jobs/:id" element={<ProtectedRoute requireApproved><JobDetailPage /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute requireApproved><CalendarPage /></ProtectedRoute>} />
                <Route path="/earnings" element={<ProtectedRoute requireApproved><EarningsPage /></ProtectedRoute>} />
                <Route path="/services" element={<ProtectedRoute requireApproved><ServicesPage /></ProtectedRoute>} />
                <Route path="/availability" element={<ProtectedRoute requireApproved><AvailabilityPage /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute requireApproved><ConversationsListPage /></ProtectedRoute>} />
                <Route path="/messages/:conversationId" element={<ProtectedRoute requireApproved><ConversationPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}