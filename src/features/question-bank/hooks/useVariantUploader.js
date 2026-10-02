import { useCallback, useMemo, useState } from 'react';
import { readDocumentText as defaultReadDocumentText } from '../data/documentReaders';
import { questionRepository as defaultRepository } from '../data/questionRepository';
import { normalizeDocumentText } from '../domain/documentNormalization';
import { parseQuestionBlocks } from '../domain/questionBlockParser';
import { buildImportedQuestions } from '../domain/questionImportMapper';
import { detectQuestionTopic, isValidTopic } from '../domain/topics';
import { validateVariantPayload } from '../domain/variantValidation';

/**
 * Validates a single question in the document import workflow.
 * @param {object} q
 * @returns {{ isValid: boolean, issues: string[] }}
 */
function validateEditableQuestion(q) {
  const issues = [];

  if (!q.questionText || !q.questionText.trim()) {
    issues.push('Текст вопроса не может быть пустым.');
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    issues.push('Вопрос должен содержать минимум 2 варианта ответа.');
  } else if (q.options.length > 6) {
    issues.push('Вопрос не может содержать более 6 вариантов ответа.');
  } else if (q.options.some((opt) => !opt || !opt.trim())) {
    issues.push('Все варианты ответа должны содержать непустой текст.');
  }

  if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
    issues.push('Необходимо отметить хотя бы один правильный ответ.');
  } else if (
    Array.isArray(q.options) &&
    q.correctAnswers.some((idx) => idx < 0 || idx >= q.options.length)
  ) {
    issues.push('Индекс правильного ответа выходит за пределы вариантов.');
  }

  const effectiveTopic =
    q.topic || detectQuestionTopic(q.questionText, q.options);
  if (!effectiveTopic || !isValidTopic(effectiveTopic)) {
    issues.push('Необходимо выбрать корректную тему ЕНТ.');
  }

  if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty)) {
    issues.push('Необходимо указать корректную сложность (easy/medium/hard).');
  }

  if (!q.explanation || !q.explanation.trim()) {
    issues.push('Необходимо указать пояснение к заданию.');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Generates a clean variant slug from file name with 5-digit number prefixed by #.
 * E.g., "Вариант 8.pdf" -> "#00008", or fallback "#10001".
 * @param {string} fileName
 * @returns {string}
 */
export function generateSlugFromFileName(fileName = '') {
  const base = fileName.replace(/\.[^/.]+$/, '').trim();
  const variantMatch = base.match(/(?:вариант|variant|var|v)[\s._-]*(\d+)/i);
  if (variantMatch) {
    const num = parseInt(variantMatch[1], 10);
    return `#${String(num).padStart(5, '0')}`;
  }
  const anyNumMatch = base.match(/\d+/);
  if (anyNumMatch) {
    const num = parseInt(anyNumMatch[0], 10);
    return `#${String(num).padStart(5, '0')}`;
  }
  return '#10001';
}

/**
 * Hook for managing client-side variant JSON / DOCX / PDF upload,
 * pre-flight validation, in-browser preview/editing, and batch write.
 *
 * @param {object} [options]
 * @param {object} [options.repository=questionRepository]
 * @param {Function} [options.documentReader=readDocumentText]
 * @returns {object} Uploader state and actions.
 */
export function useVariantUploader({
  repository = defaultRepository,
  documentReader = defaultReadDocumentText,
} = {}) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'json' | 'document' | null
  const [validationResult, setValidationResult] = useState(null);
  const [documentQuestions, setDocumentQuestions] = useState([]);
  const [documentWarnings, setDocumentWarnings] = useState([]);
  const [variantSlug, setVariantSlugState] = useState('#10001');
  const [defaultTopic, setDefaultTopic] = useState('cpu_memory');
  const [defaultDifficulty, setDefaultDifficulty] = useState('medium');

  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState(null);

  const setVariantSlug = useCallback((newSlug) => {
    setVariantSlugState(newSlug);
    setDocumentQuestions((prev) =>
      prev.map((q, idx) => {
        const paddedIndex = String(q.number || idx + 1).padStart(3, '0');
        const clean = String(newSlug || '#10001')
          .trim()
          .replace(/[^a-z0-9_#-]/gi, '-');
        return {
          ...q,
          id: `${clean}-${paddedIndex}`,
        };
      })
    );
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFileType(null);
    setValidationResult(null);
    setDocumentQuestions([]);
    setDocumentWarnings([]);
    setVariantSlugState('#10001');
    setDefaultTopic('cpu_memory');
    setDefaultDifficulty('medium');
    setIsValidating(false);
    setIsUploading(false);
    setUploadSuccess(false);
    setUploadCount(0);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile) => {
      if (!selectedFile) return;

      reset();
      setFile(selectedFile);
      setIsValidating(true);
      setError(null);

      const fileName = selectedFile.name || '';
      const lower = fileName.toLowerCase();

      try {
        if (
          lower.endsWith('.docx') ||
          lower.endsWith('.pdf') ||
          selectedFile.type === 'application/pdf' ||
          selectedFile.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          setFileType('document');
          const slug = generateSlugFromFileName(fileName);
          setVariantSlugState(slug);

          // 1. Read document text
          const rawText = await documentReader(selectedFile);

          // 2. Normalize text
          const normalized = normalizeDocumentText(rawText);

          // 3. Parse question blocks
          const { items: parsedItems, warnings: parseWarnings } =
            parseQuestionBlocks(normalized);

          if (parsedItems.length === 0) {
            setError(
              'Не удалось распознать задания в документе. Проверьте форматирование (нумерация «1. Вопрос», варианты A, B, C, D и ключи ответов).'
            );
            return;
          }

          // 4. Fetch existing bank questions for duplicate detection
          let existingBank = [];
          try {
            existingBank = (await repository.getAllQuestions()) || [];
          } catch {
            existingBank = [];
          }

          // 5. Build imported questions with auto-detected topics
          const rawImported = buildImportedQuestions(parsedItems, {
            existingQuestions: existingBank,
            defaultDifficulty: 'medium',
            defaultExplanation: 'Пояснение к заданию',
            variantSlug: slug,
          });

          const initialQuestions = rawImported.map((item, idx) => {
            const isSkippedOrUnsupported = item.issues.some(
              (i) =>
                i.includes('не поддерживается') ||
                i.includes('ссылается на') ||
                i.includes('соответстви')
            );
            return {
              ...item.question,
              number: parsedItems[idx]?.number || idx + 1,
              status: isSkippedOrUnsupported ? 'warning' : item.status,
              issues: item.issues,
              duplicateOf: item.duplicateOf,
              included:
                !item.duplicateOf &&
                item.status !== 'error' &&
                !isSkippedOrUnsupported,
            };
          });

          setDocumentQuestions(initialQuestions);
          setDocumentWarnings(parseWarnings);
        } else if (
          lower.endsWith('.json') ||
          selectedFile.type === 'application/json'
        ) {
          setFileType('json');
          const text = await selectedFile.text();
          let parsed;
          try {
            parsed = JSON.parse(text);
          } catch (parseErr) {
            setError(`Ошибка парсинга JSON: ${parseErr.message}`);
            return;
          }

          const result = validateVariantPayload(parsed);
          setValidationResult(result);
        } else if (lower.endsWith('.doc')) {
          setError(
            'Формат .doc не поддерживается. Пожалуйста, пересохраните файл как .docx.'
          );
        } else {
          setError(`Неподдерживаемый формат файла "${fileName}".`);
        }
      } catch (err) {
        setError(err.message || 'Ошибка при чтении файла.');
      } finally {
        setIsValidating(false);
      }
    },
    [documentReader, repository, reset]
  );

  const updateDocumentQuestion = useCallback((index, partialFields) => {
    setDocumentQuestions((prev) => {
      const next = [...prev];
      const target = { ...next[index], ...partialFields };

      // Re-validate question
      const validation = validateEditableQuestion(target);

      if (!validation.isValid) {
        target.status = 'error';
        target.issues = validation.issues;
      } else if (target.duplicateOf) {
        target.status = 'warning';
        target.issues = [`Возможный дубликат вопроса (${target.duplicateOf})`];
      } else {
        target.status = 'ok';
        target.issues = [];
      }

      next[index] = target;
      return next;
    });
  }, []);

  const toggleIncludeQuestion = useCallback((index) => {
    setDocumentQuestions((prev) => {
      const next = [...prev];
      const current = next[index];
      const isCurrentlyIncluded = current.included !== false;
      next[index] = { ...current, included: !isCurrentlyIncluded };
      return next;
    });
  }, []);

  const toggleCorrectAnswer = useCallback((qIndex, optIndex) => {
    setDocumentQuestions((prev) => {
      const next = [...prev];
      const target = { ...next[qIndex] };
      const currentCorrect = target.correctAnswers || [];

      let nextCorrect;
      if (currentCorrect.includes(optIndex)) {
        nextCorrect = currentCorrect.filter((i) => i !== optIndex);
      } else {
        nextCorrect = [...currentCorrect, optIndex].sort((a, b) => a - b);
      }

      target.correctAnswers = nextCorrect;
      const validation = validateEditableQuestion(target);
      if (!validation.isValid) {
        target.status = 'error';
        target.issues = validation.issues;
      } else if (target.duplicateOf) {
        target.status = 'warning';
        target.issues = [`Возможный дубликат вопроса (${target.duplicateOf})`];
      } else {
        target.status = 'ok';
        target.issues = [];
      }

      next[qIndex] = target;
      return next;
    });
  }, []);

  const updateOptionText = useCallback((qIndex, optIndex, text) => {
    setDocumentQuestions((prev) => {
      const next = [...prev];
      const target = { ...next[qIndex] };
      const nextOptions = [...(target.options || [])];
      nextOptions[optIndex] = text;
      target.options = nextOptions;

      const validation = validateEditableQuestion(target);
      if (!validation.isValid) {
        target.status = 'error';
        target.issues = validation.issues;
      } else if (target.duplicateOf) {
        target.status = 'warning';
        target.issues = [`Возможный дубликат вопроса (${target.duplicateOf})`];
      } else {
        target.status = 'ok';
        target.issues = [];
      }

      next[qIndex] = target;
      return next;
    });
  }, []);

  const removeDocumentQuestion = useCallback((index) => {
    setDocumentQuestions((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const includeAll = useCallback(() => {
    setDocumentQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        included: true,
      }))
    );
  }, []);

  const excludeDuplicates = useCallback(() => {
    setDocumentQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        included: !q.duplicateOf,
      }))
    );
  }, []);

  const applyDefaultTopicToAll = useCallback((newTopic) => {
    if (!newTopic) return;
    setDefaultTopic(newTopic);
    setDocumentQuestions((prev) =>
      prev.map((q) => {
        const updated = { ...q, topic: newTopic };
        const validation = validateEditableQuestion(updated);
        return {
          ...updated,
          status: !validation.isValid
            ? 'error'
            : updated.duplicateOf
              ? 'warning'
              : 'ok',
          issues: !validation.isValid
            ? validation.issues
            : updated.duplicateOf
              ? [`Возможный дубликат вопроса (${updated.duplicateOf})`]
              : [],
        };
      })
    );
  }, []);

  const applyDefaultDifficultyToAll = useCallback((newDiff) => {
    if (!newDiff) return;
    setDefaultDifficulty(newDiff);
    setDocumentQuestions((prev) =>
      prev.map((q) => {
        const updated = { ...q, difficulty: newDiff };
        const validation = validateEditableQuestion(updated);
        return {
          ...updated,
          status: !validation.isValid
            ? 'error'
            : updated.duplicateOf
              ? 'warning'
              : 'ok',
          issues: !validation.isValid
            ? validation.issues
            : updated.duplicateOf
              ? [`Возможный дубликат вопроса (${updated.duplicateOf})`]
              : [],
        };
      })
    );
  }, []);

  const includedQuestions = useMemo(
    () => documentQuestions.filter((q) => q.included !== false),
    [documentQuestions]
  );

  const canSaveDocument = useMemo(() => {
    if (includedQuestions.length === 0) return false;
    return includedQuestions.every((q) => {
      const { isValid } = validateEditableQuestion(q);
      return isValid;
    });
  }, [includedQuestions]);

  const uploadVariant = useCallback(async () => {
    setIsUploading(true);
    setError(null);

    try {
      if (fileType === 'document') {
        if (includedQuestions.length === 0) {
          throw new Error('Не выбрано ни одного задания для сохранения.');
        }

        // Final sanity check of each included question
        for (let i = 0; i < includedQuestions.length; i++) {
          const q = includedQuestions[i];
          const check = validateEditableQuestion(q);
          if (!check.isValid) {
            throw new Error(
              `Задание #${q.number || i + 1} содержит ошибку: ${check.issues[0]}`
            );
          }
        }

        const payload = includedQuestions.map((q, idx) => {
          const paddedIndex = String(q.number || idx + 1).padStart(3, '0');
          const clean = String(variantSlug || '#10001')
            .trim()
            .replace(/[^a-z0-9_#-]/gi, '-');
          const topic =
            q.topic ||
            detectQuestionTopic(q.questionText, q.options) ||
            'cpu_memory';

          return {
            id: q.id || `${clean}-${paddedIndex}`,
            topic,
            questionText: q.questionText.trim(),
            options: q.options.map((opt) => opt.trim()),
            correctAnswers: q.correctAnswers,
            explanation: q.explanation.trim(),
            difficulty: q.difficulty,
            points: q.correctAnswers.length > 1 ? 2 : 1,
            version: 1,
          };
        });

        const { writtenCount } = await repository.saveQuestionsBatch(payload);
        setUploadSuccess(true);
        setUploadCount(writtenCount);
        return writtenCount;
      }

      if (fileType === 'json') {
        if (!validationResult || !validationResult.isValid) {
          throw new Error('Нельзя загрузить невалидный вариант заданий.');
        }
        if (
          !validationResult.questions ||
          validationResult.questions.length === 0
        ) {
          throw new Error('Список заданий пуст.');
        }

        const { writtenCount } = await repository.saveQuestionsBatch(
          validationResult.questions
        );
        setUploadSuccess(true);
        setUploadCount(writtenCount);
        return writtenCount;
      }

      throw new Error('Файл не выбран.');
    } catch (err) {
      setError(`Ошибка сохранения в Firestore: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [fileType, includedQuestions, repository, validationResult, variantSlug]);

  return {
    file,
    fileType,
    validationResult,
    documentQuestions,
    documentWarnings,
    variantSlug,
    setVariantSlug,
    defaultTopic,
    setDefaultTopic,
    defaultDifficulty,
    setDefaultDifficulty,
    isValidating,
    isUploading,
    uploadSuccess,
    uploadCount,
    error,
    handleFileSelect,
    updateDocumentQuestion,
    toggleIncludeQuestion,
    toggleCorrectAnswer,
    updateOptionText,
    removeDocumentQuestion,
    includeAll,
    excludeDuplicates,
    applyDefaultTopicToAll,
    applyDefaultDifficultyToAll,
    canSaveDocument,
    includedCount: includedQuestions.length,
    uploadVariant,
    reset,
  };
}
