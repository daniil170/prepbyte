import { describe, expect, it } from 'vitest';
import { buildImportedQuestions } from './questionImportMapper';

describe('questionImportMapper', () => {
  const validParsedItem = {
    number: 1,
    questionText: 'Какая структура данных работает по принципу LIFO?',
    options: ['Очередь', 'Стек', 'Дерево', 'Граф'],
    correctAnswers: [1],
    explanation: 'Стек использует принцип LIFO (Last In First Out).',
    status: 'ok',
    issues: [],
  };

  it('handles empty input', () => {
    expect(buildImportedQuestions([])).toEqual([]);
    expect(buildImportedQuestions(null)).toEqual([]);
  });

  it('produces valid question shape with deterministic ID from slug and question number', () => {
    const results = buildImportedQuestions([validParsedItem], {
      variantSlug: 'unt-2026-v1',
      defaultTopic: 'python_loops',
      defaultDifficulty: 'easy',
    });

    expect(results).toHaveLength(1);
    const item = results[0];
    expect(item.status).toBe('ok');
    expect(item.duplicateOf).toBeNull();
    expect(item.issues).toHaveLength(0);

    expect(item.question).toEqual({
      id: 'unt-2026-v1-001',
      topic: 'python_loops',
      questionText: 'Какая структура данных работает по принципу LIFO?',
      options: ['Очередь', 'Стек', 'Дерево', 'Граф'],
      correctAnswers: [1],
      explanation: 'Стек использует принцип LIFO (Last In First Out).',
      difficulty: 'easy',
      version: 1,
    });
  });

  it('flags needs-explanation when explanation is missing', () => {
    const itemWithoutExplanation = {
      ...validParsedItem,
      explanation: '',
    };

    const results = buildImportedQuestions([itemWithoutExplanation], {
      variantSlug: 'var1',
      defaultTopic: 'python_loops',
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('error');
    expect(results[0].issues).toContain('needs-explanation');
  });

  it('flags exact duplicates against existing bank questions', () => {
    const existing = [
      {
        id: 'existing-q-99',
        questionText: 'Какая структура данных работает по принципу LIFO?',
      },
    ];

    const results = buildImportedQuestions([validParsedItem], {
      variantSlug: 'var1',
      defaultTopic: 'python_loops',
      existingQuestions: existing,
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('error');
    expect(results[0].duplicateOf).toBe('existing-q-99');
    expect(results[0].issues[0]).toContain('Точный дубликат');
  });

  it('flags exact duplicates within the same imported batch', () => {
    const item1 = { ...validParsedItem, number: 1 };
    const item2 = { ...validParsedItem, number: 2 };

    const results = buildImportedQuestions([item1, item2], {
      variantSlug: 'var1',
      defaultTopic: 'python_loops',
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('ok');
    expect(results[1].status).toBe('error');
    expect(results[1].duplicateOf).toBe('var1-001');
    expect(results[1].issues[0]).toContain('Точный дубликат вопроса #1');
  });

  it('flags near duplicates with warning status and duplicateOf reference', () => {
    const item = {
      ...validParsedItem,
      questionText:
        'Какая структура данных работает по принципу LIFO в алгоритмах программирования',
    };

    const existing = [
      {
        id: 'existing-q-10',
        questionText:
          'Какая структура данных работает по принципу LIFO в алгоритмах программирования сейчас',
      },
    ];

    const results = buildImportedQuestions([item], {
      variantSlug: 'var1',
      defaultTopic: 'python_loops',
      existingQuestions: existing,
    });

    expect(results).toHaveLength(1);
    expect(results[0].duplicateOf).toBe('existing-q-10');
    expect(results[0].status).toBe('warning');
    expect(results[0].issues[0]).toContain('Похож на вопрос existing-q-10');
  });

  it('uses defaultExplanation when item explanation is empty', () => {
    const itemWithoutExplanation = {
      ...validParsedItem,
      explanation: '',
    };

    const results = buildImportedQuestions([itemWithoutExplanation], {
      variantSlug: 'var1',
      defaultTopic: 'python_loops',
      defaultExplanation: 'Пояснение к заданию по умолчанию',
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('ok');
    expect(results[0].question.explanation).toBe(
      'Пояснение к заданию по умолчанию'
    );
  });
});
