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
    return createQuestion({
      id: id.trim(),
      topic: data.topic,
      questionText: data.questionText,
      options: data.options,
      correctAnswers: data.correctAnswers,
      explanation: data.explanation,
      difficulty: data.difficulty,
      version: data.version,
    });
  } catch (error) {
    throw new CorruptedQuestionDocumentError(id, error.message);
  }
}

export function questionToDocument(question) {
  if (!question || typeof question !== 'object') {
    throw new Error('Invalid question entity provided to questionToDocument');
  }

  return {
    topic: question.topic,
    questionText: question.questionText,
    options: [...question.options],
    correctAnswers: [...question.correctAnswers],
    explanation: question.explanation,
    difficulty: question.difficulty,
    version: question.version,
  };
}
