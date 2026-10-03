import { describe, expect, it, vi } from 'vitest';
import { createTeacherStudentRepository } from './teacherStudentRepository';

describe('teacherStudentRepository', () => {
  it('aggregates teacher overview data from groups, students, and student sessions', async () => {
    const mockGroups = [
      { id: 'g1', name: '10-А', teacherId: 't1', studentIds: ['s1'] },
    ];

    const mockGroupRepo = {
      getTeacherGroups: vi.fn().mockResolvedValue(mockGroups),
    };

    const mockAnalyticsRepo = {
      getUserSessions: vi.fn().mockResolvedValue([
        {
          id: 'sess-1',
          userId: 's1',
          status: 'completed',
          score: { totalScore: 42 },
          finishedAt: Date.now() - 1000,
        },
      ]),
    };

    const mockFirestore = {};
    const repo = createTeacherStudentRepository(
      mockFirestore,
      mockGroupRepo,
      mockAnalyticsRepo
    );

    // Mock internal getTeacherStudentsAndGroups
    vi.spyOn(repo, 'getTeacherStudentsAndGroups').mockResolvedValue({
      students: [
        { uid: 's1', displayName: 'Alikhan', email: 'alikhan@test.kz' },
      ],
      groups: mockGroups,
    });

    const overview = await repo.getTeacherOverviewData('t1');

    expect(overview.kpis.totalStudents).toBe(1);
    expect(overview.kpis.totalGroups).toBe(1);
    expect(overview.kpis.completedTestsCount).toBe(1);
    expect(overview.kpis.averageScore).toBe(42);
    expect(overview.groups).toEqual(mockGroups);
  });
});
