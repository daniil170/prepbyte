import { describe, expect, it } from 'vitest';
import { calculateKPIs, calculateStudyStreak } from './kpiCalculator';

describe('kpiCalculator', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const fixedNow = new Date('2026-09-30T12:00:00Z').getTime();

  it('handles empty sessions array', () => {
    const kpis = calculateKPIs([]);
    expect(kpis).toEqual({
      totalTests: 0,
      completedTests: 0,
      abandonedTests: 0,
      inProgressTests: 0,
      completionRate: 0,
      averageScore: 0,
      topScore: 0,
      studyStreak: 0,
    });
  });

  it('calculates KPIs correctly for mixed sessions', () => {
    const sessions = [
      {
        id: 's-1',
        status: 'completed',
        startedAt: fixedNow - 2 * ONE_DAY_MS,
        score: { totalScore: 40, maxPossibleScore: 50 },
      },
      {
        id: 's-2',
        status: 'completed',
        startedAt: fixedNow - ONE_DAY_MS,
        score: { totalScore: 48, maxPossibleScore: 50 },
      },
      {
        id: 's-3',
        status: 'in_progress',
        startedAt: fixedNow,
      },
      {
        id: 's-4',
        status: 'abandoned',
        startedAt: fixedNow - ONE_DAY_MS,
      },
    ];

    const kpis = calculateKPIs(sessions, { referenceTime: fixedNow });

    expect(kpis.totalTests).toBe(4);
    expect(kpis.completedTests).toBe(2);
    expect(kpis.abandonedTests).toBe(1);
    expect(kpis.inProgressTests).toBe(1);
    expect(kpis.completionRate).toBe(50); // 2 out of 4 = 50%
    expect(kpis.averageScore).toBe(44); // (40 + 48) / 2 = 44
    expect(kpis.topScore).toBe(48);
  });

  describe('calculateStudyStreak', () => {
    it('returns 0 when sessions list is empty or dates are inactive', () => {
      expect(calculateStudyStreak([])).toBe(0);
      expect(calculateStudyStreak([{ startedAt: null }])).toBe(0);
    });

    it('calculates multi-day active streak ending today', () => {
      const sessions = [
        { startedAt: fixedNow - 2 * ONE_DAY_MS },
        { startedAt: fixedNow - ONE_DAY_MS },
        { startedAt: fixedNow },
      ];

      expect(calculateStudyStreak(sessions, fixedNow)).toBe(3);
    });

    it('keeps streak alive if last test was yesterday', () => {
      const sessions = [
        { startedAt: fixedNow - 2 * ONE_DAY_MS },
        { startedAt: fixedNow - ONE_DAY_MS },
      ];

      expect(calculateStudyStreak(sessions, fixedNow)).toBe(2);
    });

    it('breaks streak when a gap exists between days', () => {
      const sessions = [
        { startedAt: fixedNow - 4 * ONE_DAY_MS },
        { startedAt: fixedNow - 3 * ONE_DAY_MS },
        // Missed day -2 and -1
      ];

      expect(calculateStudyStreak(sessions, fixedNow)).toBe(0);
    });
  });
});
