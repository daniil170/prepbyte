import { useCallback, useState } from 'react';
import { useAuth } from '@features/auth';
import { TEST_DURATION_SEC } from '../domain/testConfig';
import { createSession } from '../domain/testSession';
import { buildTestVariant } from '../domain/testVariantBuilder';
import {
  applyAssignment,
  buildExposureFromSessions,
  releaseUnengaged,
} from '../domain/questionExposure';
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
  const { sessionRepository, questionRepository, exposureRepository, now } =
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
      const userId = user.id || user.uid;

      // 1. Read existing question exposure or backfill from previous sessions
      let userExposure = {};
      let isBackfill = false;
      if (exposureRepository) {
        try {
          const existing = await exposureRepository.getExposure(userId);
          if (existing === null) {
            // Missing exposure document: backfill on the fly from past sessions
            isBackfill = true;
            if (
              typeof sessionRepository?.getAllSessionsForExposure === 'function'
            ) {
              const pastSessions =
                await sessionRepository.getAllSessionsForExposure(userId);
              userExposure = buildExposureFromSessions(pastSessions);
            }
            try {
              await exposureRepository.saveExposure(userId, userExposure);
            } catch (saveErr) {
              // Best-effort write: failed write must never block or fail starting a test
              console.warn(
                'Failed to save backfilled question exposure:',
                saveErr
              );
            }
          } else {
            userExposure = existing;
          }
        } catch (readErr) {
          // Fallback to empty exposure on read failure
          console.warn(
            'Failed to read question exposure, using empty fallback:',
            readErr
          );
          userExposure = {};
        }
      }

      // 2. If an active session exists that will be abandoned, release its unengaged questions
      let activeSession = null;
      if (typeof sessionRepository?.getActiveSession === 'function') {
        try {
          activeSession = await sessionRepository.getActiveSession(userId);
        } catch {
          activeSession = null;
        }
      }

      if (activeSession && !isBackfill) {
        userExposure = releaseUnengaged(userExposure, {
          ...activeSession,
          status: 'abandoned',
        });
      }

      // 3. Build test variant using novelty-aware builder with user exposure
      // Note: getAllQuestions is acceptable while bank fits in memory
      const allQuestions = await questionRepository.getAllQuestions();
      const { questionIds } = buildTestVariant(allQuestions, {
        exposure: userExposure,
      });
      const sessionId = generateSessionId();

      const newSession = createSession({
        id: sessionId,
        userId,
        questionIds,
        durationLimitSec: TEST_DURATION_SEC,
        now,
      });

      // 4. Start the session
      await sessionRepository.startSession(newSession);

      // 5. Update exposure after startSession succeeds (best-effort write)
      if (exposureRepository) {
        try {
          const currentTime = typeof now === 'function' ? now() : Date.now();
          const nextExposure = applyAssignment(
            userExposure,
            questionIds,
            currentTime
          );
          await exposureRepository.saveExposure(userId, nextExposure);
        } catch (exposureErr) {
          // Best-effort write: failed write must never block or fail startTest
          console.warn('Failed to update question exposure:', exposureErr);
        }
      }

      return newSession.id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось начать тест.';
      setError(message);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, [user, sessionRepository, questionRepository, exposureRepository, now]);

  return { startTest, isStarting, error };
}
