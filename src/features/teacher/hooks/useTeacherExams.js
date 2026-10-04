import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@features/auth';
import {
  questionRepository as defaultQuestionRepo,
  generateCurriculumQuestions,
} from '@features/question-bank';
import { buildTestVariant } from '@features/testing';
import { examRepository as defaultRepo } from '../data/examRepository';
import { groupRepository as defaultGroupRepo } from '../data/groupRepository';
import { EXAM_STATUS } from '../domain/examLifecycle';

export function useTeacherExams({
  examRepo = defaultRepo,
  groupRepo = defaultGroupRepo,
  questionRepo = defaultQuestionRepo,
} = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [exams, setExams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchExamsAndGroups = useCallback(async () => {
    if (!userId) {
      setExams([]);
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [fetchedExams, fetchedGroups] = await Promise.all([
        examRepo.getTeacherExams(userId),
        groupRepo.getTeacherGroups(userId),
      ]);
      setExams(fetchedExams);
      setGroups(fetchedGroups);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки экзаменов.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, examRepo, groupRepo]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!userId) {
        if (!isCancelled) {
          setExams([]);
          setGroups([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        const [fetchedExams, fetchedGroups] = await Promise.all([
          examRepo.getTeacherExams(userId),
          groupRepo.getTeacherGroups(userId),
        ]);
        if (!isCancelled) {
          setExams(fetchedExams);
          setGroups(fetchedGroups);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Ошибка загрузки экзаменов.');
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
  }, [userId, examRepo, groupRepo]);

  const createExam = useCallback(
    async (examData) => {
      if (!userId) throw new Error('Пользователь не авторизован.');
      const group = groups.find((g) => g.id === examData.groupId);
      const groupName = group ? group.name : '';

      let questionIds = examData.questionIds;
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        try {
          const allQuestions = await questionRepo.getAllQuestions();
          if (allQuestions && allQuestions.length >= 40) {
            const variant = buildTestVariant(allQuestions);
            questionIds = variant.questionIds;
          } else if (allQuestions && allQuestions.length > 0) {
            questionIds = allQuestions.map((q) => q.id);
          } else {
            const generated = generateCurriculumQuestions({ mode: 'full_exam' });
            if (questionRepo.saveQuestionsBatch) {
              await questionRepo.saveQuestionsBatch(generated);
            }
            questionIds = generated.map((q) => q.id);
          }
        } catch {
          const generated = generateCurriculumQuestions({ mode: 'full_exam' });
          questionIds = generated.map((q) => q.id);
        }
      }

      const created = await examRepo.createNewExam({
        ...examData,
        teacherId: userId,
        groupName,
        questionIds,
      });

      setExams((prev) => [created, ...prev]);
      return created;
    },
    [userId, groups, examRepo, questionRepo]
  );

  const changeExamStatus = useCallback(
    async (examId, nextStatus) => {
      try {
        setActionLoadingId(examId);
        const updated = await examRepo.updateExamStatus(examId, nextStatus);
        setExams((prev) =>
          prev.map((e) => (e.id === examId ? { ...e, ...updated } : e))
        );
        return updated;
      } catch (err) {
        setError(err.message || 'Ошибка обновления статуса экзамена.');
        throw err;
      } finally {
        setActionLoadingId(null);
      }
    },
    [examRepo]
  );

  const deleteExam = useCallback(
    async (examId) => {
      try {
        setActionLoadingId(examId);
        await examRepo.deleteExam(examId);
        setExams((prev) => prev.filter((e) => e.id !== examId));
      } catch (err) {
        setError(err.message || 'Ошибка удаления экзамена.');
        throw err;
      } finally {
        setActionLoadingId(null);
      }
    },
    [examRepo]
  );

  const publishExam = useCallback(
    async (examId) => {
      try {
        setActionLoadingId(examId);
        const updated = await examRepo.publishExam(examId);
        setExams((prev) =>
          prev.map((e) => (e.id === examId ? { ...e, ...updated } : e))
        );
        return updated;
      } catch (err) {
        setError(err.message || 'Ошибка публикации экзамена.');
        throw err;
      } finally {
        setActionLoadingId(null);
      }
    },
    [examRepo]
  );

  const filteredExams = exams.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  return {
    exams: filteredExams,
    allExamsCount: exams.length,
    groups,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    actionLoadingId,
    refresh: fetchExamsAndGroups,
    createExam,
    publishExam,
    startExam: (id) => changeExamStatus(id, EXAM_STATUS.ACTIVE),
    finishExam: (id) => changeExamStatus(id, EXAM_STATUS.FINISHED),
    unpublishExam: (id) => changeExamStatus(id, EXAM_STATUS.DRAFT),
    deleteExam,
  };
}
