import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredFeature?: 'loans' | 'sale_agreements';
}

export default function ProtectedRoute({ children, requiredFeature }: ProtectedRouteProps) {
  const { user, client, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Feature flag checks
  if (requiredFeature && client) {
    if (requiredFeature === 'loans' && !client.supports_loans) {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredFeature === 'sale_agreements' && !client.supports_sale_agreements) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
