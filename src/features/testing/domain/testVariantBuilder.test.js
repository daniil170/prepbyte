import { describe, expect, it } from 'vitest';
import { buildTestVariant } from './testVariantBuilder';
import { TEST_QUESTION_COUNT } from './testConfig';

function createSeededRandom(seed = 42) {
  let current = seed;
  return function () {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

describe('buildTestVariant', () => {
  it('throws an error when question bank has fewer questions than requested count', () => {
    const questions = Array.from({ length: 39 }, (_, i) => ({
      id: `q-${i}`,
      topic: 'python_loops',
    }));

    expect(() => buildTestVariant(questions)).toThrow(
      'Недостаточно вопросов в банке: доступно 39, требуется 40.'
    );
  });

  it('throws an error when questions argument is not an array', () => {
    expect(() => buildTestVariant(null)).toThrow(
      'Вопросы должны быть переданы массивом.'
    );
  });

  it('returns exactly TEST_QUESTION_COUNT (40) unique question IDs by default', () => {
    const questions = Array.from({ length: 60 }, (_, i) => ({
      id: `q-${i}`,
      topic: `topic_${i % 5}`,
    }));

    const result = buildTestVariant(questions);

    expect(result).toHaveLength(TEST_QUESTION_COUNT);
    const uniqueIds = new Set(result);
    expect(uniqueIds.size).toBe(TEST_QUESTION_COUNT);
  });

  it('distributes questions evenly across topics via round-robin', () => {
    // 4 topics, 20 questions each = 80 questions. Request 40 questions.
    const questions = [];
    const topics = ['topic_a', 'topic_b', 'topic_c', 'topic_d'];
    topics.forEach((t) => {
      for (let i = 0; i < 20; i++) {
        questions.push({ id: `${t}-${i}`, topic: t });
      }
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const result = buildTestVariant(questions, { count: 40 });

    const topicCounts = {};
    for (const id of result) {
      const q = questionMap.get(id);
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }

    // Each topic should receive exactly 10 questions
    expect(topicCounts['topic_a']).toBe(10);
    expect(topicCounts['topic_b']).toBe(10);
    expect(topicCounts['topic_c']).toBe(10);
    expect(topicCounts['topic_d']).toBe(10);
  });

  it('is completely deterministic when provided with a seeded random function', () => {
    const questions = Array.from({ length: 80 }, (_, i) => ({
      id: `q-${i}`,
      topic: `topic_${i % 4}`,
    }));

    const rng1 = createSeededRandom(12345);
    const result1 = buildTestVariant(questions, { count: 40, random: rng1 });

    const rng2 = createSeededRandom(12345);
    const result2 = buildTestVariant(questions, { count: 40, random: rng2 });

    expect(result1).toEqual(result2);
  });

  it('contains no duplicate IDs in the assembled variant', () => {
    const questions = Array.from({ length: 100 }, (_, i) => ({
      id: `q-${i}`,
      topic: `topic_${i % 10}`,
    }));

    const result = buildTestVariant(questions, { count: 40 });
    const set = new Set(result);
    expect(set.size).toBe(result.length);
  });
});
