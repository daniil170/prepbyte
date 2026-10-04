import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTeacherExamResults } from './useTeacherExamResults';

describe('useTeacherExamResults hook', () => {
  const mockResultsData = {
    success: true,
    exam: { id: 'exam1', title: 'Экзамен 10-А', status: 'finished' },
    summary: {
      totalParticipants: 3,
      completedCount: 2,
      inProgressCount: 1,
      waitingCount: 0,
      notStartedCount: 0,
      averageScore: 8.5,
      averagePercentage: 85,
      highestScore: 10,
      lowestScore: 7,
      scoreDistribution: { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 1, '81-100%': 1 },
      topicPerformance: { math: 85 },
      easiestQuestions: [],
      hardestQuestions: [],
    },
    participants: [
      { studentId: 's1', studentName: 'Алексей И.', status: 'completed', score: 10, percentage: 100 },
      { studentId: 's2', studentName: 'Борис П.', status: 'completed', score: 7, percentage: 70 },
      { studentId: 's3', studentName: 'Виктор С.', status: 'in_progress', score: 0, percentage: 0 },
    ],
  };

  const createMockRepo = () => ({
    getExamResults: vi.fn().mockResolvedValue(mockResultsData),
  });

  it('loads exam results and supports filtering and sorting', async () => {
    const examRepo = createMockRepo();
    const { result } = renderHook(() =>
      useTeacherExamResults({ examId: 'exam1', examRepo })
    );

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.exam.title).toBe('Экзамен 10-А');
    expect(result.current.participants).toHaveLength(3);

    // Search by name
    act(() => {
      result.current.setSearchQuery('Борис');
    });
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.participants[0].studentName).toBe('Борис П.');

    // Filter by status
    act(() => {
      result.current.setSearchQuery('');
      result.current.setStatusFilter('in_progress');
    });
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.participants[0].studentId).toBe('s3');
  });
});
