import { useCallback, useState } from 'react';
import { useAuth } from '@features/auth';
import { TEST_DURATION_SEC } from '../domain/testConfig';
import { createSession } from '../domain/testSession';
import { buildTestVariant } from '../domain/testVariantBuilder';
import { useTestingDependencies } from './useTestingDependencies';

function generateSessionId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for initiating a new 40-question test session.
 * Note: getAllQuestions is acceptable while the question bank fits in memory.
 *
 * @returns {{
 *   startTest: () => Promise<string>,
 *   isStarting: boolean,
 *   error: string|null
 * }}
 */
export function useStartTest() {
  const { user } = useAuth();
  const { sessionRepository, questionRepository, now } =
    useTestingDependencies();

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  const startTest = useCallback(async () => {
    if (!user) {
      const authErr = new Error(
        'Для прохождения теста необходимо авторизоваться.'
      );
      setError(authErr.message);
      throw authErr;
    }

    setIsStarting(true);
    setError(null);

    try {
      // Note: getAllQuestions is acceptable while bank fits in memory
      const allQuestions = await questionRepository.getAllQuestions();
      const questionIds = buildTestVariant(allQuestions);
      const sessionId = generateSessionId();

      const newSession = createSession({
        id: sessionId,
        userId: user.uid,
        questionIds,
        durationLimitSec: TEST_DURATION_SEC,
        now,
      });

      await sessionRepository.startSession(newSession);
      return newSession.id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось начать тест.';
      setError(message);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, [user, sessionRepository, questionRepository, now]);

  return { startTest, isStarting, error };
}
