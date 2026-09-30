import { describe, expect, it } from 'vitest';
import { validateQuestion } from '../../src/features/question-bank/domain/questionValidation';
import { TOPICS } from '../../src/features/question-bank/domain/topics';
import { SEED_QUESTIONS } from './questions/index.js';

describe('SEED_QUESTIONS dataset', () => {
  it('contains at least 96 questions', () => {
    expect(SEED_QUESTIONS.length).toBeGreaterThanOrEqual(96);
  });

  it('has unique IDs for every question', () => {
    const ids = SEED_QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has unique question texts across the dataset when normalized', () => {
    const normalizedTexts = SEED_QUESTIONS.map((q) =>
      q.questionText.trim().toLowerCase().replace(/\s+/g, ' ')
    );
    const uniqueTexts = new Set(normalizedTexts);
    expect(uniqueTexts.size).toBe(normalizedTexts.length);
  });

  it('has at least 8 questions for every defined topic', () => {
    const countsByTopic = SEED_QUESTIONS.reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    }, {});

    TOPICS.forEach((topic) => {
      expect(countsByTopic[topic.id] || 0).toBeGreaterThanOrEqual(8);
    });
  });

  it('has at least 1 multiple-answer question per topic', () => {
    const multiByTopic = SEED_QUESTIONS.filter(
      (q) => q.correctAnswers.length > 1
    ).reduce((acc, q) => {
      acc[q.topic] = (acc[q.topic] || 0) + 1;
      return acc;
    }, {});

    TOPICS.forEach((topic) => {
      expect(multiByTopic[topic.id] || 0).toBeGreaterThanOrEqual(1);
    });
  });

  it('has exactly 4 options for all single-answer questions', () => {
    const singleAnswerQuestions = SEED_QUESTIONS.filter(
      (q) => q.correctAnswers.length === 1
    );

    singleAnswerQuestions.forEach((q) => {
      expect(q.options).toHaveLength(4);
    });
  });

  it('validates successfully against validateQuestion domain rules', () => {
    SEED_QUESTIONS.forEach((q) => {
      const errors = validateQuestion(q);
      expect(errors).toEqual([]);
    });
  });
});
