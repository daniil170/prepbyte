import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@features/auth';
import {
  examRepository as defaultExamRepo,
  getExamSessionRemainingSeconds,
  isExamSessionExpired,
  EXAM_STATUS,
} from '@features/teacher';
import { questionRepository as defaultQuestionRepo } from '@features/question-bank';

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

  const sessionId = examId && user?.id ? `${examId}_${user.id}` : null;
  const questionsLoadedRef = useRef(false);
  const isAutoSubmittingRef = useRef(false);

  // 1. Subscribe to Exam and Student Session
  useEffect(() => {
    if (!examId || !sessionId) {
      return () => {};
    }

    const unsubExam = examRepo.subscribeToExam(
      examId,
      (updatedExam) => {
        setExam(updatedExam);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Ошибка подписки на экзамен.');
        setIsLoading(false);
      }
    );

    const unsubSession = examRepo.subscribeToStudentSession(
      sessionId,
      (updatedSession) => {
        setSession(updatedSession);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Ошибка подписки на сессию экзамена.');
        setIsLoading(false);
      }
    );

    return () => {
      unsubExam();
      unsubSession();
    };
  }, [examId, sessionId, examRepo]);

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

  // 3. Submit Session Action
  const submit = useCallback(async () => {
    if (!sessionId || isSubmitting) return null;
    try {
      setIsSubmitting(true);
      const result = await examRepo.submitSession(
        sessionId,
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
  }, [sessionId, isSubmitting, examRepo, session, user]);

  // 4. Synchronized Timer based on session.expiresAt or exam.endsAt
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

  // 5. Select/Toggle Answer
  const selectAnswer = useCallback(
    async (questionId, optionIndex, { multiple = false } = {}) => {
      if (!sessionId || !session || session.status !== 'in_progress') return;

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

      // Optimistic local update
      setSession((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: updatedOptions,
        },
      }));

      // Persist to Firestore
      try {
        await examRepo.saveStudentAnswer(sessionId, questionId, updatedOptions);
      } catch (err) {
        console.error('Failed to save student answer:', err);
      }
    },
    [sessionId, session, examRepo]
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

  const isSubmitted = session?.status === 'submitted';
  const isWaiting =
    !isSubmitted &&
    (exam?.status === EXAM_STATUS.WAITING ||
      (session?.status === 'waiting' && exam?.status !== EXAM_STATUS.ACTIVE));
  const isActive =
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
    isWaiting,
    isActive,
    isSubmitted,
    isLoading,
    isSubmitting,
    error,
    selectAnswer,
    submit,
  };
}
