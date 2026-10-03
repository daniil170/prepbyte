import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTeacherQuestions } from './useTeacherQuestions';
import { questionRepository } from '@features/question-bank';

vi.mock('@features/question-bank', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    questionRepository: {
      getAllQuestionsWithAnswers: vi.fn(),
      saveQuestion: vi.fn(),
      deleteQuestion: vi.fn(),
    },
  };
});

describe('useTeacherQuestions hook', () => {
  const mockList = [
    {
      id: 'q1',
      questionText: 'Основы Python loops',
      topic: 'python_loops',
      difficulty: 'easy',
      multiple: false,
      options: ['A', 'B'],
      correctAnswers: [0],
    },
    {
      id: 'q2',
      questionText: 'Продвинутый SQL JOIN',
      topic: 'sql_joins',
      difficulty: 'hard',
      multiple: true,
      options: ['INNER', 'OUTER'],
      correctAnswers: [0, 1],
    },
  ];

  it('loads questions on mount and supports filtering', async () => {
    questionRepository.getAllQuestionsWithAnswers.mockResolvedValue(mockList);

    const { result } = renderHook(() => useTeacherQuestions());

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.questions).toHaveLength(2);
    expect(result.current.filteredQuestions).toHaveLength(2);

    // Filter by topic
    act(() => {
      result.current.setSelectedTopic('python_loops');
    });
    expect(result.current.filteredQuestions).toHaveLength(1);
    expect(result.current.filteredQuestions[0].id).toBe('q1');

    // Filter by difficulty
    act(() => {
      result.current.setSelectedTopic('all');
      result.current.setSelectedDifficulty('hard');
    });
    expect(result.current.filteredQuestions).toHaveLength(1);
    expect(result.current.filteredQuestions[0].id).toBe('q2');

    // Filter by search query
    act(() => {
      result.current.setSelectedDifficulty('all');
      result.current.setSearchQuery('JOIN');
    });
    expect(result.current.filteredQuestions).toHaveLength(1);
    expect(result.current.filteredQuestions[0].id).toBe('q2');
  });

  it('handles deleteQuestion and updates list on success', async () => {
    questionRepository.getAllQuestionsWithAnswers.mockResolvedValue(mockList);
    questionRepository.deleteQuestion.mockResolvedValue();

    const { result } = renderHook(() => useTeacherQuestions());
    await act(async () => {});

    let deleteRes;
    await act(async () => {
      deleteRes = await result.current.deleteQuestion('q1');
    });

    expect(deleteRes.success).toBe(true);
    expect(result.current.questions.map((q) => q.id)).toEqual(['q2']);
  });
});
