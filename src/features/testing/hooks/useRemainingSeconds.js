import { useEffect, useRef, useState } from 'react';
import { getRemainingSeconds, isExpired } from '../domain/testSession';
import { useTestingDependencies } from './useTestingDependencies';

/**
 * Real-time deadline countdown hook for a test session.
 * Recalculates remaining seconds each second directly against session deadline.
 * Stops automatically when session is not 'in_progress'.
 * Triggers onExpire callback once when remaining seconds reach 0.
 *
 * @param {object|null} session - Active test session.
 * @param {object} [options]
 * @param {() => void} [options.onExpire] - Optional callback fired when timer reaches 0.
 * @returns {number} Remaining seconds (never negative).
 */
export function useRemainingSeconds(session, { onExpire } = {}) {
  const { now } = useTestingDependencies();
  const [remaining, setRemaining] = useState(() =>
    session ? getRemainingSeconds(session, now) : 0
  );

  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      return;
    }

    const checkAndTick = () => {
      const currentRemaining = getRemainingSeconds(session, now);
      setRemaining(currentRemaining);

      if (currentRemaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (typeof onExpireRef.current === 'function') {
          onExpireRef.current();
        }
      }
    };

    // Check immediately on mount/session update
    if (isExpired(session, now)) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        setRemaining(0);
        if (typeof onExpireRef.current === 'function') {
          onExpireRef.current();
        }
      }
      return;
    }

    hasExpiredRef.current = false;
    checkAndTick();

    const intervalId = setInterval(checkAndTick, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [session, now]);

  return remaining;
}
