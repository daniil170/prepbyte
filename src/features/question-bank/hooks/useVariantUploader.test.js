import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVariantUploader } from './useVariantUploader';

describe('useVariantUploader hook', () => {
  const createMockFile = (content, name = 'variant.json') => ({
    name,
    text: vi.fn().mockResolvedValue(content),
  });

  const validPayload = {
    variantId: 'v-01',
    title: 'Test Variant',
    questions: [
      {
        id: 'q-1',
        topic: 'python_loops',
        questionText: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswers: [0],
        explanation: 'Exp',
        difficulty: 'easy',
        version: 1,
      },
    ],
  };

  it('initializes with clean default state', () => {
    const { result } = renderHook(() => useVariantUploader());

    expect(result.current.file).toBeNull();
    expect(result.current.validationResult).toBeNull();
    expect(result.current.documentQuestions).toEqual([]);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('parses and validates a valid JSON file on file select', async () => {
    const mockFile = createMockFile(JSON.stringify(validPayload));
    const { result } = renderHook(() => useVariantUploader());

    await act(async () => {
      await result.current.handleFileSelect(mockFile);
    });

    expect(result.current.file).toBe(mockFile);
    expect(result.current.fileType).toBe('json');
    expect(result.current.validationResult).not.toBeNull();
    expect(result.current.validationResult.isValid).toBe(true);
    expect(result.current.validationResult.questions).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('sets error on invalid JSON syntax', async () => {
    const mockFile = createMockFile('{ corrupted json');
    const { result } = renderHook(() => useVariantUploader());

    await act(async () => {
      await result.current.handleFileSelect(mockFile);
    });

    expect(result.current.validationResult).toBeNull();
    expect(result.current.error).toContain('Ошибка парсинга JSON');
  });

  it('uploads valid JSON questions via repository.saveQuestionsBatch', async () => {
    const mockRepo = {
      saveQuestionsBatch: vi.fn().mockResolvedValue({ writtenCount: 1 }),
      getAllQuestions: vi.fn().mockResolvedValue([]),
    };

    const mockFile = createMockFile(JSON.stringify(validPayload));
    const { result } = renderHook(() =>
      useVariantUploader({ repository: mockRepo })
    );

    await act(async () => {
      await result.current.handleFileSelect(mockFile);
    });

    await act(async () => {
      await result.current.uploadVariant();
    });

    expect(mockRepo.saveQuestionsBatch).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'q-1' })])
    );
    expect(result.current.uploadSuccess).toBe(true);
    expect(result.current.uploadCount).toBe(1);
  });

  describe('document import workflow (DOCX / PDF)', () => {
    const sampleDocxText = `
1. Что такое стек?
A) FIFO
B) LIFO
C) Random
D) Round-robin
Ответ: B

2. Архитектура фон Неймана включает:
A) Процессор
B) Память
C) Устройства ввода
D) Дисплей
Ответ: A, B, C
    `.trim();

    it('rejects legacy .doc files with clear guidance', async () => {
      const mockFile = { name: 'old_test.doc' };
      const { result } = renderHook(() => useVariantUploader());

      await act(async () => {
        await result.current.handleFileSelect(mockFile);
      });

      expect(result.current.error).toContain('Формат .doc не поддерживается');
    });

    it('processes docx document and creates editable questions', async () => {
      const mockFile = { name: 'test_variant.docx' };
      const mockReader = vi.fn().mockResolvedValue(sampleDocxText);
      const mockRepo = {
        getAllQuestions: vi.fn().mockResolvedValue([
          {
            id: 'existing-1',
            questionText: 'Что такое стек?',
          },
        ]),
        saveQuestionsBatch: vi.fn().mockResolvedValue({ writtenCount: 1 }),
      };

      const { result } = renderHook(() =>
        useVariantUploader({
          repository: mockRepo,
          documentReader: mockReader,
        })
      );

      await act(async () => {
        await result.current.handleFileSelect(mockFile);
      });

      expect(result.current.fileType).toBe('document');
      expect(result.current.documentQuestions).toHaveLength(2);

      // Question 1 should be detected as duplicate of existing-1
      expect(result.current.documentQuestions[0].duplicateOf).toBe(
        'existing-1'
      );
      expect(result.current.documentQuestions[0].included).toBe(false);

      // Question 2 should not be duplicate and included by default
      expect(result.current.documentQuestions[1].included).toBe(true);
      expect(result.current.documentQuestions[1].correctAnswers).toEqual([
        0, 1, 2,
      ]);

      // Fill missing explanation for Question 2 so it can be saved
      await act(async () => {
        result.current.updateDocumentQuestion(1, {
          explanation: 'Пояснение к заданию по архитектуре',
        });
      });

      expect(result.current.canSaveDocument).toBe(true);

      // Save variant
      await act(async () => {
        await result.current.uploadVariant();
      });

      expect(mockRepo.saveQuestionsBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            questionText: 'Архитектура фон Неймана включает:',
            correctAnswers: [0, 1, 2],
            points: 2,
          }),
        ])
      );
      expect(result.current.uploadSuccess).toBe(true);
      expect(result.current.uploadCount).toBe(1);
    });

    it('supports bulk operations: includeAll, excludeDuplicates, applyDefaultTopicToAll', async () => {
      const mockFile = { name: 'exam.pdf' };
      const mockReader = vi.fn().mockResolvedValue(sampleDocxText);
      const mockRepo = {
        getAllQuestions: vi.fn().mockResolvedValue([
          {
            id: 'existing-1',
            questionText: 'Что такое стек?',
          },
        ]),
      };

      const { result } = renderHook(() =>
        useVariantUploader({
          repository: mockRepo,
          documentReader: mockReader,
        })
      );

      await act(async () => {
        await result.current.handleFileSelect(mockFile);
      });

      // includeAll
      act(() => {
        result.current.includeAll();
      });
      expect(result.current.documentQuestions.every((q) => q.included)).toBe(
        true
      );

      // excludeDuplicates
      act(() => {
        result.current.excludeDuplicates();
      });
      expect(result.current.documentQuestions[0].included).toBe(false);
      expect(result.current.documentQuestions[1].included).toBe(true);

      // applyDefaultTopicToAll
      act(() => {
        result.current.applyDefaultTopicToAll('algorithms_structures');
      });
      expect(
        result.current.documentQuestions.every(
          (q) => q.topic === 'algorithms_structures'
        )
      ).toBe(true);
    });
  });
});
