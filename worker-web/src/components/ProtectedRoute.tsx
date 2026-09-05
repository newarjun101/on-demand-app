import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/UI';

export function ProtectedRoute({ children, requireApproved = false }: { children: React.ReactNode; requireApproved?: boolean }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (requireApproved && profile && profile.verificationStatus !== 'APPROVED') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}