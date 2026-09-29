import { describe, expect, it } from 'vitest';
import {
  CorruptedQuestionDocumentError,
  documentToQuestion,
  questionToDocument,
} from './questionMappers';

describe('questionMappers', () => {
  const validData = {
    topic: 'python_loops',
    questionText:
      'Какой цикл в Python используется при известном числе итераций?',
    options: ['for', 'while', 'repeat', 'loop'],
    correctAnswers: [0],
    explanation: 'Цикл for используется для перебора последовательностей.',
    difficulty: 'easy',
    version: 1,
  };

  describe('documentToQuestion', () => {
    it('maps valid document to question entity', () => {
      const question = documentToQuestion('py-001', validData);

      expect(question.id).toBe('py-001');
      expect(question.topic).toBe('python_loops');
      expect(question.options).toEqual(['for', 'while', 'repeat', 'loop']);
      expect(question.correctAnswers).toEqual([0]);
      expect(Object.isFrozen(question)).toBe(true);
    });

    it('throws CorruptedQuestionDocumentError containing document id when data is corrupted', () => {
      const badData = { ...validData, options: ['only-one'] };

      expect(() => documentToQuestion('doc-corrupt-123', badData)).toThrow(
        CorruptedQuestionDocumentError
      );

      try {
        documentToQuestion('doc-corrupt-123', badData);
      } catch (error) {
        expect(error.message).toContain('doc-corrupt-123');
        expect(error.documentId).toBe('doc-corrupt-123');
      }
    });

    it('throws when document id or data is invalid', () => {
      expect(() => documentToQuestion('', validData)).toThrow(
        CorruptedQuestionDocumentError
      );
      expect(() => documentToQuestion('doc-1', null)).toThrow('doc-1');
    });
  });

  describe('questionToDocument', () => {
    it('maps question entity to Firestore document format without id', () => {
      const question = documentToQuestion('py-001', validData);
      const docData = questionToDocument(question);

      expect(docData).toEqual(validData);
      expect(docData).not.toHaveProperty('id');
    });

    it('throws error when passed invalid entity', () => {
      expect(() => questionToDocument(null)).toThrow();
    });
  });
});
