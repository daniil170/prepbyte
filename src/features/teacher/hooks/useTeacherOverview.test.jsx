import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authIndex from '@features/auth';
import { teacherStudentRepository } from '../data/teacherStudentRepository';
import { useTeacherOverview } from './useTeacherOverview';

describe('useTeacherOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads overview data for the authenticated teacher', async () => {
    vi.spyOn(authIndex, 'useAuth').mockReturnValue({
      user: { id: 'teacher-1', email: 'teacher@test.kz' },
    });

    const mockOverview = {
      kpis: {
        totalStudents: 10,
        totalGroups: 2,
        averageScore: 35.5,
        completedTestsCount: 20,
        activeStudentsLast7Days: 8,
      },
      studentsCount: 10,
      groupsCount: 2,
      groups: [{ id: 'g1', name: 'Группа 1' }],
      recentStudents: [{ uid: 's1', email: 'student1@test.kz' }],
    };

    vi.spyOn(teacherStudentRepository, 'getTeacherOverviewData').mockResolvedValue(mockOverview);

    const { result } = renderHook(() => useTeacherOverview());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.overview).toEqual(mockOverview);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors gracefully', async () => {
    vi.spyOn(authIndex, 'useAuth').mockReturnValue({
      user: { id: 'teacher-1', email: 'teacher@test.kz' },
    });

    vi.spyOn(teacherStudentRepository, 'getTeacherOverviewData').mockRejectedValue(
      new Error('Firestore error')
    );

    const { result } = renderHook(() => useTeacherOverview());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Firestore error');
    expect(result.current.overview).toBeNull();
  });
});
