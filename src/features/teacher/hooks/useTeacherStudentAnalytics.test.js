import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTeacherStudentAnalytics } from './useTeacherStudentAnalytics';

describe('useTeacherStudentAnalytics hook', () => {
  const mockAnalyticsData = {
    success: true,
    exam: { id: 'exam1', title: 'Экзамен 10-А' },
    student: {
      studentId: 'studentA',
      studentName: 'Алексей И.',
      status: 'completed',
      score: 10,
      maxPossibleScore: 10,
      percentage: 100,
      correctAnswersCount: 5,
      incorrectAnswersCount: 0,
      unansweredCount: 0,
    },
    topicBreakdown: { math: { score: 10, maxScore: 10, percentage: 100 } },
    questions: [
      { id: 'q1', index: 1, questionText: 'Текст вопроса 1', status: 'correct', pointsAwarded: 2 },
    ],
  };

  const createMockRepo = () => ({
    getStudentExamAnalytics: vi.fn().mockResolvedValue(mockAnalyticsData),
  });

  it('loads student analytics data', async () => {
    const examRepo = createMockRepo();
    const { result } = renderHook(() =>
      useTeacherStudentAnalytics({ examId: 'exam1', studentId: 'studentA', examRepo })
    );

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.student.studentName).toBe('Алексей И.');
    expect(result.current.questions).toHaveLength(1);
    expect(result.current.questions[0].status).toBe('correct');
  });
});
