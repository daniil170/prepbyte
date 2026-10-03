import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@features/auth';
import { teacherStudentRepository } from '../data/teacherStudentRepository';

export function useTeacherStudents(explicitTeacherId) {
  const { user } = useAuth();
  const teacherId = explicitTeacherId || user?.id || user?.uid;
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await teacherStudentRepository.getTeacherStudentsList(teacherId);
      setStudents(data.students || []);
      setGroups(data.groups || []);
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить список учеников');
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
        const data = await teacherStudentRepository.getTeacherStudentsList(teacherId);
        if (!isCancelled) {
          setStudents(data.students || []);
          setGroups(data.groups || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message || 'Не удалось загрузить список учеников');
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
    students,
    groups,
    loading,
    error,
    refresh: fetchStudents,
  };
}
