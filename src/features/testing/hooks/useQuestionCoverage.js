import { useEffect, useState } from 'react';
import { useAuth } from '@features/auth';
import { useTestingDependencies } from './useTestingDependencies';

/**
 * Hook for calculating user's bank coverage metrics.
 *
 * @returns {{
 *   total: number,
 *   seen: number,
 *   unseen: number,
 *   isLoading: boolean,
 *   error: string|null
 * }}
 */
export function useQuestionCoverage() {
  const { user } = useAuth();
  const { questionRepository, exposureRepository } = useTestingDependencies();

  const [total, setTotal] = useState(0);
  const [seen, setSeen] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCoverage() {
      setIsLoading(true);
      setError(null);

      try {
        const userId = user ? user.id || user.uid : null;

        const [totalCount, exposureData] = await Promise.all([
          typeof questionRepository?.getQuestionCount === 'function'
            ? questionRepository.getQuestionCount()
            : Promise.resolve(0),
          userId && typeof exposureRepository?.getExposure === 'function'
            ? exposureRepository.getExposure(userId).catch(() => ({}))
            : Promise.resolve({}),
        ]);

        if (cancelled) return;

        const totalNum = typeof totalCount === 'number' ? totalCount : 0;
        const exposureObj = exposureData || {};
        const seenNum = Object.keys(exposureObj).length;

        setTotal(totalNum);
        setSeen(seenNum);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Не удалось загрузить данные покрытия.'
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCoverage();

    return () => {
      cancelled = true;
    };
  }, [user, questionRepository, exposureRepository]);

  const unseen = Math.max(0, total - seen);

  return {
    total,
    seen,
    unseen,
    isLoading,
    error,
  };
}
