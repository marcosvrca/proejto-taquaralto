import { useEffect, useRef, useCallback, useState } from 'react';

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_BEFORE_MS = 2 * 60 * 1000; // aviso 2 minutos antes

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

export const useInactivityTimeout = (
  onTimeout: () => void,
  enabled: boolean
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const warningVisibleRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    timerRef.current = null;
    warningTimerRef.current = null;
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    warningVisibleRef.current = false;
    setShowWarning(false);

    warningTimerRef.current = setTimeout(() => {
      warningVisibleRef.current = true;
      setShowWarning(true);
    }, INACTIVITY_MS - WARNING_BEFORE_MS);

    timerRef.current = setTimeout(() => {
      warningVisibleRef.current = false;
      setShowWarning(false);
      onTimeoutRef.current();
    }, INACTIVITY_MS);
  }, [clearTimers]);

  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      warningVisibleRef.current = false;
      setShowWarning(false);
      return;
    }

    resetTimer();

    const handleActivity = () => {
      if (!warningVisibleRef.current) {
        resetTimer();
      }
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [enabled, resetTimer, clearTimers]);

  return { showWarning, stayLoggedIn };
};
