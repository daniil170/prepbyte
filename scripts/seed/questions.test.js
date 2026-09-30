import { describe, expect, it } from 'vitest';
import { validateQuestion } from '../../src/features/question-bank/domain/questionValidation';
import { TOPICS } from '../../src/features/question-bank/domain/topics';
import { SEED_QUESTIONS } from './questions/index.js';

describe('SEED_QUESTIONS dataset', () => {
  it('contains at least 36 questions', () => {
    expect(SEED_QUESTIONS.length).toBeGreaterThanOrEqual(36);
  });

  it('has unique IDs for every question', () => {
    const ids = SEED_QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has at least 3 questions for every defined topic', () => {
    const countsByTopic = SEED_QUESTIONS.reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    }, {});

    TOPICS.forEach((topic) => {
      expect(countsByTopic[topic.id] || 0).toBeGreaterThanOrEqual(3);
    });
  });

  it('validates successfully against validateQuestion domain rules', () => {
    SEED_QUESTIONS.forEach((q) => {
      const errors = validateQuestion(q);
      expect(errors).toEqual([]);
    });
  });
});
