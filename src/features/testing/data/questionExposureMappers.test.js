import { describe, expect, it } from 'vitest';
import {
  documentToExposure,
  exposureToDocument,
} from './questionExposureMappers';

describe('questionExposureMappers', () => {
  it('maps a valid Firestore document to domain exposure object and round-trips correctly', () => {
    const docData = {
      userId: 'user_123',
      questions: {
        'py-loop-001': { timesSeen: 2, lastSeenAt: 1700000000000 },
        'sql-q-005': { timesSeen: 1, lastSeenAt: 1700000500000 },
      },
    };

    const exposure = documentToExposure('user_123', docData);
    expect(exposure).toEqual({
      'py-loop-001': { timesSeen: 2, lastSeenAt: 1700000000000 },
      'sql-q-005': { timesSeen: 1, lastSeenAt: 1700000500000 },
    });

    const serialized = exposureToDocument('user_123', exposure);
    expect(serialized).toEqual({
      userId: 'user_123',
      questions: {
        'py-loop-001': { timesSeen: 2, lastSeenAt: 1700000000000 },
        'sql-q-005': { timesSeen: 1, lastSeenAt: 1700000500000 },
      },
    });
  });

  it('handles Timestamp objects in lastSeenAt', () => {
    const docData = {
      userId: 'user_456',
      questions: {
        q1: {
          timesSeen: 3,
          lastSeenAt: { toMillis: () => 1710000000000 },
        },
      },
    };

    const exposure = documentToExposure('user_456', docData);
    expect(exposure.q1.lastSeenAt).toBe(1710000000000);
  });

  it('throws an error containing the document ID when data is missing or corrupted', () => {
    expect(() => documentToExposure('bad_doc_1', null)).toThrow(/bad_doc_1/);
    expect(() => documentToExposure('bad_doc_2', {})).toThrow(/bad_doc_2/);
    expect(() =>
      documentToExposure('bad_doc_3', { questions: 'not an object' })
    ).toThrow(/bad_doc_3/);
    expect(() =>
      documentToExposure('bad_doc_4', {
        questions: {
          q1: 'invalid entry',
        },
      })
    ).toThrow(/bad_doc_4/);
    expect(() =>
      documentToExposure('bad_doc_5', {
        questions: {
          q1: { timesSeen: 'invalid' },
        },
      })
    ).toThrow(/bad_doc_5/);
  });

  it('rejects serialization without a valid userId', () => {
    expect(() => exposureToDocument('', {})).toThrow(
      'userId обязателен для сохранения документа экспозиции.'
    );
  });
});
