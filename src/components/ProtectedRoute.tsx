import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type FeatureFlag = 'loans' | 'sale_agreements' | 'accounting' | 'reports' | 'notifications' | 'gold_vault' | 'agents' | 'customer_portal' | 'approvals';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredFeature?: FeatureFlag;
}

const featureFlagMap: Record<FeatureFlag, string> = {
  loans: 'supports_loans',
  sale_agreements: 'supports_sale_agreements',
  accounting: 'supports_accounting',
  reports: 'supports_reports',
  notifications: 'supports_notifications',
  gold_vault: 'supports_gold_vault',
  agents: 'supports_agents',
  customer_portal: 'supports_customer_portal',
  approvals: 'supports_approvals',
};

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
    const flagKey = featureFlagMap[requiredFeature] as keyof typeof client;
    if (flagKey && client[flagKey] === false) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
