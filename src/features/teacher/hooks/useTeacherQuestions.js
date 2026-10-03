import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTopicLabel,
  isMultipleAnswer,
  questionRepository,
} from '@features/question-bank';

export function useTeacherQuestions() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const loadQuestions = useCallback(async () => {
    setError(null);
    try {
      const data = await questionRepository.getAllQuestionsWithAnswers();
      setQuestions(data);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки вопросов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await questionRepository.getAllQuestionsWithAnswers();
        if (!ignore) {
          setQuestions(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Ошибка загрузки вопросов');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Search Filter (Text & Topic)
      if (searchQuery.trim()) {
        const queryClean = searchQuery.trim().toLowerCase();
        const textMatch = q.questionText.toLowerCase().includes(queryClean);
        const topicIdMatch = q.topic.toLowerCase().includes(queryClean);
        const topicLabelMatch = getTopicLabel(q.topic)
          .toLowerCase()
          .includes(queryClean);
        if (!textMatch && !topicIdMatch && !topicLabelMatch) {
          return false;
        }
      }

      // 2. Topic Filter
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) {
        return false;
      }

      // 3. Difficulty Filter
      if (
        selectedDifficulty !== 'all' &&
        q.difficulty !== selectedDifficulty
      ) {
        return false;
      }

      // 4. Type Filter (single vs multiple)
      if (selectedType !== 'all') {
        const isMultiple = isMultipleAnswer(q);
        if (selectedType === 'single' && isMultiple) {
          return false;
        }
        if (selectedType === 'multiple' && !isMultiple) {
          return false;
        }
      }

      return true;
    });
  }, [questions, searchQuery, selectedTopic, selectedDifficulty, selectedType]);

  const deleteQuestion = useCallback(async (id) => {
    setActionError(null);
    try {
      await questionRepository.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Не удалось удалить вопрос.';
      setActionError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const saveQuestion = useCallback(async (questionData) => {
    setActionError(null);
    try {
      const saved = await questionRepository.saveQuestion(questionData);
      setQuestions((prev) => {
        const idx = prev.findIndex((q) => q.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      return { success: true, question: saved };
    } catch (err) {
      const msg = err.message || 'Не удалось сохранить вопрос.';
      setActionError(msg);
      return { success: false, error: msg };
    }
  }, []);

  return {
    questions,
    filteredQuestions,
    isLoading,
    error,
    actionError,
    setActionError,
    searchQuery,
    setSearchQuery,
    selectedTopic,
    setSelectedTopic,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedType,
    setSelectedType,
    loadQuestions,
    deleteQuestion,
    saveQuestion,
  };
}
