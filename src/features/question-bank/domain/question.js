import { validateQuestion, validatePublicQuestion } from './questionValidation';

export class QuestionDomainError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'QuestionDomainError';
    this.errors = errors;
  }
}

export function createQuestion(raw) {
  const isPublicOnly = !raw || raw.correctAnswers === undefined;
  const errors = isPublicOnly ? validatePublicQuestion(raw) : validateQuestion(raw);
  if (errors.length > 0) {
    throw new QuestionDomainError(
      `Некорректные данные вопроса: ${errors.join(' ')}`,
      errors
    );
  }

  const base = {
    id: String(raw.id).trim(),
    topic: String(raw.topic).trim(),
    questionText: String(raw.questionText),
    options: Object.freeze(raw.options.map((opt) => String(opt).trim())),
    multiple: Boolean(
      raw.type === 'multiple' ||
        raw.multiple ||
        (Array.isArray(raw.correctAnswers) && raw.correctAnswers.length > 1)
    ),
    difficulty: raw.difficulty,
    version: raw.version || 1,
  };

  if (!isPublicOnly) {
    base.correctAnswers = Object.freeze([...raw.correctAnswers]);
    base.explanation = String(raw.explanation || '');
  }

  return Object.freeze(base);
}

export function isMultipleAnswer(question) {
  if (!question) {
    return false;
  }
  if (typeof question.multiple === 'boolean') {
    return question.multiple;
  }
  if (Array.isArray(question.correctAnswers)) {
    return question.correctAnswers.length > 1;
  }
  return false;
}
