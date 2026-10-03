import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@features/auth';
import { groupRepository } from '../data/groupRepository';

export function useTeacherGroups(explicitTeacherId) {
  const { user } = useAuth();
  const teacherId = explicitTeacherId || user?.id || user?.uid;
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroups = useCallback(async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await groupRepository.getTeacherGroups(teacherId);
      setGroups(data);
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить список групп');
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
        const data = await groupRepository.getTeacherGroups(teacherId);
        if (!isCancelled) {
          setGroups(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message || 'Не удалось загрузить список групп');
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

  const createGroup = useCallback(
    async (name) => {
      if (!teacherId) throw new Error('Пользователь не авторизован');
      const newGroup = await groupRepository.createGroup({ name, teacherId });
      setGroups((prev) => [newGroup, ...prev]);
      return newGroup;
    },
    [teacherId]
  );

  const renameGroup = useCallback(async (groupId, newName) => {
    await groupRepository.renameGroup(groupId, newName);
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName.trim(), updatedAt: Date.now() } : g))
    );
  }, []);

  const deleteGroup = useCallback(async (groupId) => {
    await groupRepository.deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  return {
    groups,
    loading,
    error,
    refresh: fetchGroups,
    createGroup,
    renameGroup,
    deleteGroup,
  };
}
