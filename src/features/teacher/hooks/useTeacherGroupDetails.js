import { useState, useEffect, useCallback } from 'react';
import { useAuth, userProfileRepository } from '@features/auth';
import { groupRepository } from '../data/groupRepository';
import { teacherStudentRepository } from '../data/teacherStudentRepository';
import { enrichStudentSummary } from '../domain/studentProfile';

export function useTeacherGroupDetails(groupId) {
  const { user } = useAuth();
  const teacherId = user?.id || user?.uid;
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const groupData = await groupRepository.getGroupById(groupId);
      if (!groupData) {
        throw new Error('Группа не найдена');
      }

      setGroup(groupData);

      const studentIds = groupData.studentIds || [];
      const enrichedStudents = await Promise.all(
        studentIds.map(async (studentId) => {
          try {
            const profile = await teacherStudentRepository.getStudentProfile(studentId);
            if (!profile) return null;
            const sessions = await teacherStudentRepository.getStudentSessions(studentId);
            return enrichStudentSummary(profile, sessions, [groupData]);
          } catch {
            return null;
          }
        })
      );

      setStudents(enrichedStudents.filter(Boolean));
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить данные группы');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!groupId) {
        if (!isCancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const groupData = await groupRepository.getGroupById(groupId);
        if (!groupData) {
          throw new Error('Группа не найдена');
        }

        const studentIds = groupData.studentIds || [];
        const enrichedStudents = await Promise.all(
          studentIds.map(async (studentId) => {
            try {
              const profile = await teacherStudentRepository.getStudentProfile(studentId);
              if (!profile) return null;
              const sessions = await teacherStudentRepository.getStudentSessions(studentId);
              return enrichStudentSummary(profile, sessions, [groupData]);
            } catch {
              return null;
            }
          })
        );

        if (!isCancelled) {
          setGroup(groupData);
          setStudents(enrichedStudents.filter(Boolean));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message || 'Не удалось загрузить данные группы');
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
  }, [groupId]);

  const addStudentByEmailOrId = useCallback(
    async (searchQuery) => {
      if (!groupId) throw new Error('groupId отсутствует');
      if (!searchQuery || !searchQuery.trim()) {
        throw new Error('Введите email или UID ученика');
      }

      const found = await userProfileRepository.findStudentsByEmailOrId(searchQuery);
      if (!found || found.length === 0) {
        throw new Error('Ученик с таким email или UID не найден');
      }

      const targetStudent = found[0];

      if (group?.studentIds?.includes(targetStudent.uid)) {
        throw new Error('Ученик уже добавлен в эту группу');
      }

      await groupRepository.addStudent(groupId, targetStudent.uid);
      await userProfileRepository.assignStudentToGroup(targetStudent.uid, {
        teacherId,
        groupId,
      });

      await fetchGroupDetails();
      return targetStudent;
    },
    [groupId, group, teacherId, fetchGroupDetails]
  );

  const removeStudentFromGroup = useCallback(
    async (studentId) => {
      if (!groupId || !studentId) return;

      await groupRepository.removeStudent(groupId, studentId);
      await userProfileRepository.removeStudentFromGroup(studentId, groupId);
      await fetchGroupDetails();
    },
    [groupId, fetchGroupDetails]
  );

  const renameGroup = useCallback(
    async (newName) => {
      if (!groupId || !newName) return;
      await groupRepository.renameGroup(groupId, newName);
      setGroup((prev) => (prev ? { ...prev, name: newName.trim(), updatedAt: Date.now() } : prev));
    },
    [groupId]
  );

  return {
    group,
    students,
    loading,
    error,
    refresh: fetchGroupDetails,
    renameGroup,
    addStudentByEmailOrId,
    removeStudentFromGroup,
  };
}
