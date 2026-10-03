import { useCallback, useEffect, useMemo, useState } from 'react';
import { examRepository as defaultExamRepo } from '../data/examRepository';
import { groupRepository as defaultGroupRepo } from '../data/groupRepository';
import { EXAM_STATUS } from '../domain/examLifecycle';

export function useTeacherExamLive(
  examId,
  {
    examRepo = defaultExamRepo,
    groupRepo = defaultGroupRepo,
  } = {}
) {
  const [exam, setExam] = useState(null);
  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(examId));
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!examId) {
      return () => {};
    }

    // Initial load + Realtime subscriptions
    const unsubscribeExam = examRepo.subscribeToExam(
      examId,
      (updatedExam) => {
        setExam(updatedExam);
        setIsLoading(false);

        if (updatedExam?.groupId) {
          groupRepo
            .getGroupById(updatedExam.groupId)
            .then(setGroup)
            .catch(() => {});
        }
      },
      (err) => {
        setError(err.message || 'Ошибка подписки на экзамен.');
        setIsLoading(false);
      }
    );

    const unsubscribeSessions = examRepo.subscribeToExamSessions(
      examId,
      (updatedSessions) => {
        setSessions(updatedSessions);
      },
      (err) => {
        setError(err.message || 'Ошибка подписки на сессии участников.');
      }
    );

    return () => {
      unsubscribeExam();
      unsubscribeSessions();
    };
  }, [examId, examRepo, groupRepo]);

  const changeStatus = useCallback(
    async (nextStatus) => {
      if (!examId) return;
      try {
        setActionLoading(true);
        const updated = await examRepo.updateExamStatus(examId, nextStatus);
        setExam((prev) => (prev ? { ...prev, ...updated } : prev));
      } catch (err) {
        setError(err.message || 'Ошибка изменения статуса.');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [examId, examRepo]
  );

  const stats = useMemo(() => {
    const totalEnrolled = group?.studentIds?.length || 0;
    const joinedCount = sessions.length;
    const isExamActive = exam?.status === EXAM_STATUS.ACTIVE;
    const waitingCount = sessions.filter(
      (s) => s.status === 'waiting' && !isExamActive
    ).length;
    const inProgressCount = sessions.filter(
      (s) =>
        s.status === 'in_progress' || (isExamActive && s.status === 'waiting')
    ).length;
    const submittedCount = sessions.filter(
      (s) => s.status === 'submitted'
    ).length;

    let totalPoints = 0;
    let gradedCount = 0;
    for (const s of sessions) {
      if (typeof s.totalScore === 'number' && s.status === 'submitted') {
        totalPoints += s.totalScore;
        gradedCount++;
      }
    }

    const averageScore =
      gradedCount > 0 ? (totalPoints / gradedCount).toFixed(1) : 0;

    return {
      totalEnrolled,
      joinedCount,
      waitingCount,
      inProgressCount,
      submittedCount,
      averageScore,
      gradedCount,
    };
  }, [group, sessions, exam?.status]);

  return {
    exam,
    group,
    sessions,
    stats,
    isLoading,
    error,
    actionLoading,
    publishExam: () => changeStatus(EXAM_STATUS.WAITING),
    startExam: () => changeStatus(EXAM_STATUS.ACTIVE),
    finishExam: () => changeStatus(EXAM_STATUS.FINISHED),
    unpublishExam: () => changeStatus(EXAM_STATUS.DRAFT),
  };
}
