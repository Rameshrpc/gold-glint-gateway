

## Plan: Auto Sign-Out After 10 Minutes of Inactivity

### Overview

Implement an automatic session timeout feature that signs users out after 10 minutes of inactivity. This is a critical security feature for a financial application handling sensitive loan and customer data.

### How It Works

The system will track user activity through various DOM events (mouse movement, keyboard input, clicks, scroll, touch). A timer resets on each activity. When 10 minutes pass without any activity:

1. A warning dialog appears at the 9-minute mark (1 minute before timeout)
2. User can click "Stay Logged In" to reset the timer
3. If no response, the user is automatically signed out at the 10-minute mark
4. A toast notification confirms the session timeout
5. User is redirected to the login page

---

### Files to Create/Modify

#### 1. Create `src/hooks/useIdleTimeout.tsx` (NEW FILE)

A custom hook that manages the idle detection logic:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  timeout: number;           // Total timeout in ms (10 minutes = 600000)
  warningTime: number;       // Warning before timeout in ms (1 minute = 60000)
  onTimeout: () => void;     // Called when timeout occurs
  onWarning?: () => void;    // Called when warning threshold reached
  enabled?: boolean;         // Enable/disable the timeout
}

export function useIdleTimeout({
  timeout,
  warningTime,
  onTimeout,
  onWarning,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningTime);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Reset all timers and start fresh
  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setShowWarning(false);
    setRemainingTime(warningTime);

    if (!enabled) return;

    // Set warning timer (fires 1 minute before timeout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(warningTime);
      onWarning?.();

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, timeout - warningTime);

    // Set final timeout
    timeoutRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setShowWarning(false);
      onTimeout();
    }, timeout);
  }, [timeout, warningTime, onTimeout, onWarning, enabled]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    if (enabled && !showWarning) {
      resetTimers();
    }
  }, [enabled, showWarning, resetTimers]);

  // Manual reset (e.g., when user clicks "Stay Logged In")
  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity events to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 1000); // Throttle to once per second
      handleActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Initial timer start
    resetTimers();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledHandler);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [enabled, handleActivity, resetTimers]);

  return {
    showWarning,
    remainingTime,
    stayLoggedIn,
  };
}
```

---

#### 2. Create `src/components/IdleTimeoutWarning.tsx` (NEW FILE)

A dialog component that warns users before timeout:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface IdleTimeoutWarningProps {
  open: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
}

export function IdleTimeoutWarning({
  open,
  remainingSeconds,
  onStayLoggedIn,
}: IdleTimeoutWarningProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Your session will expire in{' '}
            <span className="font-bold text-foreground">
              {remainingSeconds} seconds
            </span>{' '}
            due to inactivity. Click below to stay logged in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

#### 3. Create `src/components/IdleTimeoutProvider.tsx` (NEW FILE)

A provider component that wraps the app and manages timeout state:

```typescript
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
```

---

#### 4. Modify `src/App.tsx`

Wrap the protected routes with the IdleTimeoutProvider:

```typescript
// Add import
import { IdleTimeoutProvider } from '@/components/IdleTimeoutProvider';

// Wrap routes inside BrowserRouter and AuthProvider
<BrowserRouter>
  <AuthProvider>
    <IdleTimeoutProvider>
      <Routes>
        {/* ... all existing routes ... */}
      </Routes>
    </IdleTimeoutProvider>
  </AuthProvider>
</BrowserRouter>
```

---

### User Experience Flow

```text
User Activity Timeline:
────────────────────────────────────────────────────────────────────►
│                                                                    
│  User active      No activity...       Warning appears    Auto logout
│  (timer resets)                        (9 min mark)       (10 min mark)
│                                              │                  │
│  ◄─────────────────────────────────────────► │ ◄──────────────► │
│              9 minutes                       │    1 minute      │
│                                              │                  │
│                                         ┌────┴────┐             │
│                                         │ Dialog  │             │
│                                         │ "Stay   │─── User clicks ──► Timer resets
│                                         │ Logged  │
│                                         │ In?"    │─── No action ────► Logout
│                                         └─────────┘
```

---

### Technical Notes

1. **Event Throttling**: Activity events are throttled to 1 per second to prevent excessive timer resets
2. **Cleanup**: All timers and event listeners are properly cleaned up on unmount
3. **Conditional**: Timeout only active when a user is authenticated (`enabled: !!user`)
4. **Activity Logging**: Auto-logout is logged to `activity_logs` table for audit trail
5. **Toast Notification**: Uses fixed ID `'idle-timeout'` to prevent duplicate toasts

---

### Security Considerations

- **Financial App Compliance**: 10-minute timeout is common for banking/financial apps
- **Warning Period**: 1-minute warning gives users time to respond without data loss
- **Audit Trail**: All auto-logouts are logged for compliance/security review
- **No Local Storage Persistence**: Timeout is session-based, not stored in localStorage

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useIdleTimeout.tsx` | Create | Core idle detection logic |
| `src/components/IdleTimeoutWarning.tsx` | Create | Warning dialog component |
| `src/components/IdleTimeoutProvider.tsx` | Create | Provider that integrates everything |
| `src/App.tsx` | Modify | Wrap routes with IdleTimeoutProvider |

