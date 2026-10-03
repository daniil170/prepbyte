import { describe, it, expect, vi } from 'vitest';
import { submitExamSessionService } from './submitExamSessionService';

function createMockDb({
  sessions = {},
  exams = {},
  answers = {},
  questions = {},
  onUpdate = vi.fn(),
} = {}) {
  const sessionDb = { ...sessions };
  const examDb = { ...exams };
  const answersDb = { ...answers };
  const questionsDb = { ...questions };

  return {
    _sessionDb: sessionDb,
    _examDb: examDb,
    _answersDb: answersDb,
    _questionsDb: questionsDb,
    _onUpdate: onUpdate,
  };
}

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, col, id) => ({ _col: col, _id: id, _db: db })),
  collection: vi.fn((db, col) => ({ _col: col, _db: db })),
  query: vi.fn((ref) => ref),
  where: vi.fn(),
  documentId: vi.fn(),
  serverTimestamp: vi.fn(() => 1000000),
  getDoc: vi.fn(async (docRef) => {
    const db = docRef._db;
    const col = docRef._col;
    const id = docRef._id;
    if (col === 'exam_sessions') {
      const data = db._sessionDb[id];
      return { id, exists: () => Boolean(data), data: () => data };
    }
    if (col === 'exams') {
      const data = db._examDb[id];
      return { id, exists: () => Boolean(data), data: () => data };
    }
    return { id, exists: () => false, data: () => null };
  }),
  getDocs: vi.fn(async (colRef) => {
    const db = colRef._db;
    const col = colRef._col;
    if (col === 'question_answers') {
      const docs = Object.entries(db._answersDb || {}).map(([id, data]) => ({
        id,
        data: () => data,
      }));
      return { docs };
    }
    if (col === 'questions') {
      const docs = Object.entries(db._questionsDb || {}).map(([id, data]) => ({
        id,
        data: () => data,
      }));
      return { docs };
    }
    return { docs: [] };
  }),
  updateDoc: vi.fn(async (docRef, patch) => {
    docRef._db._sessionDb[docRef._id] = {
      ...docRef._db._sessionDb[docRef._id],
      ...patch,
    };
    docRef._db._onUpdate(docRef._id, patch);
  }),
}));

describe('Secure Exam Backend Integration & End-to-End Tests', () => {
  const sampleExam = {
    title: 'ЕНТ Информатика 2026',
    teacherId: 'teacher1',
    groupId: 'group10a',
    questionIds: ['q1', 'q2', 'q3'],
    durationMinutes: 60,
    durationSeconds: 3600,
    status: 'active',
  };

  const sampleQuestionAnswers = {
    q1: { correctAnswers: [0], explanation: 'Single choice answer' },
    q2: { correctAnswers: [1, 2], explanation: 'Multi choice answer' },
    q3: { correctAnswers: [3], explanation: 'Single choice answer' },
  };

  const sampleQuestions = {
    q1: { topic: 'python', questionText: 'Q1?', options: ['A', 'B', 'C', 'D'] },
    q2: { topic: 'sql', questionText: 'Q2?', options: ['A', 'B', 'C', 'D'] },
    q3: { topic: 'networks', questionText: 'Q3?', options: ['A', 'B', 'C', 'D'] },
  };

  it('1. End-to-End Student Exam Submission Flow: Scores authoritatively from protected answers', async () => {
    const db = createMockDb({
      exams: { exam1: sampleExam },
      sessions: {
        exam1_student1: {
          examId: 'exam1',
          studentId: 'student1',
          groupId: 'group10a',
          questionOrder: ['q1', 'q2', 'q3'],
          status: 'in_progress',
          answers: {},
        },
      },
      answers: sampleQuestionAnswers,
      questions: sampleQuestions,
    });

    const studentAuth = { uid: 'student1' };
    const studentAnswers = {
      q1: [0], // correct (1/1 pt)
      q2: [1, 2], // fully correct (2/2 pts)
      q3: [0], // wrong (0/1 pt)
    };

    const result = await submitExamSessionService(
      db,
      studentAuth,
      { sessionId: 'exam1_student1', answers: studentAnswers }
    );

    expect(result.totalScore).toBe(3);
    expect(result.maxPossibleScore).toBe(4); // 1 + 2 + 1 = 4
    expect(result.percentage).toBe(75);
    expect(result.passed).toBe(true);
    expect(result.correctAnswersCount).toBe(2);

    const saved = db._sessionDb['exam1_student1'];
    expect(saved.status).toBe('submitted');
    expect(saved.score).toBe(3);
    expect(saved.percentage).toBe(75);

    // Verify protected correct answers are NOT in the return payload
    expect(result).not.toHaveProperty('correctAnswers');
    expect(result).not.toHaveProperty('explanation');
  });

  it('2. Authorization: Student A CANNOT submit Student B session', async () => {
    const db = createMockDb({
      exams: { exam1: sampleExam },
      sessions: {
        exam1_studentB: {
          examId: 'exam1',
          studentId: 'studentB',
          status: 'in_progress',
        },
      },
    });

    const studentAAuth = { uid: 'studentA' };

    await expect(
      submitExamSessionService(
        db,
        studentAAuth,
        { sessionId: 'exam1_studentB', answers: { q1: [0] } }
      )
    ).rejects.toThrow('Вы не являетесь владельцем этой экзаменационной сессии.');
  });

  it('3. Input Tampering: Ignores client-supplied fake scores and invalid question IDs', async () => {
    const db = createMockDb({
      exams: { exam1: sampleExam },
      sessions: {
        exam1_student1: {
          examId: 'exam1',
          studentId: 'student1',
          status: 'in_progress',
        },
      },
      answers: sampleQuestionAnswers,
      questions: sampleQuestions,
    });

    const studentAuth = { uid: 'student1' };
    const forgedPayload = {
      sessionId: 'exam1_student1',
      answers: {
        q1: [0],
        q_fake: [0, 1, 2], // Unknown question ID
      },
      score: 100,
      percentage: 100,
      passed: true,
      totalScore: 999,
    };

    const result = await submitExamSessionService(
      db,
      studentAuth,
      forgedPayload
    );

    // Only q1 [0] is evaluated (1 pt out of 4) -> 25%
    expect(result.totalScore).toBe(1);
    expect(result.maxPossibleScore).toBe(4);
    expect(result.percentage).toBe(25);
    expect(result.passed).toBe(false);
  });

  it('4. Concurrent / Idempotent Submissions: Returning existing result without recalculation', async () => {
    const db = createMockDb({
      exams: { exam1: sampleExam },
      sessions: {
        exam1_student1: {
          examId: 'exam1',
          studentId: 'student1',
          status: 'submitted',
          score: 4,
          totalScore: 4,
          maxPossibleScore: 4,
          percentage: 100,
          correctAnswersCount: 3,
          passed: true,
        },
      },
      answers: sampleQuestionAnswers,
      questions: sampleQuestions,
    });

    const studentAuth = { uid: 'student1' };
    const result = await submitExamSessionService(
      db,
      studentAuth,
      { sessionId: 'exam1_student1', answers: { q1: [3] } }
    );

    expect(result.alreadySubmitted).toBe(true);
    expect(result.totalScore).toBe(4);
    expect(result.percentage).toBe(100);
  });
});
