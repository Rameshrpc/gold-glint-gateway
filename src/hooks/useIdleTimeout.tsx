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
