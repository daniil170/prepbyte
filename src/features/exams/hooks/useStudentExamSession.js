import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [questions, setQuestions] = useState([]);
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
    if (!exam?.questionIds || exam.questionIds.length === 0) return;
    if (questionsLoadedRef.current) return;

    questionRepo
      .getQuestionsByIds(exam.questionIds)
      .then((loaded) => {
        setQuestions(loaded);
        questionsLoadedRef.current = true;
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки заданий экзамена.');
      });
  }, [exam?.questionIds, questionRepo]);

  // 3. Submit Session Action
  const submit = useCallback(async () => {
    if (!sessionId || isSubmitting) return null;
    try {
      setIsSubmitting(true);
      const result = await examRepo.submitSession(sessionId, questions);
      return result;
    } catch (err) {
      setError(err.message || 'Ошибка отправки экзамена.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, isSubmitting, examRepo, questions]);

  // 4. Synchronized Timer based on session.expiresAt or exam.endsAt
  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      return () => {};
    }

    const effectiveSession = {
      ...session,
      expiresAt: session.expiresAt || exam?.endsAt || null,
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

  const isWaiting =
    exam?.status === EXAM_STATUS.WAITING || session?.status === 'waiting';
  const isActive =
    (exam?.status === EXAM_STATUS.ACTIVE || session?.status === 'in_progress') &&
    session?.status !== 'submitted';
  const isSubmitted = session?.status === 'submitted';

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
