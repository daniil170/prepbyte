import { describe, expect, it } from 'vitest';
import { enrichStudentSummary, formatActivityDate } from './studentProfile';

describe('studentProfile domain', () => {
  const baseTime = 1770000000000;

  it('formats activity dates correctly', () => {
    expect(formatActivityDate(null)).toBe('Нет данных');
    expect(formatActivityDate(baseTime, baseTime)).toBe('Сегодня');
    expect(
      formatActivityDate(baseTime - 24 * 60 * 60 * 1000, baseTime)
    ).toBe('Вчера');
  });

  it('enriches student summary with correct test metrics and group names', () => {
    const student = {
      uid: 's-10',
      email: 'student@prepbyte.kz',
      displayName: 'Alikhan Baizhanov',
      groupIds: ['g1'],
    };

    const groups = [
      { id: 'g1', name: '10-А класс', studentIds: ['s-10'] },
      { id: 'g2', name: '11-Б класс', studentIds: [] },
    ];

    const sessions = [
      {
        id: '1',
        status: 'completed',
        score: { totalScore: 35 },
        finishedAt: baseTime - 1000,
      },
      {
        id: '2',
        status: 'completed',
        score: { totalScore: 45 },
        finishedAt: baseTime - 5000,
      },
      {
        id: '3',
        status: 'abandoned',
        finishedAt: baseTime - 10000,
      },
    ];

    const summary = enrichStudentSummary(student, sessions, groups, baseTime);

    expect(summary.uid).toBe('s-10');
    expect(summary.displayName).toBe('Alikhan Baizhanov');
    expect(summary.groupNames).toEqual(['10-А класс']);
    expect(summary.testCount).toBe(3);
    expect(summary.completedTests).toBe(2);
    expect(summary.averageScore).toBe(40);
    expect(summary.topScore).toBe(45);
    expect(summary.status).toBe('active');
    expect(summary.statusLabel).toBe('Активен');
    expect(summary.lastActivityFormatted).toBe('Сегодня');
  });

  it('handles students without sessions gracefully', () => {
    const student = {
      uid: 's-new',
      email: 'newbie@school.kz',
    };

    const summary = enrichStudentSummary(student, [], [], baseTime);
    expect(summary.testCount).toBe(0);
    expect(summary.completedTests).toBe(0);
    expect(summary.averageScore).toBe(0);
    expect(summary.topScore).toBe(0);
    expect(summary.status).toBe('inactive');
    expect(summary.groupNames).toEqual(['Без группы']);
  });
});
