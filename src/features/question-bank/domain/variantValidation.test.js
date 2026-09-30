import { describe, expect, it } from 'vitest';
import { validateVariantPayload } from './variantValidation';

describe('variantValidation domain module', () => {
  const createValidQuestion = (id, topic, isMulti = false) => ({
    id,
    topic,
    questionText: `Question text for ${id}`,
    options: isMulti
      ? ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4', 'Opt 5']
      : ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
    correctAnswers: isMulti ? [0, 1] : [0],
    explanation: 'Explanation text here.',
    difficulty: 'easy',
    version: 1,
  });

  it('validates a standard 40-question UNT variant (30 single, 10 multi, 50 points)', () => {
    const questions = [];
    // 30 single-choice questions
    for (let i = 1; i <= 30; i++) {
      questions.push(createValidQuestion(`q-${i}`, 'python_loops', false));
    }
    // 10 multiple-choice questions
    for (let i = 31; i <= 40; i++) {
      questions.push(createValidQuestion(`q-${i}`, 'sql_queries', true));
    }

    const payload = {
      variantId: 'unt-test-v1',
      title: 'Тестовый вариант',
      questions,
    };

    const result = validateVariantPayload(payload);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.stats.totalQuestions).toBe(40);
    expect(result.stats.singleChoiceCount).toBe(30);
    expect(result.stats.multiChoiceCount).toBe(10);
    expect(result.stats.totalPoints).toBe(50);
    expect(result.stats.isStandard40UNT).toBe(true);
    expect(result.meta.variantId).toBe('unt-test-v1');
  });

  it('returns invalid if input is not an object or empty', () => {
    expect(validateVariantPayload(null).isValid).toBe(false);
    expect(validateVariantPayload('invalid string').isValid).toBe(false);
    expect(validateVariantPayload({}).isValid).toBe(false);
    expect(validateVariantPayload({ questions: [] }).isValid).toBe(false);
  });

  it('detects duplicate question IDs within the variant', () => {
    const payload = [
      createValidQuestion('dup-01', 'python_loops', false),
      createValidQuestion('dup-01', 'python_loops', false),
    ];

    const result = validateVariantPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((err) => err.includes('дублирующиеся ID'))).toBe(
      true
    );
  });

  it('reports question-level domain validation errors', () => {
    const payload = [
      {
        id: 'bad-01',
        topic: 'non_existent_topic',
        questionText: '',
        options: ['A'], // Less than 2 options
        correctAnswers: [5], // Out of bounds
        explanation: '',
        difficulty: 'invalid_diff',
        version: -1,
      },
    ];

    const result = validateVariantPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it('generates warnings for non-standard question count and point sum', () => {
    const payload = [
      createValidQuestion('q-1', 'python_loops', false),
      createValidQuestion('q-2', 'python_loops', false),
    ];

    const result = validateVariantPayload(payload);
    expect(result.isValid).toBe(true);
    expect(result.stats.totalQuestions).toBe(2);
    expect(result.stats.totalPoints).toBe(2);
    expect(result.stats.isStandard40UNT).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
