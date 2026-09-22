import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '@/i18n';
import { AdminAuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AdminAuthProvider>
          {children}
          <Toaster position="top-right" />
        </AdminAuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
