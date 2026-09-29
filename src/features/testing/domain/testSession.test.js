import { describe, expect, it } from 'vitest';
import {
  abandonSession,
  countAnswered,
  createSession,
  finishSession,
  getDeadline,
  getQuestionStatus,
  getRemainingSeconds,
  goToQuestion,
  isExpired,
  selectAnswer,
  toggleFlag,
} from './testSession';

describe('testSession domain', () => {
  const mockQuestionIds = ['q-1', 'q-2', 'q-3', 'q-4'];
  const fixedNow = 1700000000000;

  function makeSession(overrides = {}) {
    return createSession({
      id: 'session-123',
      userId: 'user-abc',
      questionIds: mockQuestionIds,
      durationLimitSec: 3600,
      now: fixedNow,
      ...overrides,
    });
  }

  describe('createSession', () => {
    it('initializes a valid session with correct defaults', () => {
      const session = makeSession();

      expect(session.id).toBe('session-123');
      expect(session.userId).toBe('user-abc');
      expect(session.status).toBe('in_progress');
      expect(session.questionIds).toEqual(mockQuestionIds);
      expect(session.answers).toEqual({});
      expect(session.flagged).toEqual([]);
      expect(session.currentIndex).toBe(0);
      expect(session.durationLimitSec).toBe(3600);
      expect(session.startedAt).toBe(fixedNow);
      expect(session.finishedAt).toBeNull();
    });

    it('validates required fields', () => {
      expect(() =>
        createSession({ id: '', userId: 'u1', questionIds: ['q1'] })
      ).toThrow('Параметр id обязателен');
      expect(() =>
        createSession({ id: 's1', userId: '', questionIds: ['q1'] })
      ).toThrow('Параметр userId обязателен');
      expect(() =>
        createSession({ id: 's1', userId: 'u1', questionIds: [] })
      ).toThrow('Параметр questionIds должен быть непустым');
    });
  });

  describe('selectAnswer', () => {
    it('replaces answer in single choice mode', () => {
      let session = makeSession();
      session = selectAnswer(session, 'q-1', 0, { multiple: false });
      expect(session.answers['q-1']).toEqual([0]);

      session = selectAnswer(session, 'q-1', 2, { multiple: false });
      expect(session.answers['q-1']).toEqual([2]);
    });

    it('toggles answers and maintains sorted uniqueness in multi choice mode', () => {
      let session = makeSession();
      // select option 3
      session = selectAnswer(session, 'q-2', 3, { multiple: true });
      expect(session.answers['q-2']).toEqual([3]);

      // select option 1 -> should sort [1, 3]
      session = selectAnswer(session, 'q-2', 1, { multiple: true });
      expect(session.answers['q-2']).toEqual([1, 3]);

      // deselect option 3 -> [1]
      session = selectAnswer(session, 'q-2', 3, { multiple: true });
      expect(session.answers['q-2']).toEqual([1]);

      // deselect option 1 -> []
      session = selectAnswer(session, 'q-2', 1, { multiple: true });
      expect(session.answers['q-2']).toEqual([]);
    });

    it('ignores answer selection when session is not in progress', () => {
      let session = makeSession();
      session = finishSession(session, fixedNow + 1000);

      const modified = selectAnswer(session, 'q-1', 0);
      expect(modified).toBe(session);
      expect(modified.answers['q-1']).toBeUndefined();
    });

    it('ignores unknown questionId or invalid option index', () => {
      const session = makeSession();
      expect(selectAnswer(session, 'unknown-id', 0)).toBe(session);
      expect(selectAnswer(session, 'q-1', -1)).toBe(session);
      expect(selectAnswer(session, 'q-1', 'invalid')).toBe(session);
    });
  });

  describe('toggleFlag', () => {
    it('adds and removes questionId from flagged array', () => {
      let session = makeSession();
      session = toggleFlag(session, 'q-1');
      expect(session.flagged).toEqual(['q-1']);

      session = toggleFlag(session, 'q-2');
      expect(session.flagged).toEqual(['q-1', 'q-2']);

      session = toggleFlag(session, 'q-1');
      expect(session.flagged).toEqual(['q-2']);
    });

    it('is a no-op when session is finished or questionId is unknown', () => {
      let session = makeSession();
      session = abandonSession(session);

      expect(toggleFlag(session, 'q-1')).toBe(session);

      const inProgress = makeSession();
      expect(toggleFlag(inProgress, 'unknown-id')).toBe(inProgress);
    });
  });

  describe('goToQuestion', () => {
    it('updates currentIndex within bounds', () => {
      let session = makeSession();
      session = goToQuestion(session, 2);
      expect(session.currentIndex).toBe(2);
    });

    it('clamps negative index to 0 and out-of-bounds index to max', () => {
      let session = makeSession();
      session = goToQuestion(session, -5);
      expect(session.currentIndex).toBe(0);

      session = goToQuestion(session, 99);
      expect(session.currentIndex).toBe(mockQuestionIds.length - 1);
    });

    it('is a no-op when index is not a number or session is completed', () => {
      const session = makeSession();
      expect(goToQuestion(session, NaN)).toBe(session);
      expect(goToQuestion(session, '2')).toBe(session);

      const completed = finishSession(session);
      expect(goToQuestion(completed, 1)).toBe(completed);
    });
  });

  describe('finishSession and abandonSession', () => {
    it('marks session as completed with finishedAt timestamp', () => {
      const session = makeSession();
      const finishTime = fixedNow + 500000;
      const completed = finishSession(session, finishTime);

      expect(completed.status).toBe('completed');
      expect(completed.finishedAt).toBe(finishTime);
    });

    it('marks session as abandoned', () => {
      const session = makeSession();
      const abandoned = abandonSession(session);

      expect(abandoned.status).toBe('abandoned');
    });

    it('repeated finish or abandon are no-ops', () => {
      const session = makeSession();
      const completed = finishSession(session, fixedNow + 100);
      expect(finishSession(completed, fixedNow + 200)).toBe(completed);
      expect(abandonSession(completed)).toBe(completed);
    });
  });

  describe('timing and deadlines', () => {
    it('computes deadline based on startedAt and durationLimitSec', () => {
      const session = makeSession();
      expect(getDeadline(session)).toBe(fixedNow + 3600 * 1000);
    });

    it('calculates remaining seconds correctly', () => {
      const session = makeSession();

      // At start (0 elapsed)
      expect(getRemainingSeconds(session, fixedNow)).toBe(3600);

      // 1000 ms elapsed
      expect(getRemainingSeconds(session, fixedNow + 1000)).toBe(3599);

      // Halfway (1800 s elapsed)
      expect(getRemainingSeconds(session, fixedNow + 1800 * 1000)).toBe(1800);

      // Exactly at deadline
      expect(getRemainingSeconds(session, fixedNow + 3600 * 1000)).toBe(0);

      // Past deadline (never negative)
      expect(getRemainingSeconds(session, fixedNow + 4000 * 1000)).toBe(0);
    });

    it('determines expiry correctly', () => {
      const session = makeSession();
      expect(isExpired(session, fixedNow)).toBe(false);
      expect(isExpired(session, fixedNow + 3599 * 1000)).toBe(false);
      expect(isExpired(session, fixedNow + 3600 * 1000)).toBe(true);
      expect(isExpired(session, fixedNow + 4000 * 1000)).toBe(true);
    });
  });

  describe('countAnswered', () => {
    it('counts questions with non-empty selected answers', () => {
      let session = makeSession();
      expect(countAnswered(session)).toBe(0);

      session = selectAnswer(session, 'q-1', 0);
      expect(countAnswered(session)).toBe(1);

      session = selectAnswer(session, 'q-2', 1, { multiple: true });
      expect(countAnswered(session)).toBe(2);

      // Deselect q-2
      session = selectAnswer(session, 'q-2', 1, { multiple: true });
      expect(countAnswered(session)).toBe(1);
    });
  });

  describe('getQuestionStatus', () => {
    it('returns answered, flagged, and current state for a question index', () => {
      let session = makeSession();
      session = selectAnswer(session, 'q-1', 2);
      session = toggleFlag(session, 'q-1');

      // Question 0 is current, answered, and flagged
      expect(getQuestionStatus(session, 0)).toEqual({
        current: true,
        answered: true,
        flagged: true,
      });

      // Question 1 is not current, not answered, not flagged
      expect(getQuestionStatus(session, 1)).toEqual({
        current: false,
        answered: false,
        flagged: false,
      });

      // Navigate to question 1
      session = goToQuestion(session, 1);
      expect(getQuestionStatus(session, 1)).toEqual({
        current: true,
        answered: false,
        flagged: false,
      });
    });

    it('handles out of bounds index safely', () => {
      const session = makeSession();
      expect(getQuestionStatus(session, 99)).toEqual({
        answered: false,
        flagged: false,
        current: false,
      });
    });
  });
});
