import { describe, expect, it } from 'vitest';
import {
  validateCanonicalJsonVariant,
  validateCanonicalQuestion,
} from './jsonVariantSchema.js';

function createValidVariant() {
  const questions = [];

  // Q1-30: Single choice
  for (let i = 1; i <= 30; i++) {
    questions.push({
      number: i,
      questionText: `Вопрос №${i} по информатике?`,
      options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
      correctAnswers: [(i - 1) % 4],
      explanation: `Пояснение к вопросу №${i}`,
      topic: i % 2 === 0 ? 'python_loops' : 'sql_queries',
      difficulty: 'easy',
    });
  }

  // Q31-40: Multiple choice
  for (let i = 31; i <= 40; i++) {
    questions.push({
      number: i,
      questionText: `Множественный вопрос №${i} по информатике?`,
      options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D', 'Вариант E'],
      correctAnswers: [0, 1, 2],
      explanation: `Пояснение к множественному вопросу №${i}`,
      topic: 'network_protocols',
      difficulty: 'medium',
    });
  }

  return {
    variantId: 'unt-var-2026-10-12-01',
    title: 'ЕНТ Информатика — Вариант №1',
    createdAt: '2026-10-12T12:00:00Z',
    questions,
  };
}

describe('jsonVariantSchema', () => {
  it('validates a correct canonical 40-question variant successfully', () => {
    const validVariant = createValidVariant();
    const result = validateCanonicalJsonVariant(validVariant);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats).toEqual({
      totalQuestions: 40,
      totalPoints: 50,
      singleChoiceCount: 30,
      multiChoiceCount: 10,
      isStandard40UNT: true,
    });
    expect(result.meta.variantId).toBe('unt-var-2026-10-12-01');
    expect(result.questions).toHaveLength(40);
  });

  it('fails when variantId does not follow unt-var-YYYY-MM-DD-NN pattern', () => {
    const variant = createValidVariant();
    variant.variantId = 'invalid-slug-123';

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('variantId'))).toBe(true);
  });

  it('fails when question count is not 40', () => {
    const variant = createValidVariant();
    variant.questions.pop(); // 39 questions

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('ровно 40 заданий'))).toBe(true);
  });

  it('fails when Part 1 question has more than 1 correct answer', () => {
    const variant = createValidVariant();
    variant.questions[0].correctAnswers = [0, 1]; // Question 1 has 2 answers

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Задание #1 (Часть 1)'))).toBe(true);
  });

  it('fails when Part 1 question has incorrect options count (not 4)', () => {
    const variant = createValidVariant();
    variant.questions[0].options = ['A', 'B', 'C']; // only 3 options

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('ровно 4 варианта ответа'))).toBe(true);
  });

  it('fails when Part 2 question has less than 2 or more than 3 correct answers', () => {
    const variant = createValidVariant();
    variant.questions[30].correctAnswers = [0]; // Q31 has only 1 answer

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Задание #31 (Часть 2)'))).toBe(true);
  });

  it('fails when correctAnswers contains out-of-bounds index', () => {
    const variant = createValidVariant();
    variant.questions[5].correctAnswers = [99]; // Options count is 4 (indices 0..3)

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('выходит за пределы допустимого диапазона'))).toBe(true);
  });

  it('fails when topic is not a valid slug from topics.js', () => {
    const variant = createValidVariant();
    variant.questions[2].topic = 'unknown_invalid_topic';

    const result = validateCanonicalJsonVariant(variant);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('валидный идентификатор темы'))).toBe(true);
  });

  it('fails when payload is not an object or questions is not array', () => {
    expect(validateCanonicalJsonVariant(null).isValid).toBe(false);
    expect(validateCanonicalJsonVariant('string').isValid).toBe(false);
    expect(validateCanonicalJsonVariant({ variantId: 'unt-var-2026-10-12-01', title: 'T' }).isValid).toBe(false);
  });
});
