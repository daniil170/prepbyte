import { useCallback, useState } from 'react';
import { requestAiVariantGeneration } from '../data/aiVariantClient';
import { questionRepository as defaultRepository } from '../data/questionRepository';

/**
 * Hook managing AI variant generation, in-app question editing, and publishing.
 *
 * @param {object} [options]
 * @param {object} [options.repository=questionRepository]
 * @returns {object} Generator state and dispatchers.
 */
export function useAiVariantGenerator({ repository = defaultRepository } = {}) {
  const [mode, setMode] = useState('full_exam');
  const [selectedTopic, setSelectedTopic] = useState('python_loops');
  const [difficulty, setDifficulty] = useState('balanced');
  const [customApiKey, setCustomApiKey] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generationMeta, setGenerationMeta] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishCount, setPublishCount] = useState(0);
  const [error, setError] = useState(null);

  const generateVariant = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setPublishSuccess(false);

    try {
      const result = await requestAiVariantGeneration({
        mode,
        topicId: selectedTopic,
        apiKey: customApiKey,
        difficulty,
      });

      setGeneratedQuestions(result.questions || []);
      setGenerationMeta({
        source: result.source,
        note: result.note,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(`Ошибка генерации: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [mode, selectedTopic, customApiKey, difficulty]);

  const updateQuestion = useCallback((index, fieldUpdates) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...fieldUpdates };
      }
      return copy;
    });
  }, []);

  const updateOptionText = useCallback(
    (questionIndex, optionIndex, newText) => {
      setGeneratedQuestions((prev) => {
        const copy = [...prev];
        const q = copy[questionIndex];
        if (q && Array.isArray(q.options)) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = newText;
          copy[questionIndex] = { ...q, options: newOptions };
        }
        return copy;
      });
    },
    []
  );

  const toggleCorrectAnswer = useCallback((questionIndex, optionIndex) => {
    setGeneratedQuestions((prev) => {
      const copy = [...prev];
      const q = copy[questionIndex];
      if (!q) return prev;

      const current = Array.isArray(q.correctAnswers)
        ? [...q.correctAnswers]
        : [];
      const exists = current.includes(optionIndex);

      let next;
      if (exists) {
        // If only 1 remains, don't leave it empty
        if (current.length === 1) return prev;
        next = current.filter((i) => i !== optionIndex);
      } else {
        next = [...current, optionIndex].sort((a, b) => a - b);
      }

      copy[questionIndex] = { ...q, correctAnswers: next };
      return copy;
    });
  }, []);

  const removeQuestion = useCallback((index) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const publishQuestions = useCallback(async () => {
    if (generatedQuestions.length === 0) {
      setError('Нет заданий для публикации.');
      return null;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const { writtenCount } =
        await repository.saveQuestionsBatch(generatedQuestions);
      setPublishSuccess(true);
      setPublishCount(writtenCount);
      return writtenCount;
    } catch (err) {
      setError(`Ошибка публикации: ${err.message}`);
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [repository, generatedQuestions]);

  const reset = useCallback(() => {
    setGeneratedQuestions([]);
    setGenerationMeta(null);
    setPublishSuccess(false);
    setPublishCount(0);
    setError(null);
  }, []);

  return {
    mode,
    setMode,
    selectedTopic,
    setSelectedTopic,
    difficulty,
    setDifficulty,
    customApiKey,
    setCustomApiKey,
    isGenerating,
    isPublishing,
    generatedQuestions,
    generationMeta,
    publishSuccess,
    publishCount,
    error,
    generateVariant,
    updateQuestion,
    updateOptionText,
    toggleCorrectAnswer,
    removeQuestion,
    publishQuestions,
    reset,
  };
}
