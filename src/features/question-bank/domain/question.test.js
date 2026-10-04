import { describe, expect, it } from 'vitest';
import {
  createQuestion,
  isMultipleAnswer,
  QuestionDomainError,
} from './question';

describe('question entity', () => {
  const validData = {
    id: 'sql-001',
    topic: 'sql_queries',
    questionText: 'Какое ключевое слово используется для выборки данных в SQL?',
    options: ['SELECT', 'EXTRACT', 'GET', 'OPEN'],
    correctAnswers: [0],
    explanation: 'Команда SELECT является базовой для выборки данных.',
    difficulty: 'easy',
    version: 1,
  };

  it('creates an immutable question entity for valid data', () => {
    const question = createQuestion(validData);

    expect(question.id).toBe('sql-001');
    expect(question.topic).toBe('sql_queries');
    expect(question.options).toEqual(['SELECT', 'EXTRACT', 'GET', 'OPEN']);
    expect(question.correctAnswers).toEqual([0]);
    expect(Object.isFrozen(question)).toBe(true);
    expect(Object.isFrozen(question.options)).toBe(true);
    expect(Object.isFrozen(question.correctAnswers)).toBe(true);
  });

  it('throws QuestionDomainError with readable message for invalid data', () => {
    expect(() => createQuestion({ ...validData, id: '' })).toThrow(
      QuestionDomainError
    );
    expect(() => createQuestion({ ...validData, options: ['A'] })).toThrow(
      'Некорректные данные вопроса:'
    );
  });

  it('correctly determines single vs multiple answer questions', () => {
    const single = createQuestion(validData);
    expect(isMultipleAnswer(single)).toBe(false);

    const multiple = createQuestion({
      ...validData,
      id: 'sql-002',
      correctAnswers: [0, 1],
    });
    expect(isMultipleAnswer(multiple)).toBe(true);
  });

  it('supports code blocks in questionText', () => {
    const codeQuestion = createQuestion({
      ...validData,
      id: 'py-002',
      topic: 'python_loops',
      questionText: '```python\nfor i in range(3):\n    print(i)\n```',
    });

    expect(codeQuestion.questionText).toContain('```python');
  });

  it('assigns default active status and createdBy metadata when provided', () => {
    const q = createQuestion({
      ...validData,
      createdBy: 'teacher_123',
      status: 'archived',
    });

    expect(q.createdBy).toBe('teacher_123');
    expect(q.status).toBe('archived');
  });
});
