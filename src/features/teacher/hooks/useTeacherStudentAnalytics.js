import { useCallback, useEffect, useState } from 'react';
import { examRepository as defaultExamRepo } from '../data/examRepository';

export function useTeacherStudentAnalytics({
  examId,
  studentId,
  examRepo = defaultExamRepo,
} = {}) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!examId || !studentId) {
      setAnalyticsData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await examRepo.getStudentExamAnalytics(examId, studentId);
      setAnalyticsData(res);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки аналитики ученика.');
    } finally {
      setIsLoading(false);
    }
  }, [examId, studentId, examRepo]);

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
        const res = await examRepo.getStudentExamAnalytics(examId, studentId);
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
  }, [examId, studentId, examRepo]);

  return {
    exam: analyticsData?.exam || null,
    student: analyticsData?.student || null,
    topicBreakdown: analyticsData?.topicBreakdown || {},
    questions: analyticsData?.questions || [],
    isLoading,
    error,
    refresh: fetchAnalytics,
  };
}
