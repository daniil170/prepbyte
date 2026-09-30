import { describe, expect, it } from 'vitest';
import { validateQuestion } from './questionValidation';
import { generateCurriculumQuestions } from './curriculumGenerator';

describe('curriculumGenerator domain module', () => {
  it('generates a full 40-question UNT exam with valid structure and topics', () => {
    const questions = generateCurriculumQuestions({ mode: 'full_exam' });

    expect(questions).toHaveLength(40);

    const singleChoice = questions.filter((q) => q.correctAnswers.length === 1);
    const multiChoice = questions.filter((q) => q.correctAnswers.length > 1);

    expect(singleChoice).toHaveLength(30);
    expect(multiChoice).toHaveLength(10);

    // Every generated question must validate against domain rules
    questions.forEach((q) => {
      const errors = validateQuestion(q);
      expect(errors).toEqual([]);
    });

    // Check topic coverage
    const topicsSet = new Set(questions.map((q) => q.topic));
    expect(topicsSet.size).toBe(14);
  });

  it('generates a topic deep-dive set for a specific topic', () => {
    const questions = generateCurriculumQuestions({
      mode: 'topic_deep_dive',
      topicId: 'network_addressing',
      count: 10,
    });

    expect(questions).toHaveLength(10);
    questions.forEach((q) => {
      expect(q.topic).toBe('network_addressing');
      const errors = validateQuestion(q);
      expect(errors).toEqual([]);
    });
  });
});
