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

  it('assembles official UNT variant with 30 single-choice (1-30) and 10 multi-choice (31-40) questions', () => {
    // 50 single-choice questions and 20 multi-choice questions
    const questions = [];
    for (let i = 0; i < 50; i++) {
      questions.push({
        id: `single-${i}`,
        topic: `topic_${i % 5}`,
        correctAnswers: [0], // 1 answer = single choice
      });
    }
    for (let i = 0; i < 20; i++) {
      questions.push({
        id: `multi-${i}`,
        topic: `topic_${i % 5}`,
        correctAnswers: [0, 1], // 2 answers = multiple choice
      });
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const result = buildTestVariant(questions);

    expect(result).toHaveLength(40);

    // Questions 1 to 30 (indices 0 to 29) must all be single-choice
    const first30 = result.slice(0, 30);
    first30.forEach((id) => {
      const q = questionMap.get(id);
      expect(q.correctAnswers).toHaveLength(1);
    });

    // Questions 31 to 40 (indices 30 to 39) must all be multiple-choice
    const last10 = result.slice(30, 40);
    last10.forEach((id) => {
      const q = questionMap.get(id);
      expect(q.correctAnswers.length).toBeGreaterThan(1);
    });

    // Max possible score must be exactly 30*1 + 10*2 = 50 points
    const totalMaxPoints =
      first30.length * 1 +
      last10.reduce((acc, id) => {
        const q = questionMap.get(id);
        return acc + (q.correctAnswers.length > 1 ? 2 : 1);
      }, 0);
    expect(totalMaxPoints).toBe(50);
  });
});
