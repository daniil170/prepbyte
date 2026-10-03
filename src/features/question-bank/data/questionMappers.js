import { createQuestion } from '../domain/question';

export class CorruptedQuestionDocumentError extends Error {
  constructor(id, reason) {
    super(`Corrupted question document [id=${id}]: ${reason}`);
    this.name = 'CorruptedQuestionDocumentError';
    this.documentId = id;
  }
}

export function documentToQuestion(id, data) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new CorruptedQuestionDocumentError(
      id || 'unknown',
      'Document ID is missing or invalid'
    );
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new CorruptedQuestionDocumentError(
      id,
      'Document data must be a non-null object'
    );
  }

  try {
    const raw = {
      id: id.trim(),
      topic: data.topic,
      questionText: data.questionText,
      options: data.options,
      multiple: data.multiple,
      difficulty: data.difficulty,
      version: data.version,
    };
    if (data.correctAnswers !== undefined) {
      raw.correctAnswers = data.correctAnswers;
    }
    if (data.explanation !== undefined) {
      raw.explanation = data.explanation;
    }
    return createQuestion(raw);
  } catch (error) {
    throw new CorruptedQuestionDocumentError(id, error.message);
  }
}

export function questionToDocument(question) {
  if (!question || typeof question !== 'object') {
    throw new Error('Invalid question entity provided to questionToDocument');
  }

  // Public question representation stored in /questions/{questionId} (NO correctAnswers)
  return {
    topic: question.topic,
    questionText: question.questionText,
    options: [...question.options],
    multiple: Array.isArray(question.correctAnswers)
      ? question.correctAnswers.length > 1
      : Boolean(question.multiple),
    difficulty: question.difficulty,
    version: question.version || 1,
  };
}

export function questionToAnswerDocument(question) {
  if (!question || typeof question !== 'object') {
    throw new Error('Invalid question entity provided to questionToAnswerDocument');
  }

  // Protected answer representation stored in /question_answers/{questionId}
  return {
    questionId: question.id,
    correctAnswers: Array.isArray(question.correctAnswers)
      ? [...question.correctAnswers]
      : [],
    explanation: question.explanation || '',
    version: question.version || 1,
  };
}

export function documentToQuestionAnswer(id, data) {
  if (!id || !data || typeof data !== 'object') {
    return null;
  }
  return {
    id,
    questionId: data.questionId || id,
    correctAnswers: Array.isArray(data.correctAnswers) ? [...data.correctAnswers] : [],
    explanation: data.explanation || '',
    version: data.version || 1,
  };
}
