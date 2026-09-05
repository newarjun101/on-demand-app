import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { WorkerProfilePage } from '@/pages/WorkerProfilePage';
import { CreateRequestPage } from '@/pages/CreateRequestPage';
import { RequestDetailPage } from '@/pages/RequestDetailPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { BookingDetailPage } from '@/pages/BookingDetailPage';
import { ConversationsListPage } from '@/pages/ConversationsListPage';
import { ConversationPage } from '@/pages/ConversationPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/workers/:id" element={<WorkerProfilePage />} />
              <Route path="/request/create" element={<ProtectedRoute><CreateRequestPage /></ProtectedRoute>} />
              <Route path="/requests/:id" element={<ProtectedRoute><RequestDetailPage /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><ConversationsListPage /></ProtectedRoute>} />
              <Route path="/messages/:conversationId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}