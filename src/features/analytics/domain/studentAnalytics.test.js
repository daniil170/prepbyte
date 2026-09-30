import { describe, expect, it } from 'vitest';
import { buildStudentAnalytics } from './studentAnalytics';

describe('studentAnalytics facade', () => {
  it('builds full analytics structure for empty session list', () => {
    const analytics = buildStudentAnalytics([]);
    expect(analytics.hasAttempts).toBe(false);
    expect(analytics.hasCompletedAttempts).toBe(false);
    expect(analytics.kpis.totalTests).toBe(0);
    expect(analytics.topicMastery.allTopics).toHaveLength(14);
    expect(analytics.scoreTimeline).toEqual([]);
    expect(analytics.recentAttempts).toEqual([]);
  });

  it('aggregates data and sorts recent attempts descending by date', () => {
    const sessions = [
      {
        id: 's-early',
        status: 'completed',
        startedAt: 1000,
        finishedAt: 2000,
        score: { totalScore: 30, maxPossibleScore: 50, percentage: 60 },
      },
      {
        id: 's-late',
        status: 'completed',
        startedAt: 5000,
        finishedAt: 6000,
        score: { totalScore: 45, maxPossibleScore: 50, percentage: 90 },
      },
    ];

    const analytics = buildStudentAnalytics(sessions);

    expect(analytics.hasAttempts).toBe(true);
    expect(analytics.hasCompletedAttempts).toBe(true);
    expect(analytics.kpis.totalTests).toBe(2);
    expect(analytics.kpis.completedTests).toBe(2);
    expect(analytics.kpis.averageScore).toBe(37.5);
    expect(analytics.kpis.topScore).toBe(45);

    // Recent attempts must be latest first
    expect(analytics.recentAttempts[0].id).toBe('s-late');
    expect(analytics.recentAttempts[1].id).toBe('s-early');

    // Score timeline must be chronological ascending
    expect(analytics.scoreTimeline[0].id).toBe('s-early');
    expect(analytics.scoreTimeline[1].id).toBe('s-late');
  });

  it('handles sessions with in-progress status correctly', () => {
    const sessions = [
      {
        id: 's-wip',
        status: 'in_progress',
        startedAt: 1000,
      },
    ];

    const analytics = buildStudentAnalytics(sessions);
    expect(analytics.hasAttempts).toBe(true);
    expect(analytics.hasCompletedAttempts).toBe(false);
    expect(analytics.kpis.totalTests).toBe(1);
    expect(analytics.kpis.completedTests).toBe(0);
    expect(analytics.kpis.completionRate).toBe(0);
    expect(analytics.kpis.averageScore).toBe(0);
    expect(analytics.scoreTimeline).toEqual([]);
    expect(analytics.recentAttempts).toHaveLength(1);
    expect(analytics.recentAttempts[0].id).toBe('s-wip');
  });

  it('handles multiple perfect 50/50 scores and categorizes all topics as strong', () => {
    const sessions = [
      {
        id: 's-perf-1',
        status: 'completed',
        startedAt: 1000,
        finishedAt: 2000,
        score: {
          totalScore: 50,
          maxPossibleScore: 50,
          percentage: 100,
          byTopicBreakdown: {
            python_loops: { score: 5, maxScore: 5, totalQuestions: 3 },
            sql_queries: { score: 5, maxScore: 5, totalQuestions: 3 },
          },
        },
      },
      {
        id: 's-perf-2',
        status: 'completed',
        startedAt: 3000,
        finishedAt: 4000,
        score: {
          totalScore: 50,
          maxPossibleScore: 50,
          percentage: 100,
          byTopicBreakdown: {
            python_loops: { score: 5, maxScore: 5, totalQuestions: 3 },
            sql_queries: { score: 5, maxScore: 5, totalQuestions: 3 },
          },
        },
      },
    ];

    const analytics = buildStudentAnalytics(sessions);
    expect(analytics.kpis.averageScore).toBe(50);
    expect(analytics.kpis.topScore).toBe(50);
    expect(analytics.kpis.completionRate).toBe(100);

    const pythonMastery = analytics.topicMastery.allTopics.find(
      (t) => t.id === 'python_loops'
    );
    expect(pythonMastery).toBeDefined();
    expect(pythonMastery.percentage).toBe(100);
    expect(pythonMastery.isStrong).toBe(true);
  });
});
