import { describe, expect, it } from 'vitest';
import { calculateTeacherOverview } from './teacherOverview';

describe('teacherOverview domain', () => {
  const baseTime = 1770000000000;

  it('handles empty datasets safely', () => {
    const overview = calculateTeacherOverview();
    expect(overview).toEqual({
      totalStudents: 0,
      totalGroups: 0,
      averageScore: 0,
      completedTestsCount: 0,
      activeStudentsLast7Days: 0,
    });
  });

  it('computes accurate teacher KPIs across students and sessions', () => {
    const students = [
      { uid: 's1', displayName: 'Alikhan' },
      { uid: 's2', displayName: 'Amina' },
      { uid: 's3', displayName: 'Baurzhan' },
    ];

    const groups = [
      { id: 'g1', name: '10-А' },
      { id: 'g2', name: '11-Б' },
    ];

    const sessions = [
      {
        id: 'sess-1',
        userId: 's1',
        status: 'completed',
        score: { totalScore: 40 },
        finishedAt: baseTime - 10000,
      },
      {
        id: 'sess-2',
        userId: 's1',
        status: 'completed',
        score: { totalScore: 30 },
        finishedAt: baseTime - 20000,
      },
      {
        id: 'sess-3',
        userId: 's2',
        status: 'completed',
        score: { totalScore: 45 },
        finishedAt: baseTime - 30000,
      },
      {
        id: 'sess-4',
        userId: 's3',
        status: 'abandoned',
        finishedAt: baseTime - 8 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'sess-5',
        userId: 's3',
        status: 'completed',
        score: { totalScore: 25 },
        finishedAt: baseTime - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      },
    ];

    const overview = calculateTeacherOverview({
      students,
      groups,
      sessions,
      now: baseTime,
    });

    expect(overview.totalStudents).toBe(3);
    expect(overview.totalGroups).toBe(2);
    expect(overview.completedTestsCount).toBe(4);
    // Scores: 40 + 30 + 45 + 25 = 140 / 4 = 35
    expect(overview.averageScore).toBe(35);
    // Active within 7 days: s1 and s2 (s3 last activity was 10 days ago)
    expect(overview.activeStudentsLast7Days).toBe(2);
  });
});
