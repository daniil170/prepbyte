import { useCallback, useState } from 'react';
import { questionRepository as defaultRepository } from '../data/questionRepository';
import { validateVariantPayload } from '../domain/variantValidation';

/**
 * Hook for managing client-side variant JSON upload, pre-flight validation, and batch write.
 *
 * @param {object} [options]
 * @param {object} [options.repository=questionRepository]
 * @returns {object} Uploader state and actions.
 */
export function useVariantUploader({ repository = defaultRepository } = {}) {
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setFile(null);
    setValidationResult(null);
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

      try {
        const text = await selectedFile.text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseErr) {
          setError(`Ошибка парсинга JSON: ${parseErr.message}`);
          setIsValidating(false);
          return;
        }

        const result = validateVariantPayload(parsed);
        setValidationResult(result);
      } catch (err) {
        setError(`Ошибка при чтении файла: ${err.message}`);
      } finally {
        setIsValidating(false);
      }
    },
    [reset]
  );

  const uploadVariant = useCallback(async () => {
    if (!validationResult || !validationResult.isValid) {
      setError('Нельзя загрузить невалидный вариант заданий.');
      return null;
    }

    if (
      !validationResult.questions ||
      validationResult.questions.length === 0
    ) {
      setError('Список заданий пуст.');
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { writtenCount } = await repository.saveQuestionsBatch(
        validationResult.questions
      );
      setUploadSuccess(true);
      setUploadCount(writtenCount);
      return writtenCount;
    } catch (err) {
      setError(`Ошибка сохранения в Firestore: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [repository, validationResult]);

  return {
    file,
    validationResult,
    isValidating,
    isUploading,
    uploadSuccess,
    uploadCount,
    error,
    handleFileSelect,
    uploadVariant,
    reset,
  };
}
