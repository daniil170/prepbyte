import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@features/auth';
import {
  examRepository as defaultExamRepo,
  getExamSessionRemainingSeconds,
  isExamSessionExpired,
  EXAM_STATUS,
} from '@features/teacher';
import { questionRepository as defaultQuestionRepo } from '@features/question-bank';
import { useExamSecurity } from './useExamSecurity';

export function useStudentExamSession(
  examId,
  {
    examRepo = defaultExamRepo,
    questionRepo = defaultQuestionRepo,
  } = {}
) {
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [rawQuestions, setRawQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(examId && user?.id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [latestViolation, setLatestViolation] = useState(null);

  const initialSessionId = examId && user?.id ? `${examId}_${user.id}` : null;
  const activeSessionId = session?.id || initialSessionId;
  const questionsLoadedRef = useRef(false);
  const isAutoSubmittingRef = useRef(false);

  // 1. Subscribe to Exam and Student Session
  useEffect(() => {
    if (!examId || !user?.id) {
      return () => {};
    }

    const unsubExam = examRepo.subscribeToExam(
      examId,
      (updatedExam) => {
        setExam(updatedExam);
        setIsLoading(false);
      },
      (err) => {
        setError(err?.message || 'Ошибка подписки на экзамен.');
        setIsLoading(false);
      }
    );

    const unsubSession = examRepo.subscribeToStudentSession(
      activeSessionId,
      (updatedSession) => {
        setSession(updatedSession);
        setIsLoading(false);
      },
      (err) => {
        setError(err?.message || 'Ошибка подписки на сессию экзамена.');
        setIsLoading(false);
      }
    );

    return () => {
      unsubExam();
      unsubSession();
    };
  }, [examId, user?.id, activeSessionId, examRepo]);

  // 2. Load Questions when questionIds are ready
  useEffect(() => {
    const idsToFetch = exam?.questionIds || [];
    if (idsToFetch.length === 0) return;
    if (questionsLoadedRef.current) return;

    questionRepo
      .getQuestionsByIds(idsToFetch)
      .then((loaded) => {
        if (loaded && loaded.length > 0) {
          questionsLoadedRef.current = true;
        }
        setRawQuestions(loaded);
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки заданий экзамена.');
      });
  }, [exam?.questionIds, questionRepo]);

  // Derived ordered questions based on session.questionOrder (or exam.questionIds fallback)
  const questions = useMemo(() => {
    if (!rawQuestions || rawQuestions.length === 0) return [];
    const order = session?.questionOrder?.length ? session.questionOrder : exam?.questionIds;
    if (!order || order.length === 0) return rawQuestions;

    const questionMap = new Map(rawQuestions.map((q) => [q.id, q]));
    const ordered = order.map((id) => questionMap.get(id)).filter(Boolean);
    return ordered.length > 0 ? ordered : rawQuestions;
  }, [rawQuestions, session?.questionOrder, exam?.questionIds]);

  // 3. Violation Reporting Action
  const reportViolation = useCallback(
    async ({ sessionId: targetSid, type, eventId, metadata }) => {
      const sid = targetSid || activeSessionId;
      if (!sid || !type) return;

      try {
        const result = await examRepo.reportViolation(sid, type, eventId, metadata);
        if (result?.session) {
          setSession(result.session);
          const vCount = result.session.violationCount || result.violationCount || 0;
          setLatestViolation({
            type,
            violationCount: vCount,
            maxViolations: result.session.maxViolations || 3,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error('Failed to report violation:', err);
      }
    },
    [activeSessionId, examRepo]
  );

  // 4. Client Security Hook
  const { requestFullscreen } = useExamSecurity({
    sessionId: activeSessionId,
    isActive: Boolean(session?.status === 'in_progress'),
    onViolation: reportViolation,
  });

  // 5. Submit Session Action
  const submit = useCallback(async () => {
    if (!activeSessionId || isSubmitting) return null;
    try {
      setIsSubmitting(true);
      const result = await examRepo.submitSession(
        activeSessionId,
        session?.answers || {},
        user
      );
      return result;
    } catch (err) {
      setError(err.message || 'Ошибка отправки экзамена.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [activeSessionId, isSubmitting, examRepo, session, user]);

  // 6. Synchronized Timer based on session.expiresAt or exam.endsAt
  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      return () => {};
    }

    const calculatedExpiresAt =
      session.expiresAt ||
      (session.startedAt && session.durationSeconds
        ? session.startedAt + session.durationSeconds * 1000
        : null) ||
      exam?.endsAt ||
      null;

    const effectiveSession = {
      ...session,
      expiresAt: calculatedExpiresAt,
    };

    const interval = setInterval(() => {
      const rem = getExamSessionRemainingSeconds(effectiveSession);
      setRemainingSeconds(rem);

      if (
        isExamSessionExpired(effectiveSession) &&
        !isAutoSubmittingRef.current &&
        session.status === 'in_progress'
      ) {
        isAutoSubmittingRef.current = true;
        submit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, exam?.endsAt, submit]);

  // 7. Select/Toggle Answer
  const selectAnswer = useCallback(
    async (questionId, optionIndex, { multiple = false } = {}) => {
      if (!activeSessionId || !session || session.status !== 'in_progress') return;

      const currentAnswers = session.answers[questionId] || [];
      let updatedOptions;

      if (multiple) {
        if (currentAnswers.includes(optionIndex)) {
          updatedOptions = currentAnswers.filter((idx) => idx !== optionIndex);
        } else {
          updatedOptions = [...currentAnswers, optionIndex];
        }
        updatedOptions.sort((a, b) => a - b);
      } else {
        updatedOptions = [optionIndex];
      }

      setSession((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: updatedOptions,
        },
      }));

      try {
        await examRepo.saveStudentAnswer(activeSessionId, questionId, updatedOptions);
      } catch (err) {
        console.error('Failed to save student answer:', err);
      }
    },
    [activeSessionId, session, examRepo]
  );

  // 8. Toggle Flag Question
  const toggleFlag = useCallback(
    async (questionId) => {
      if (!activeSessionId || !session || session.status !== 'in_progress' || !questionId) return;

      const currentFlagged = session.flagged || [];
      const isAlreadyFlagged = currentFlagged.includes(questionId);
      const updatedFlagged = isAlreadyFlagged
        ? currentFlagged.filter((id) => id !== questionId)
        : [...currentFlagged, questionId];

      setSession((prev) => ({
        ...prev,
        flagged: updatedFlagged,
      }));

      try {
        await examRepo.toggleQuestionFlag(activeSessionId, questionId);
      } catch (err) {
        console.error('Failed to toggle question flag:', err);
      }
    },
    [activeSessionId, session, examRepo]
  );

  // Auto-activate waiting session when teacher launches exam
  useEffect(() => {
    if (
      exam?.status === EXAM_STATUS.ACTIVE &&
      session?.status === 'waiting' &&
      examId &&
      user?.id
    ) {
      examRepo
        .getOrCreateExamSession({
          examId,
          studentId: user.id,
          studentName: user.name || user.email || user.id,
          groupId: exam.groupId,
          questionIds: exam.questionIds,
          durationSeconds: exam.durationSeconds || 3600,
          examStatus: EXAM_STATUS.ACTIVE,
        })
        .catch((err) => {
          console.error('Failed to auto-activate student session:', err);
        });
    }
  }, [exam?.status, session?.status, examId, user, exam, examRepo]);

  const isDisqualified = session?.status === 'disqualified';
  const isSubmitted = session?.status === 'submitted';
  const isWaiting =
    !isDisqualified &&
    !isSubmitted &&
    (exam?.status === EXAM_STATUS.WAITING ||
      (session?.status === 'waiting' && exam?.status !== EXAM_STATUS.ACTIVE));
  const isActive =
    !isDisqualified &&
    !isSubmitted &&
    !isWaiting &&
    (exam?.status === EXAM_STATUS.ACTIVE || session?.status === 'in_progress');

  return {
    exam,
    session,
    questions,
    currentQuestion: questions[currentIndex] || null,
    currentIndex,
    setCurrentIndex,
    totalQuestions: questions.length || exam?.questionIds?.length || 0,
    remainingSeconds,
    flagged: session?.flagged || [],
    isWaiting,
    isActive,
    isSubmitted,
    isDisqualified,
    violationCount: session?.violationCount || 0,
    maxViolations: session?.maxViolations || 3,
    disqualificationReason: session?.disqualificationReason || null,
    latestViolation,
    requestFullscreen,
    isLoading,
    isSubmitting,
    error,
    selectAnswer,
    toggleFlag,
    submit,
  };
}
