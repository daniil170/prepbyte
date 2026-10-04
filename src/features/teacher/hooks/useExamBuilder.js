import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@features/auth';
import { questionRepository as defaultQuestionRepo } from '@features/question-bank';
import { examRepository as defaultExamRepo } from '../data/examRepository';
import { groupRepository as defaultGroupRepo } from '../data/groupRepository';

export function extractQuestionVariant(q) {
  if (!q) return null;
  if (q.variantSlug) return String(q.variantSlug).trim();
  if (q.variantId) return String(q.variantId).trim();
  if (typeof q.id === 'string') {
    const match = q.id.match(/^((?:#[0-9]{5})|(?:v-[a-z0-9-]+)|(?:unt-[a-z0-9-]+))/i);
    if (match) return match[1].trim();
  }
  return null;
}

export function useExamBuilder({
  examId = null,
  examRepo = defaultExamRepo,
  groupRepo = defaultGroupRepo,
  questionRepo = defaultQuestionRepo,
} = {}) {
  const { user } = useAuth();
  const userId = user?.id;

  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionIds, setQuestionIds] = useState([]);
  const [questionsMap, setQuestionsMap] = useState({});

  const [groups, setGroups] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);

  // Question bank picker filters
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [variantFilter, setVariantFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditMode = Boolean(examId);

  // Load initial data (groups, questions/variants, and existing exam if in edit mode)
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!userId) {
        if (!isCancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const fetchQuestionsPromise = async () => {
          try {
            if (questionRepo.getAllQuestionsWithAnswers) {
              const all = await questionRepo.getAllQuestionsWithAnswers();
              if (all && all.length > 0) return all;
            }
          } catch {
            // Fallback if getAllQuestionsWithAnswers fails
          }
          try {
            if (questionRepo.getAllQuestions) {
              const all = await questionRepo.getAllQuestions();
              if (all && all.length > 0) return all;
            }
          } catch {
            // Fallback if getAllQuestions fails
          }
          try {
            if (questionRepo.getTeacherQuestions) {
              return (await questionRepo.getTeacherQuestions(userId)) || [];
            }
          } catch {
            // Fallback empty array
          }
          return [];
        };

        const [fetchedGroups, fetchedQuestions, existingExam] = await Promise.all([
          groupRepo.getTeacherGroups(userId),
          fetchQuestionsPromise(),
          examId ? examRepo.getExamById(examId) : Promise.resolve(null),
        ]);

        if (isCancelled) return;

        setGroups(fetchedGroups || []);

        const activeQuestions = (fetchedQuestions || []).filter(
          (q) => q.status === 'active' || !q.status
        );
        setAvailableQuestions(activeQuestions);

        // Map questions by ID for fast lookup
        const qMap = {};
        (fetchedQuestions || []).forEach((q) => {
          qMap[q.id] = q;
        });

        if (existingExam) {
          if (existingExam.teacherId && existingExam.teacherId !== userId) {
            setError('У вас нет прав на редактирование этого экзамена.');
          } else {
            setTitle(existingExam.title || '');
            setGroupId(existingExam.groupId || '');
            setDurationMinutes(existingExam.durationMinutes || 60);

            const ids = existingExam.questionIds || [];
            setQuestionIds(ids);

            // Merge questionSnapshots into qMap if question not in bank
            if (existingExam.questionSnapshots) {
              Object.entries(existingExam.questionSnapshots).forEach(([qId, snap]) => {
                if (!qMap[qId]) {
                  qMap[qId] = { id: qId, ...snap };
                }
              });
            }
          }
        } else if (fetchedGroups && fetchedGroups.length > 0) {
          setGroupId(fetchedGroups[0].id);
        }

        setQuestionsMap(qMap);
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Ошибка загрузки данных для конструктора экзамена.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [userId, examId, examRepo, groupRepo, questionRepo]);

  // Selected questions objects array preserving questionIds order
  const selectedQuestions = useMemo(() => {
    return questionIds
      .map((id) => questionsMap[id] || { id, questionText: `Вопрос ${id}`, topic: '', difficulty: '' })
      .filter(Boolean);
  }, [questionIds, questionsMap]);

  // Available variants grouped from availableQuestions
  const availableVariants = useMemo(() => {
    const variantMap = new Map();
    availableQuestions.forEach((q) => {
      const vKey = extractQuestionVariant(q);
      if (vKey) {
        if (!variantMap.has(vKey)) {
          variantMap.set(vKey, {
            id: vKey,
            title: `Вариант ${vKey}`,
            questionIds: [],
          });
        }
        variantMap.get(vKey).questionIds.push(q.id);
      }
    });

    return Array.from(variantMap.values()).map((v) => ({
      ...v,
      count: v.questionIds.length,
    }));
  }, [availableQuestions]);

  // Load entire variant questions into current exam composition
  const loadVariantQuestions = useCallback(
    (variantId) => {
      if (!variantId) return;
      const targetVariant = availableVariants.find((v) => v.id === variantId);
      if (targetVariant && targetVariant.questionIds.length > 0) {
        setQuestionIds(targetVariant.questionIds);
      }
    },
    [availableVariants]
  );

  // Filtered available questions for the picker
  const filteredPickerQuestions = useMemo(() => {
    return availableQuestions.filter((q) => {
      // Filter out already selected questions
      if (questionIds.includes(q.id)) return false;

      // Filter by text / topic search
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        const matchesText = q.questionText?.toLowerCase().includes(queryLower);
        const matchesTopic = q.topic?.toLowerCase().includes(queryLower);
        if (!matchesText && !matchesTopic) return false;
      }

      // Filter by topic
      if (topicFilter !== 'all' && q.topic !== topicFilter) return false;

      // Filter by difficulty
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;

      // Filter by type (single/multiple)
      if (typeFilter === 'single' && q.multiple) return false;
      if (typeFilter === 'multiple' && !q.multiple) return false;

      // Filter by variant
      if (variantFilter !== 'all') {
        const qVariant = extractQuestionVariant(q);
        if (qVariant !== variantFilter) return false;
      }

      return true;
    });
  }, [availableQuestions, questionIds, searchQuery, topicFilter, difficultyFilter, typeFilter, variantFilter]);

  // Unique topics from available questions for filter dropdown
  const availableTopics = useMemo(() => {
    const topicsSet = new Set();
    availableQuestions.forEach((q) => {
      if (q.topic) topicsSet.add(q.topic);
    });
    return Array.from(topicsSet).sort();
  }, [availableQuestions]);

  // Add question to exam
  const addQuestion = useCallback((q) => {
    const qId = typeof q === 'string' ? q : q.id;
    if (!qId) return;
    setQuestionIds((prev) => (prev.includes(qId) ? prev : [...prev, qId]));
    if (typeof q === 'object' && q.id) {
      setQuestionsMap((prev) => ({ ...prev, [q.id]: q }));
    }
  }, []);

  // Remove question from exam
  const removeQuestion = useCallback((qId) => {
    setQuestionIds((prev) => prev.filter((id) => id !== qId));
  }, []);

  // Remove all questions from exam
  const removeAllQuestions = useCallback(() => {
    setQuestionIds([]);
  }, []);

  // Move question up
  const moveQuestionUp = useCallback((index) => {
    if (index <= 0) return;
    setQuestionIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  }, []);

  // Move question down
  const moveQuestionDown = useCallback((index) => {
    setQuestionIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      errors.title = 'Название должно содержать от 3 до 120 символов.';
    }
    if (!groupId) {
      errors.groupId = 'Необходимо выбрать группу.';
    }
    const duration = Number(durationMinutes);
    if (isNaN(duration) || duration < 5 || duration > 240) {
      errors.durationMinutes = 'Длительность должна быть от 5 до 240 минут.';
    }
    if (!questionIds || questionIds.length === 0) {
      errors.questions = 'Выберите хотя бы один вопрос из банка вопросов.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, groupId, durationMinutes, questionIds]);

  // Save draft
  const saveDraft = useCallback(async () => {
    if (!validateForm()) {
      setError('Заполните все обязательные поля экзамена (название от 3 символов, целевую группу и хотя бы один вопрос).');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const group = groups.find((g) => g.id === groupId);
      const groupName = group ? group.name : '';

      const draftPayload = {
        title: title.trim(),
        groupId,
        groupName,
        durationMinutes: Number(durationMinutes),
        questionIds,
        teacherId: userId,
      };

      if (examId) {
        draftPayload.id = examId;
      }

      const savedExam = await examRepo.saveExamDraft(draftPayload);
      return savedExam;
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении черновика экзамена.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, groups, groupId, title, durationMinutes, questionIds, userId, examId, examRepo]);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!examId) return false;

    try {
      setIsSaving(true);
      setError(null);
      await examRepo.deleteExam(examId);
      return true;
    } catch (err) {
      setError(err.message || 'Ошибка при удалении черновика.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [examId, examRepo]);

  return {
    isEditMode,
    title,
    setTitle,
    groupId,
    setGroupId,
    durationMinutes,
    setDurationMinutes,
    questionIds,
    selectedQuestions,
    groups,
    // Picker & Variants
    pickerQuestions: filteredPickerQuestions,
    availableTopics,
    availableVariants,
    variantFilter,
    setVariantFilter,
    loadVariantQuestions,
    searchQuery,
    setSearchQuery,
    topicFilter,
    setTopicFilter,
    difficultyFilter,
    setDifficultyFilter,
    typeFilter,
    setTypeFilter,
    // Operations
    addQuestion,
    removeQuestion,
    removeAllQuestions,
    moveQuestionUp,
    moveQuestionDown,
    saveDraft,
    deleteDraft,
    // Status
    isLoading,
    isSaving,
    error,
    validationErrors,
  };
}
