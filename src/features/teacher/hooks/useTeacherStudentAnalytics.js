import { useCallback, useEffect, useState } from 'react';
import { examRepository as defaultExamRepo } from '../data/examRepository';

export function useTeacherStudentAnalytics({
  examId,
  studentId,
  examRepo = defaultExamRepo,
} = {}) {
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (attemptNum = selectedAttempt) => {
    if (!examId || !studentId) {
      setAnalyticsData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await examRepo.getStudentExamAnalytics(examId, studentId, attemptNum);
      setAnalyticsData(res);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки аналитики ученика.');
    } finally {
      setIsLoading(false);
    }
  }, [examId, studentId, selectedAttempt, examRepo]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!examId || !studentId) {
        if (!isCancelled) setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await examRepo.getStudentExamAnalytics(examId, studentId, selectedAttempt);
        if (!isCancelled) {
          setAnalyticsData(res);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Ошибка загрузки аналитики ученика.');
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
  }, [examId, studentId, selectedAttempt, examRepo]);

  return {
    exam: analyticsData?.exam || null,
    student: analyticsData?.student || null,
    attemptsList: analyticsData?.attemptsList || [],
    violations: analyticsData?.violations || [],
    topicBreakdown: analyticsData?.topicBreakdown || {},
    questions: analyticsData?.questions || [],
    selectedAttempt,
    setSelectedAttempt,
    isLoading,
    error,
    refresh: fetchAnalytics,
  };
}
