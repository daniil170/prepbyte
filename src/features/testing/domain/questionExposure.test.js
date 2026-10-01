import { describe, expect, it } from 'vitest';
import {
  applyAssignment,
  buildExposureFromSessions,
  getEngagedQuestionIds,
  releaseUnengaged,
} from './questionExposure';

describe('questionExposure domain', () => {
  describe('getEngagedQuestionIds', () => {
    it('returns empty array for invalid or empty session', () => {
      expect(getEngagedQuestionIds(null)).toEqual([]);
      expect(getEngagedQuestionIds({})).toEqual([]);
      expect(getEngagedQuestionIds({ questionIds: [] })).toEqual([]);
    });

    it('returns all questionIds for completed session regardless of answers', () => {
      const session = {
        status: 'completed',
        questionIds: ['q1', 'q2', 'q3', 'q4'],
        answers: { q1: [0] },
      };
      expect(getEngagedQuestionIds(session)).toEqual(['q1', 'q2', 'q3', 'q4']);
    });

    it('returns only answered or flagged questions for in_progress session', () => {
      const session = {
        status: 'in_progress',
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
        answers: {
          q1: [1],
          q2: [], // empty answer, not engaged
          q3: [0, 2],
        },
        flagged: ['q4'], // flagged, engaged
      };

      const engaged = getEngagedQuestionIds(session);
      expect(engaged).toEqual(['q1', 'q3', 'q4']);
    });

    it('returns only answered or flagged questions for abandoned session', () => {
      const session = {
        status: 'abandoned',
        questionIds: ['q1', 'q2', 'q3'],
        answers: { q2: [3] },
        flagged: [],
      };
      expect(getEngagedQuestionIds(session)).toEqual(['q2']);
    });
  });

  describe('buildExposureFromSessions', () => {
    it('returns empty object for empty or invalid sessions array', () => {
      expect(buildExposureFromSessions([])).toEqual({});
      expect(buildExposureFromSessions(null)).toEqual({});
    });

    it('correctly aggregates timesSeen and latest lastSeenAt across sessions', () => {
      const s1 = {
        id: 's1',
        status: 'completed',
        startedAt: 1000,
        finishedAt: 2000,
        questionIds: ['q1', 'q2'],
      };
      const s2 = {
        id: 's2',
        status: 'abandoned',
        startedAt: 3000,
        finishedAt: 3500,
        questionIds: ['q2', 'q3'],
        answers: { q2: [1] }, // q2 engaged, q3 not engaged
      };
      const s3 = {
        id: 's3',
        status: 'completed',
        startedAt: 4000,
        finishedAt: 5000,
        questionIds: ['q1'],
      };

      const exposure = buildExposureFromSessions([s1, s2, s3]);

      // q1 was seen in s1 and s3 -> timesSeen = 2, latest = 5000
      expect(exposure.q1).toEqual({
        timesSeen: 2,
        lastSeenAt: 5000,
      });

      // q2 was seen in s1 and s2 -> timesSeen = 2, latest = 3500
      expect(exposure.q2).toEqual({
        timesSeen: 2,
        lastSeenAt: 3500,
      });

      // q3 was not engaged in s2 -> not in exposure
      expect(exposure.q3).toBeUndefined();
    });
  });

  describe('applyAssignment', () => {
    it('immutably increments timesSeen and records current timestamp', () => {
      const initial = {
        q1: { timesSeen: 1, lastSeenAt: 1000 },
      };

      const t2 = 2500;
      const updated = applyAssignment(initial, ['q1', 'q2'], t2);

      expect(initial.q1.timesSeen).toBe(1); // immutability
      expect(initial.q2).toBeUndefined();

      expect(updated.q1).toEqual({
        timesSeen: 2,
        lastSeenAt: t2,
      });
      expect(updated.q2).toEqual({
        timesSeen: 1,
        lastSeenAt: t2,
      });
    });

    it('handles null or empty initial exposure', () => {
      const updated = applyAssignment(null, ['q1'], 1234);
      expect(updated).toEqual({
        q1: { timesSeen: 1, lastSeenAt: 1234 },
      });
    });
  });

  describe('releaseUnengaged', () => {
    it('decrements unengaged questions and purges when timesSeen reaches 0', () => {
      const exposure = {
        q1: { timesSeen: 1, lastSeenAt: 1000 },
        q2: { timesSeen: 2, lastSeenAt: 1000 },
        q3: { timesSeen: 1, lastSeenAt: 1000 },
      };

      const abandonedSession = {
        status: 'abandoned',
        questionIds: ['q1', 'q2', 'q3'],
        answers: {
          q2: [0], // engaged
        },
        flagged: [],
      };

      const cleaned = releaseUnengaged(exposure, abandonedSession);

      // q1: was 1, unengaged -> reaches 0 -> deleted
      expect(cleaned.q1).toBeUndefined();

      // q2: was 2, engaged -> untouched -> remains 2
      expect(cleaned.q2).toEqual({ timesSeen: 2, lastSeenAt: 1000 });

      // q3: was 1, unengaged -> reaches 0 -> deleted
      expect(cleaned.q3).toBeUndefined();
    });

    it('handles multiple prior exposures gracefully without going below 0', () => {
      const exposure = {
        q1: { timesSeen: 3, lastSeenAt: 2000 },
      };

      const abandonedSession = {
        status: 'abandoned',
        questionIds: ['q1'],
        answers: {},
        flagged: [],
      };

      const cleaned = releaseUnengaged(exposure, abandonedSession);
      expect(cleaned.q1).toEqual({ timesSeen: 2, lastSeenAt: 2000 });
    });
  });

  describe('restart scenario simulation', () => {
    it('does not burn questions if user starts and immediately restarts without engaging', () => {
      let exposure = {};

      const variantAQuestions = Array.from(
        { length: 40 },
        (_, i) => `q-${i + 1}`
      );

      // 1. User starts test variant A
      exposure = applyAssignment(exposure, variantAQuestions, 1000);
      expect(Object.keys(exposure)).toHaveLength(40);
      expect(exposure['q-1'].timesSeen).toBe(1);

      // 2. User answers nothing, flags nothing, and clicks Start New Test
      // Session A is marked abandoned with 0 answers
      const sessionA = {
        id: 'sess-a',
        status: 'abandoned',
        questionIds: variantAQuestions,
        answers: {},
        flagged: [],
      };

      // releaseUnengaged is applied for session A
      exposure = releaseUnengaged(exposure, sessionA);

      // Exposure must be completely empty: all 40 questions restored!
      expect(Object.keys(exposure)).toHaveLength(0);

      // 3. What if user answered 2 questions and flagged 1, then restarted?
      exposure = applyAssignment(exposure, variantAQuestions, 2000);
      const sessionB = {
        id: 'sess-b',
        status: 'abandoned',
        questionIds: variantAQuestions,
        answers: {
          'q-1': [0],
          'q-5': [2],
        },
        flagged: ['q-10'],
      };

      exposure = releaseUnengaged(exposure, sessionB);

      // Only the 3 engaged questions should remain!
      expect(Object.keys(exposure)).toEqual(['q-1', 'q-5', 'q-10']);
      expect(exposure['q-1'].timesSeen).toBe(1);
      expect(exposure['q-5'].timesSeen).toBe(1);
      expect(exposure['q-10'].timesSeen).toBe(1);
      expect(exposure['q-2']).toBeUndefined();
    });
  });
});
