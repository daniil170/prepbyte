import { validateQuestion } from './questionValidation';

export class QuestionDomainError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'QuestionDomainError';
    this.errors = errors;
  }
}

export function createQuestion(raw) {
  const errors = validateQuestion(raw);
  if (errors.length > 0) {
    throw new QuestionDomainError(
      `Некорректные данные вопроса: ${errors.join(' ')}`,
      errors
    );
  }

  return Object.freeze({
    id: String(raw.id).trim(),
    topic: String(raw.topic).trim(),
    questionText: String(raw.questionText),
    options: Object.freeze(raw.options.map((opt) => String(opt).trim())),
    correctAnswers: Object.freeze([...raw.correctAnswers]),
    explanation: String(raw.explanation),
    difficulty: raw.difficulty,
    version: raw.version,
  });
}

export function isMultipleAnswer(question) {
  if (!question || !Array.isArray(question.correctAnswers)) {
    return false;
  }
  return question.correctAnswers.length > 1;
}
