import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleTimeoutWarning } from '@/components/IdleTimeoutWarning';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity-logger';

const IDLE_TIMEOUT = 10 * 60 * 1000;  // 10 minutes
const WARNING_TIME = 60 * 1000;        // 1 minute warning

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
}

export function IdleTimeoutProvider({ children }: IdleTimeoutProviderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleTimeout = async () => {
    // Log the auto-logout
    await logActivity({
      action: 'logout',
      module: 'auth',
      description: 'Auto-logged out due to inactivity',
    });

    await signOut();
    navigate('/auth');
    toast.info('You have been logged out due to inactivity', {
      id: 'idle-timeout',
      duration: 5000,
    });
  };

  const { showWarning, remainingTime, stayLoggedIn } = useIdleTimeout({
    timeout: IDLE_TIMEOUT,
    warningTime: WARNING_TIME,
    onTimeout: handleTimeout,
    enabled: !!user,  // Only active when user is logged in
  });

  return (
    <>
      {children}
      <IdleTimeoutWarning
        open={showWarning}
        remainingSeconds={Math.ceil(remainingTime / 1000)}
        onStayLoggedIn={stayLoggedIn}
      />
    </>
  );
}
