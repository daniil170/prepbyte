import { describe, expect, it } from 'vitest';
import {
  createExamSession,
  generateQuestionOrder,
  getExamSessionRemainingSeconds,
  isExamSessionExpired,
  startExamSession,
  submitExamSession,
  updateExamSessionAnswer,
} from './examSession';

describe('examSession domain module', () => {
  it('creates a session in waiting status with empty answers and questionOrder', () => {
    const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const session = createExamSession({
      id: 'sess-1',
      examId: 'exam-1',
      studentId: 'student-1',
      studentName: 'Иван Иванов',
      groupId: 'grp-1',
      questionIds,
      durationSeconds: 3600,
      now: 1000,
    });

    expect(session.id).toBe('sess-1');
    expect(session.status).toBe('waiting');
    expect(session.studentName).toBe('Иван Иванов');
    expect(session.startedAt).toBe(null);
    expect(session.expiresAt).toBe(null);
    expect(session.answers).toEqual({});
    expect(session.questionOrder).toHaveLength(5);
    expect(new Set(session.questionOrder)).toEqual(new Set(questionIds));
  });

  it('generates distinct questionOrder for two students with sufficient questions', () => {
    const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

    // Deterministic mock RNGs
    let rA = 0.1;
    const mockRngA = () => {
      rA = (rA + 0.37) % 1;
      return rA;
    };

    let rB = 0.8;
    const mockRngB = () => {
      rB = (rB + 0.23) % 1;
      return rB;
    };

    const sessionA = createExamSession({
      id: 'sess-A',
      examId: 'exam-1',
      studentId: 'student-A',
      groupId: 'grp-1',
      questionIds,
      random: mockRngA,
    });

    const sessionB = createExamSession({
      id: 'sess-B',
      examId: 'exam-1',
      studentId: 'student-B',
      groupId: 'grp-1',
      questionIds,
      random: mockRngB,
    });

    expect(sessionA.questionOrder).not.toEqual(sessionB.questionOrder);
    expect(new Set(sessionA.questionOrder)).toEqual(new Set(questionIds));
    expect(new Set(sessionB.questionOrder)).toEqual(new Set(questionIds));
  });

  it('preserves identical questionOrder when restored from saved state on refresh', () => {
    const savedOrder = ['q4', 'q2', 'q5', 'q1', 'q3'];
    const session = createExamSession({
      id: 'sess-1',
      examId: 'exam-1',
      studentId: 'student-1',
      groupId: 'grp-1',
      questionOrder: savedOrder,
    });

    expect(session.questionOrder).toEqual(savedOrder);
  });

  it('handles small question sets correctly (1, 2, 5+ questions)', () => {
    // 1 question: remains identical
    const single = generateQuestionOrder(['q1']);
    expect(single).toEqual(['q1']);

    // 0 questions: empty
    expect(generateQuestionOrder([])).toEqual([]);

    // 2 questions: valid permutation
    const pair = generateQuestionOrder(['q1', 'q2']);
    expect(pair).toHaveLength(2);
    expect(new Set(pair)).toEqual(new Set(['q1', 'q2']));

    // 5+ questions: all IDs preserved
    const pool = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const shuffled = generateQuestionOrder(pool);
    expect(shuffled).toHaveLength(5);
    expect(new Set(shuffled)).toEqual(new Set(pool));
  });

  it('stores and evaluates answers by questionId, invariant to question display order', () => {
    const questions = [
      { id: 'q1', topic: 'python', correctAnswers: [0] },
      { id: 'q2', topic: 'sql', correctAnswers: [1] },
      { id: 'q3', topic: 'networks', correctAnswers: [2] },
    ];

    const session = startExamSession(
      createExamSession({
        id: 'sess-1',
        examId: 'exam-1',
        studentId: 'student-1',
        groupId: 'grp-1',
        questionOrder: ['q3', 'q1', 'q2'], // Permuted order
        now: 1000,
      }),
      { now: 1000 }
    );

    // Answer by questionId
    let updated = updateExamSessionAnswer(session, 'q1', [0]);
    updated = updateExamSessionAnswer(updated, 'q2', [1]);
    updated = updateExamSessionAnswer(updated, 'q3', [2]);

    const submitted = submitExamSession(updated, questions, { now: 2000 });
    expect(submitted.status).toBe('submitted');
    expect(submitted.totalScore).toBe(3);
    expect(submitted.percentage).toBe(100);
    expect(submitted.correctAnswersCount).toBe(3);
  });

  it('starts a waiting session and computes expiresAt', () => {
    const session = createExamSession({
      id: 'sess-1',
      examId: 'exam-1',
      studentId: 'student-1',
      groupId: 'grp-1',
      durationSeconds: 1800,
      now: 1000,
    });

    const started = startExamSession(session, { now: 2000 });
    expect(started.status).toBe('in_progress');
    expect(started.startedAt).toBe(2000);
    expect(started.expiresAt).toBe(2000 + 1800 * 1000);
  });

  it('updates answers while in progress and ignores when submitted', () => {
    const session = startExamSession(
      createExamSession({
        id: 'sess-1',
        examId: 'exam-1',
        studentId: 'student-1',
        groupId: 'grp-1',
        now: 1000,
      }),
      { now: 1000 }
    );

    const updated = updateExamSessionAnswer(session, 'q1', [2, 0]);
    expect(updated.answers.q1).toEqual([0, 2]); // sorted

    const submitted = submitExamSession(updated, [], { now: 2000 });
    const attemptUpdate = updateExamSessionAnswer(submitted, 'q1', [1]);
    expect(attemptUpdate.answers.q1).toEqual([0, 2]); // unchanged
  });

  it('calculates remaining seconds and expiration', () => {
    const session = {
      expiresAt: 5000,
    };
    expect(getExamSessionRemainingSeconds(session, 2000)).toBe(3);
    expect(getExamSessionRemainingSeconds(session, 5000)).toBe(0);
    expect(getExamSessionRemainingSeconds(session, 6000)).toBe(0);

    expect(isExamSessionExpired(session, 4999)).toBe(false);
    expect(isExamSessionExpired(session, 5000)).toBe(true);
    expect(isExamSessionExpired(session, 7000)).toBe(true);
  });

  it('initializes secure exam fields correctly with defaults', () => {
    const session = createExamSession({
      id: 'sess-sec-1',
      examId: 'exam-1',
      studentId: 'student-1',
      groupId: 'grp-1',
    });

    expect(session.attemptNumber).toBe(1);
    expect(session.violationCount).toBe(0);
    expect(session.maxViolations).toBe(3);
    expect(session.disqualifiedAt).toBe(null);
    expect(session.disqualificationReason).toBe(null);
  });

  it('supports custom attemptNumber, violationCount, and disqualified state', () => {
    const session = createExamSession({
      id: 'sess-sec-2',
      examId: 'exam-1',
      studentId: 'student-1',
      groupId: 'grp-1',
      attemptNumber: 2,
      violationCount: 3,
      maxViolations: 3,
      status: 'disqualified',
      disqualifiedAt: 1700000000000,
      disqualificationReason: 'Превышен лимит нарушений (3/3).',
    });

    expect(session.attemptNumber).toBe(2);
    expect(session.violationCount).toBe(3);
    expect(session.status).toBe('disqualified');
    expect(session.disqualifiedAt).toBe(1700000000000);
    expect(session.disqualificationReason).toBe('Превышен лимит нарушений (3/3).');
  });
});
