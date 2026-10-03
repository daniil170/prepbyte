import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@features/auth';
import { teacherStudentRepository } from '../data/teacherStudentRepository';

export function useTeacherOverview(explicitTeacherId) {
  const { user } = useAuth();
  const teacherId = explicitTeacherId || user?.id || user?.uid;
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await teacherStudentRepository.getTeacherOverviewData(teacherId);
      setOverview(data);
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить аналитику учителя');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!teacherId) {
        if (!isCancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const data = await teacherStudentRepository.getTeacherOverviewData(teacherId);
        if (!isCancelled) {
          setOverview(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message || 'Не удалось загрузить аналитику учителя');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [teacherId]);

  return {
    overview,
    loading,
    error,
    refresh: fetchOverview,
  };
}
