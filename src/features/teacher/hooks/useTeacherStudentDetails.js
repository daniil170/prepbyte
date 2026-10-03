import { useState, useEffect, useCallback } from 'react';
import {
  analyticsRepository,
  calculateKPIs,
  calculateTopicMastery,
  computeScoreTimeline,
} from '@features/analytics';
import { teacherStudentRepository } from '../data/teacherStudentRepository';

export function useTeacherStudentDetails(studentId) {
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [topicMastery, setTopicMastery] = useState(null);
  const [scoreTimeline, setScoreTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!studentId || typeof studentId !== 'string') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [profileData, sessionsData] = await Promise.all([
        teacherStudentRepository.getStudentProfile(studentId),
        analyticsRepository.getUserSessions(studentId),
      ]);

      if (!profileData) {
        throw new Error('Ученик не найден');
      }

      setStudent(profileData);
      setSessions(sessionsData);

      const computedKpis = calculateKPIs(sessionsData);
      const computedMastery = calculateTopicMastery(sessionsData);
      const computedTimeline = computeScoreTimeline(sessionsData);

      setKpis(computedKpis);
      setTopicMastery(computedMastery);
      setScoreTimeline(computedTimeline);
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить данные ученика');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!studentId || typeof studentId !== 'string') {
        if (!isCancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const [profileData, sessionsData] = await Promise.all([
          teacherStudentRepository.getStudentProfile(studentId),
          analyticsRepository.getUserSessions(studentId),
        ]);

        if (!profileData) {
          throw new Error('Ученик не найден');
        }

        if (!isCancelled) {
          setStudent(profileData);
          setSessions(sessionsData);
          setKpis(calculateKPIs(sessionsData));
          setTopicMastery(calculateTopicMastery(sessionsData));
          setScoreTimeline(computeScoreTimeline(sessionsData));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message || 'Не удалось загрузить данные ученика');
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
  }, [studentId]);

  return {
    student,
    sessions,
    kpis,
    topicMastery,
    scoreTimeline,
    loading,
    error,
    refresh: fetchDetails,
  };
}
