import { describe, expect, it } from 'vitest';
import {
  createExamSession,
  getExamSessionRemainingSeconds,
  isExamSessionExpired,
  startExamSession,
  submitExamSession,
  updateExamSessionAnswer,
} from './examSession';

describe('examSession domain module', () => {
  it('creates a session in waiting status with empty answers', () => {
    const session = createExamSession({
      id: 'sess-1',
      examId: 'exam-1',
      studentId: 'student-1',
      studentName: 'Иван Иванов',
      groupId: 'grp-1',
      durationSeconds: 3600,
      now: 1000,
    });

    expect(session.id).toBe('sess-1');
    expect(session.status).toBe('waiting');
    expect(session.studentName).toBe('Иван Иванов');
    expect(session.startedAt).toBe(null);
    expect(session.expiresAt).toBe(null);
    expect(session.answers).toEqual({});
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

  it('submits session and calculates scores based on questions', () => {
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

    const withAnswers = updateExamSessionAnswer(session, 'q1', [1]);
    const questions = [
      {
        id: 'q1',
        topic: 'python_basics',
        options: ['A', 'B', 'C'],
        correctAnswers: [1],
      },
    ];

    const submitted = submitExamSession(withAnswers, questions, { now: 2000 });
    expect(submitted.status).toBe('submitted');
    expect(submitted.submittedAt).toBe(2000);
    expect(submitted.totalScore).toBe(1);
    expect(submitted.maxPossibleScore).toBe(1);
    expect(submitted.percentage).toBe(100);
    expect(submitted.correctAnswersCount).toBe(1);
  });
});
