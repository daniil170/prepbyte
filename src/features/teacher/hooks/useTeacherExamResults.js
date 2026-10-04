import { useCallback, useEffect, useMemo, useState } from 'react';
import { examRepository as defaultExamRepo } from '../data/examRepository';

export function useTeacherExamResults({
  examId,
  examRepo = defaultExamRepo,
} = {}) {
  const [resultsData, setResultsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!examId) {
      setResultsData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await examRepo.getExamResults(examId);
      setResultsData(res);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки результатов экзамена.');
    } finally {
      setIsLoading(false);
    }
  }, [examId, examRepo]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!examId) {
        if (!isCancelled) setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await examRepo.getExamResults(examId);
        if (!isCancelled) {
          setResultsData(res);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Ошибка загрузки результатов экзамена.');
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
  }, [examId, examRepo]);

  const filteredParticipants = useMemo(() => {
    if (!resultsData || !Array.isArray(resultsData.participants)) return [];

    let list = [...resultsData.participants];

    // Filter by text search
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.studentName?.toLowerCase().includes(qLower));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [resultsData, searchQuery, statusFilter, sortBy, sortOrder]);

  return {
    exam: resultsData?.exam || null,
    summary: resultsData?.summary || null,
    participants: filteredParticipants,
    allParticipantsCount: resultsData?.participants?.length || 0,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isLoading,
    error,
    refresh: fetchResults,
  };
}
