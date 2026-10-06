import { validateQuestion, validatePublicQuestion } from './questionValidation';

export class QuestionDomainError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'QuestionDomainError';
    this.errors = errors;
  }
}

export function createQuestion(raw) {
  let normalizedRaw = raw;
  if (raw && typeof raw === 'object') {
    const rawAnswers =
      raw.correctAnswers !== undefined
        ? raw.correctAnswers
        : raw.correctAnswer !== undefined
          ? (Array.isArray(raw.correctAnswer) ? raw.correctAnswer : [raw.correctAnswer])
          : raw.correct_answers !== undefined
            ? raw.correct_answers
            : undefined;

    if (rawAnswers !== undefined && raw.correctAnswers === undefined) {
      normalizedRaw = {
        ...raw,
        correctAnswers: rawAnswers,
      };
    }
  }

  const isPublicOnly = !normalizedRaw || normalizedRaw.correctAnswers === undefined;
  const errors = isPublicOnly ? validatePublicQuestion(normalizedRaw) : validateQuestion(normalizedRaw);
  if (errors.length > 0) {
    throw new QuestionDomainError(
      `Некорректные данные вопроса: ${errors.join(' ')}`,
      errors
    );
  }

  const base = {
    id: String(normalizedRaw.id).trim(),
    topic: String(normalizedRaw.topic).trim(),
    questionText: String(normalizedRaw.questionText),
    options: Object.freeze(normalizedRaw.options.map((opt) => String(opt).trim())),
    multiple: Boolean(
      normalizedRaw.type === 'multiple' ||
        normalizedRaw.multiple ||
        (Array.isArray(normalizedRaw.correctAnswers) && normalizedRaw.correctAnswers.length > 1)
    ),
    difficulty: normalizedRaw.difficulty,
    version: normalizedRaw.version || 1,
    status: normalizedRaw.status === 'archived' ? 'archived' : 'active',
    createdBy: normalizedRaw.createdBy ? String(normalizedRaw.createdBy).trim() : null,
    createdAt: normalizedRaw.createdAt || null,
    updatedAt: normalizedRaw.updatedAt || null,
  };

  if (!isPublicOnly) {
    base.correctAnswers = Object.freeze([...normalizedRaw.correctAnswers]);
    base.explanation = String(normalizedRaw.explanation || '');
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
