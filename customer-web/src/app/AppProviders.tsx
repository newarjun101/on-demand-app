import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider, useI18n } from '@/i18n';
import { setZodTranslator } from '@/utils/zod-helpers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

function ZodBridge() {
  const { t } = useI18n();
  setZodTranslator(t);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ZodBridge />
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{ duration: 5000, style: { maxWidth: '420px' } }}
          />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
