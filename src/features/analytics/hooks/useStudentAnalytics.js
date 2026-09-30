import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@features/auth';
import { analyticsRepository as defaultRepo } from '../data/analyticsRepository';
import { buildStudentAnalytics } from '../domain/studentAnalytics';

/**
 * Hook to retrieve and aggregate student learning analytics from Firestore session history.
 *
 * @param {object} [options]
 * @param {object} [options.repository=analyticsRepository] - Injectable repository for testing.
 * @returns {{
 *   analytics: object,
 *   sessions: Array<object>,
 *   isLoading: boolean,
 *   error: string|null,
 *   refetch: () => Promise<void>
 * }}
 */
export function useStudentAnalytics({ repository = defaultRepo } = {}) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user || !user.uid) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userSessions = await repository.getUserSessions(user.uid);
      setSessions(userSessions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить данные аналитики.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, repository]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!user || !user.uid) {
        if (!isCancelled) {
          setSessions([]);
          setIsLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const userSessions = await repository.getUserSessions(user.uid);
        if (!isCancelled) {
          setSessions(userSessions);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить данные аналитики.'
          );
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
  }, [user, repository]);

  const analytics = buildStudentAnalytics(sessions);

  return {
    analytics,
    sessions,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
