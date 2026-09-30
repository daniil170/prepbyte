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

  it('uploads valid questions via repository.saveQuestionsBatch', async () => {
    const mockRepo = {
      saveQuestionsBatch: vi.fn().mockResolvedValue({ writtenCount: 1 }),
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
});
