import { describe, expect, it } from 'vitest';
import { validateQuestion } from './questionValidation';

describe('validateQuestion', () => {
  const validQuestion = {
    id: 'py-001',
    topic: 'python_loops',
    questionText: 'Что выведет следующий код?\n```python\nprint(2 ** 3)\n```',
    options: ['6', '8', '9', '5'],
    correctAnswers: [1],
    explanation: 'Оператор ** выполняет возведение в степень: 2^3 = 8.',
    difficulty: 'easy',
    version: 1,
  };

  it('passes validation for valid question data', () => {
    const errors = validateQuestion(validQuestion);
    expect(errors).toHaveLength(0);
  });

  it('rejects non-object or null input', () => {
    expect(validateQuestion(null)).toContain(
      'Данные вопроса должны быть объектом.'
    );
    expect(validateQuestion('string')).toContain(
      'Данные вопроса должны быть объектом.'
    );
  });

  it('requires non-empty id, questionText, and explanation', () => {
    const errors = validateQuestion({
      ...validQuestion,
      id: '',
      questionText: '   ',
      explanation: '',
    });

    expect(errors).toContain('Поле id обязательно и не должно быть пустым.');
    expect(errors).toContain(
      'Поле questionText обязательно и не должно быть пустым.'
    );
    expect(errors).toContain(
      'Поле explanation обязательно и не должно быть пустым.'
    );
  });

  it('validates topic exists in catalog', () => {
    const errors = validateQuestion({
      ...validQuestion,
      topic: 'unknown_topic',
    });

    expect(errors).toContain(
      'Поле topic должно содержать существующий идентификатор темы.'
    );
  });

  it('validates difficulty', () => {
    const errors = validateQuestion({
      ...validQuestion,
      difficulty: 'super_hard',
    });

    expect(errors).toContain(
      'Поле difficulty должно иметь одно из значений: easy, medium, hard.'
    );
  });

  it('validates version is a positive integer', () => {
    expect(validateQuestion({ ...validQuestion, version: 0 })).toContain(
      'Поле version должно быть целым положительным числом.'
    );
    expect(validateQuestion({ ...validQuestion, version: 1.5 })).toContain(
      'Поле version должно быть целым положительным числом.'
    );
    expect(validateQuestion({ ...validQuestion, version: '1' })).toContain(
      'Поле version должно быть целым положительным числом.'
    );
  });

  it('validates options constraints (2..6 items, non-empty, unique)', () => {
    expect(validateQuestion({ ...validQuestion, options: ['one'] })).toContain(
      'Количество вариантов ответа (options) должно быть от 2 до 6.'
    );

    expect(
      validateQuestion({
        ...validQuestion,
        options: ['1', '2', '3', '4', '5', '6', '7'],
      })
    ).toContain('Количество вариантов ответа (options) должно быть от 2 до 6.');

    expect(
      validateQuestion({
        ...validQuestion,
        options: ['A', '  ', 'B'],
      })
    ).toContain(
      'Все варианты ответа в options должны быть непустыми строками.'
    );

    expect(
      validateQuestion({
        ...validQuestion,
        options: ['A', 'B', 'A'],
      })
    ).toContain('Варианты ответа в options не должны дублироваться.');
  });

  it('validates correctAnswers constraints (non-empty, unique, valid indices)', () => {
    expect(
      validateQuestion({ ...validQuestion, correctAnswers: [] })
    ).toContain('Массив correctAnswers не должен быть пустым.');

    expect(
      validateQuestion({ ...validQuestion, correctAnswers: [1, 1] })
    ).toContain('Массив correctAnswers не должен содержать дубликатов.');

    expect(
      validateQuestion({ ...validQuestion, correctAnswers: [99] })
    ).toContain(
      'Каждый элемент correctAnswers должен быть корректным индексом из диапазона options.'
    );

    expect(
      validateQuestion({ ...validQuestion, correctAnswers: [-1] })
    ).toContain(
      'Каждый элемент correctAnswers должен быть корректным индексом из диапазона options.'
    );

    expect(
      validateQuestion({ ...validQuestion, correctAnswers: ['1'] })
    ).toContain(
      'Каждый элемент correctAnswers должен быть корректным индексом из диапазона options.'
    );
  });
});
