import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTeacherExams } from './useTeacherExams';
import * as authModule from '@features/auth';

describe('useTeacherExams hook', () => {
  it('loads exams and groups for authenticated teacher', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 't1', email: 'teacher@pifagorschool.kz' },
    });

    const mockExams = [
      { id: 'e1', title: 'Экзамен 1', status: 'draft' },
      { id: 'e2', title: 'Экзамен 2', status: 'active' },
    ];
    const mockGroups = [{ id: 'g1', name: '11-A', studentIds: [] }];

    const mockExamRepo = {
      getTeacherExams: vi.fn().mockResolvedValue(mockExams),
      createNewExam: vi.fn().mockResolvedValue({ id: 'e3', title: 'Экзамен 3', status: 'draft' }),
      updateExamStatus: vi.fn().mockResolvedValue({ id: 'e1', status: 'waiting' }),
      deleteExam: vi.fn().mockResolvedValue(undefined),
    };

    const mockGroupRepo = {
      getTeacherGroups: vi.fn().mockResolvedValue(mockGroups),
    };

    const { result } = renderHook(() =>
      useTeacherExams({
        examRepo: mockExamRepo,
        groupRepo: mockGroupRepo,
      })
    );

    // Initial loading
    expect(result.current.isLoading).toBe(true);

    // Wait for resolution
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.exams).toHaveLength(2);
    expect(result.current.groups).toHaveLength(1);

    // Filtering
    act(() => {
      result.current.setStatusFilter('active');
    });
    expect(result.current.exams).toHaveLength(1);
    expect(result.current.exams[0].id).toBe('e2');
  });
});
