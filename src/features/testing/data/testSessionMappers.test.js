import { describe, expect, it } from 'vitest';
import { documentToSession, sessionToDocument } from './testSessionMappers';

describe('testSessionMappers', () => {
  const validDoc = {
    userId: 'user-1',
    status: 'in_progress',
    questionIds: ['q1', 'q2'],
    answers: { q1: [0] },
    flagged: ['q1'],
    currentIndex: 1,
    durationLimitSec: 3600,
    startedAt: 1700000000000,
    finishedAt: null,
  };

  it('correctly maps raw numeric timestamps', () => {
    const session = documentToSession('sess-1', validDoc);

    expect(session).toEqual({
      id: 'sess-1',
      userId: 'user-1',
      status: 'in_progress',
      questionIds: ['q1', 'q2'],
      answers: { q1: [0] },
      flagged: ['q1'],
      currentIndex: 1,
      durationLimitSec: 3600,
      startedAt: 1700000000000,
      finishedAt: null,
      score: null,
      questionSnapshots: null,
    });
  });

  it('correctly maps duck-typed Firestore timestamps (ts.toMillis())', () => {
    const docWithTs = {
      ...validDoc,
      startedAt: { toMillis: () => 1700000000000 },
      finishedAt: { toMillis: () => 1700003600000 },
    };

    const session = documentToSession('sess-2', docWithTs);

    expect(session.startedAt).toBe(1700000000000);
    expect(session.finishedAt).toBe(1700003600000);
  });

  it('performs round-trip serialization and deserialization cleanly', () => {
    const originalSession = {
      id: 'sess-roundtrip',
      userId: 'user-42',
      status: 'completed',
      questionIds: ['q-a', 'q-b'],
      answers: { 'q-a': [2, 3], 'q-b': [1] },
      flagged: ['q-b'],
      currentIndex: 0,
      durationLimitSec: 3600,
      startedAt: 1700000000000,
      finishedAt: 1700002500000,
      score: {
        totalScore: 40,
        maxPossibleScore: 50,
        percentage: 80,
      },
      questionSnapshots: [
        {
          id: 'q-a',
          questionText: 'Prompt A',
          options: ['1', '2'],
          userAnswers: [1],
          correctAnswers: [1],
          explanation: 'Exp',
          pointsAwarded: 1,
        },
      ],
    };

    const docData = sessionToDocument(originalSession);
    const restored = documentToSession(originalSession.id, docData);

    expect(restored).toEqual(originalSession);
  });

  it('throws an informative error containing the document ID when data is corrupt', () => {
    expect(() => documentToSession('bad-id-1', null)).toThrow('bad-id-1');
    expect(() =>
      documentToSession('bad-id-2', { ...validDoc, userId: '' })
    ).toThrow('bad-id-2');
    expect(() =>
      documentToSession('bad-id-3', { ...validDoc, status: 'invalid_status' })
    ).toThrow('bad-id-3');
    expect(() =>
      documentToSession('bad-id-4', { ...validDoc, questionIds: [] })
    ).toThrow('bad-id-4');
    expect(() =>
      documentToSession('bad-id-5', { ...validDoc, startedAt: 'not-a-date' })
    ).toThrow('bad-id-5');
  });
});
