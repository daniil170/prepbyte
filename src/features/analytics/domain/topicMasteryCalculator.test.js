import { describe, expect, it } from 'vitest';
import { calculateTopicMastery } from './topicMasteryCalculator';

describe('topicMasteryCalculator', () => {
  it('returns all 12 topics with 0% mastery when no completed sessions exist', () => {
    const result = calculateTopicMastery([]);
    expect(result.allTopics).toHaveLength(12);
    expect(result.strongTopics).toHaveLength(0);
    expect(result.growthTopics).toHaveLength(12);
    expect(result.overallMastery).toBe(0);
  });

  it('aggregates scores and separates strong vs growth topics correctly', () => {
    const mockSessions = [
      {
        status: 'completed',
        score: {
          byTopicBreakdown: {
            python_loops: {
              score: 4,
              maxScore: 4,
              totalQuestions: 4,
            },
            sql_queries: {
              score: 2,
              maxScore: 4,
              totalQuestions: 4,
            },
          },
        },
      },
      {
        status: 'completed',
        score: {
          byTopicBreakdown: {
            python_loops: {
              score: 4,
              maxScore: 4,
              totalQuestions: 4,
            },
            sql_queries: {
              score: 1,
              maxScore: 4,
              totalQuestions: 4,
            },
          },
        },
      },
    ];

    const result = calculateTopicMastery(mockSessions);

    // python_loops: 8/8 = 100% -> strong
    const pyTopic = result.allTopics.find((t) => t.id === 'python_loops');
    expect(pyTopic.percentage).toBe(100);
    expect(pyTopic.isStrong).toBe(true);

    // sql_queries: 3/8 = 38% -> growth
    const sqlTopic = result.allTopics.find((t) => t.id === 'sql_queries');
    expect(sqlTopic.percentage).toBe(38);
    expect(sqlTopic.isStrong).toBe(false);

    expect(result.strongTopics.map((t) => t.id)).toContain('python_loops');
    expect(result.growthTopics.map((t) => t.id)).toContain('sql_queries');
  });

  it('falls back to questionSnapshots when byTopicBreakdown is absent', () => {
    const sessionWithSnapshots = [
      {
        status: 'completed',
        questionSnapshots: [
          {
            topic: 'python_loops',
            pointsAwarded: 1,
            maxPoints: 1,
          },
          {
            topic: 'python_loops',
            pointsAwarded: 1,
            maxPoints: 1,
          },
          {
            topic: 'network_protocols',
            pointsAwarded: 0,
            maxPoints: 2,
          },
        ],
      },
    ];

    const result = calculateTopicMastery(sessionWithSnapshots);

    const py = result.allTopics.find((t) => t.id === 'python_loops');
    expect(py.score).toBe(2);
    expect(py.maxScore).toBe(2);
    expect(py.percentage).toBe(100);

    const net = result.allTopics.find((t) => t.id === 'network_protocols');
    expect(net.score).toBe(0);
    expect(net.maxScore).toBe(2);
    expect(net.percentage).toBe(0);
  });
});
