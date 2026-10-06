import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@features/auth';
import { isMultipleAnswer } from '@features/question-bank';
import {
  finishSession as domainFinishSession,
  goToQuestion as domainGoToQuestion,
  isExpired,
  selectAnswer as domainSelectAnswer,
  toggleFlag as domainToggleFlag,
} from '../domain/testSession';
import { calculateExamScore } from '../domain/scoringEngine';
import { useTestingDependencies } from './useTestingDependencies';

/**
 * Orchestration hook for loading, running, autosaving, and finishing a test session.
 *
 * @param {string} sessionId
 * @returns {{
 *   status: 'loading'|'ready'|'not-found'|'error',
 *   session: object|null,
 *   questions: object[],
 *   currentQuestion: object|null,
 *   actions: {
 *     select: (optionIndex: number) => void,
 *     toggleFlag: () => void,
 *     goTo: (index: number) => void,
 *     finish: () => Promise<void>
 *   },
 *   saveState: 'saved'|'saving'|'error',
 *   errorMessage: string|null
 * }}
 */
export function useTestSession(sessionId) {
  const { user } = useAuth();
  const { sessionRepository, questionRepository, now } =
    useTestingDependencies();

  const [status, setStatus] = useState('loading');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [saveState, setSaveState] = useState('saved');
  const [errorMessage, setErrorMessage] = useState(null);

  // Autosave and concurrency state
  const sessionRef = useRef(session);
  const versionRef = useRef(0);
  const lastSavedVersionRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const hasAutoFinishedRef = useRef(false);
  const doSaveRef = useRef(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Perform save to Firestore repository with concurrency guard
  const doSave = useCallback(
    async (versionToSave) => {
      const currentSession = sessionRef.current;
      if (!currentSession || currentSession.status !== 'in_progress') {
        return;
      }

      setSaveState('saving');
      try {
        await sessionRepository.saveProgress(currentSession);

        // Guard against stale response overwriting a newer version
        if (versionToSave >= lastSavedVersionRef.current) {
          lastSavedVersionRef.current = versionToSave;
          if (versionToSave === versionRef.current) {
            setSaveState('saved');
          }
        }
      } catch {
        setSaveState('error');
        // Retry after 5 seconds
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
        }
        retryTimerRef.current = setTimeout(() => {
          doSaveRef.current?.(versionRef.current);
        }, 5000);
      }
    },
    [sessionRepository]
  );

  useEffect(() => {
    doSaveRef.current = doSave;
  }, [doSave]);

  // Queue autosave debounced at 800ms
  const queueAutosave = useCallback(
    (newSession) => {
      sessionRef.current = newSession;
      versionRef.current += 1;
      const nextVersion = versionRef.current;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        doSave(nextVersion);
      }, 800);
    },
    [doSave]
  );

  const questionsRef = useRef(questions);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Finish session handler
  const finish = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== 'in_progress') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    const currentQuestions = questionsRef.current || [];
    let score = null;
    let questionSnapshots = null;

    if (currentQuestions.length > 0) {
      const evaluation = calculateExamScore(current, currentQuestions);
      score = {
        totalScore: evaluation.totalScore,
        maxPossibleScore: evaluation.maxPossibleScore,
        percentage: evaluation.percentage,
        passed: evaluation.passed,
        byTopicBreakdown: evaluation.byTopicBreakdown,
      };
      questionSnapshots = evaluation.detailedResults;
    }

    const completed = domainFinishSession(current, now, {
      score,
      questionSnapshots,
    });
    sessionRef.current = completed;
    setSession(completed);

    try {
      await sessionRepository.finishSession(completed);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [sessionRepository, now]);

  // Initial load effect
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!sessionId) {
        setStatus('not-found');
        return;
      }

      setStatus('loading');
      setErrorMessage(null);

      try {
        let loadedSession = await sessionRepository.getSessionById(sessionId);

        if (isCancelled) return;

        if (!loadedSession) {
          setStatus('not-found');
          return;
        }

        // Validate session ownership
        const currentUserId = user ? user.id || user.uid : null;
        if (currentUserId && loadedSession.userId !== currentUserId) {
          setStatus('not-found');
          return;
        }

        // Load questions: prefer immutable questionSnapshots if session is completed AND snapshots are valid
        let loadedQuestions = [];
        const hasValidSnapshots =
          loadedSession.status === 'completed' &&
          Array.isArray(loadedSession.questionSnapshots) &&
          loadedSession.questionSnapshots.length > 0 &&
          loadedSession.questionSnapshots.every(
            (q) => Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0
          );

        if (hasValidSnapshots) {
          loadedQuestions = loadedSession.questionSnapshots;
        } else {
          loadedQuestions = await questionRepository.getQuestionsByIds(
            loadedSession.questionIds
          );
        }

        if (isCancelled) return;

        // Auto-finish if already expired on load
        if (
          loadedSession.status === 'in_progress' &&
          isExpired(loadedSession, now)
        ) {
          const evaluation = calculateExamScore(loadedSession, loadedQuestions);
          const score = {
            totalScore: evaluation.totalScore,
            maxPossibleScore: evaluation.maxPossibleScore,
            percentage: evaluation.percentage,
            passed: evaluation.passed,
            byTopicBreakdown: evaluation.byTopicBreakdown,
          };
          const questionSnapshots = evaluation.detailedResults;

          loadedSession = domainFinishSession(loadedSession, now, {
            score,
            questionSnapshots,
          });
          await sessionRepository.finishSession(loadedSession);
        } else if (
          loadedSession.status === 'completed' &&
          (!loadedSession.score || !hasValidSnapshots) &&
          loadedQuestions.length > 0
        ) {
          // Backward compatibility and auto-repair for completed sessions with missing score or corrupted snapshots
          const evaluation = calculateExamScore(loadedSession, loadedQuestions);
          loadedSession = {
            ...loadedSession,
            score: {
              totalScore: evaluation.totalScore,
              maxPossibleScore: evaluation.maxPossibleScore,
              percentage: evaluation.percentage,
              passed: evaluation.passed,
              byTopicBreakdown: evaluation.byTopicBreakdown,
            },
            questionSnapshots: evaluation.detailedResults,
          };
          if (typeof sessionRepository?.saveProgress === 'function') {
            sessionRepository.saveProgress(loadedSession).catch(() => {});
          }
        }

        setSession(loadedSession);
        sessionRef.current = loadedSession;
        setQuestions(loadedQuestions);
        questionsRef.current = loadedQuestions;
        setStatus('ready');
        setSaveState('saved');
      } catch (err) {
        if (isCancelled) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Не удалось загрузить данные варианта.'
        );
      }
    }

    loadData();

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [sessionId, user, sessionRepository, questionRepository, now]);

  // Flush pending save on visibilitychange or pagehide
  useEffect(() => {
    const handleFlush = () => {
      if (
        versionRef.current > lastSavedVersionRef.current &&
        sessionRef.current &&
        sessionRef.current.status === 'in_progress'
      ) {
        sessionRepository.saveProgress(sessionRef.current).catch(() => {});
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };

    window.addEventListener('pagehide', handleFlush);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sessionRepository]);

  // Real-time expiry check to trigger automatic finish
  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      return;
    }

    if (isExpired(session, now)) {
      if (!hasAutoFinishedRef.current) {
        hasAutoFinishedRef.current = true;
        finish();
      }
      return;
    }

    hasAutoFinishedRef.current = false;
    const interval = setInterval(() => {
      if (isExpired(sessionRef.current, now)) {
        if (!hasAutoFinishedRef.current) {
          hasAutoFinishedRef.current = true;
          finish();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, now, finish]);

  // Derived current question
  const currentQuestion =
    session && questions.length > 0
      ? questions[session.currentIndex] || null
      : null;

  // Actions
  const select = useCallback(
    (optionIndex) => {
      if (!sessionRef.current || !currentQuestion) {
        return;
      }
      const multiple = isMultipleAnswer(currentQuestion);
      const updated = domainSelectAnswer(
        sessionRef.current,
        currentQuestion.id,
        optionIndex,
        { multiple }
      );
      if (updated !== sessionRef.current) {
        setSession(updated);
        queueAutosave(updated);
      }
    },
    [currentQuestion, queueAutosave]
  );

  const toggleFlag = useCallback(() => {
    if (!sessionRef.current || !currentQuestion) {
      return;
    }
    const updated = domainToggleFlag(sessionRef.current, currentQuestion.id);
    if (updated !== sessionRef.current) {
      setSession(updated);
      queueAutosave(updated);
    }
  }, [currentQuestion, queueAutosave]);

  const goTo = useCallback(
    (index) => {
      if (!sessionRef.current) {
        return;
      }
      const updated = domainGoToQuestion(sessionRef.current, index);
      if (updated !== sessionRef.current) {
        setSession(updated);
        queueAutosave(updated);
      }
    },
    [queueAutosave]
  );

  return {
    status,
    session,
    questions,
    currentQuestion,
    actions: {
      select,
      toggleFlag,
      goTo,
      finish,
    },
    saveState,
    errorMessage,
  };
}
