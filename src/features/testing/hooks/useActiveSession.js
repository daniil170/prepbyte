import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@features/auth';
import { finishSession, isExpired } from '../domain/testSession';
import { useTestingDependencies } from './useTestingDependencies';

/**
 * Hook to retrieve the current active (in_progress) session for the authenticated user.
 * If an in-progress session is retrieved but has already expired, it finishes it and returns null.
 *
 * @returns {{
 *   activeSession: object|null,
 *   isLoading: boolean,
 *   refresh: () => Promise<void>
 * }}
 */
export function useActiveSession() {
  const { user } = useAuth();
  const { sessionRepository, now } = useTestingDependencies();

  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!user) {
      return;
    }

    async function load() {
      try {
        const session = await sessionRepository.getActiveSession(user.uid);
        if (isCancelled) return;

        if (!session) {
          setActiveSession(null);
          return;
        }

        if (session.status === 'in_progress' && isExpired(session, now)) {
          const completed = finishSession(session, now);
          await sessionRepository.finishSession(completed);
          if (!isCancelled) {
            setActiveSession(null);
          }
          return;
        }

        if (!isCancelled) {
          setActiveSession(session);
        }
      } catch {
        if (!isCancelled) {
          setActiveSession(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [user, sessionRepository, now, refreshTrigger]);

  return { activeSession, isLoading, refresh };
}
