import { describe, expect, it, vi } from 'vitest';
import { evaluateAnswers, sanitizeStudentAnswers } from '../../../../functions/index';
import { createQuestionRepository } from '../../question-bank/data/questionRepository';
import { submitExamSessionService } from '../../teacher/data/submitExamSessionService';

vi.mock(import('firebase/firestore'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    collection: vi.fn((db, col) => ({ _col: col, _db: db })),
    doc: vi.fn((db, col, id) => ({ _col: col, _id: id, _db: db })),
    documentId: vi.fn(() => '__name__'),
    query: vi.fn((colRef) => colRef),
    where: vi.fn(),
    serverTimestamp: vi.fn(() => 1700000000000),
    getDoc: vi.fn(async (docRef) => {
      const db = docRef._db;
      if (docRef._col === 'test_sessions' || docRef._col === 'exam_sessions') {
        const exists = Boolean(db._sessionData);
        return {
          id: docRef._id,
          exists: () => exists,
          data: () => db._sessionData,
        };
      }
      return { exists: () => false, data: () => null };
    }),
    getDocs: vi.fn(async (colRef) => {
      const db = colRef._db;
      if (colRef._col === 'question_answers') {
        const docs = Object.entries(db._answersMap || {}).map(([id, data]) => ({
          id,
          data: () => data,
        }));
        return { docs };
      }
      if (colRef._col === 'questions') {
        const docs = Object.entries(db._questionsMap || {}).map(([id, data]) => ({
          id,
          data: () => data,
        }));
        return { docs };
      }
      return { docs: [] };
    }),
    updateDoc: vi.fn(async (docRef, patch) => {
      if (docRef._db?._onUpdate) {
        docRef._db._onUpdate(docRef._id, patch);
      }
    }),
  };
});

describe('Server-Side Grading Verification (P0 Bug Fix)', () => {
  // Non-admin student account
  const studentUser = {
    uid: 'student_non_admin_001',
    email: 'student1@test.local',
    role: 'student',
  };

  // Generate 40 canonical questions: 30 single-choice (Part 1) + 10 multi-choice (Part 2)
  const canonical40Questions = [];
  const protectedAnswersMap = {};
  const publicQuestionsMap = {};

  for (let i = 1; i <= 30; i++) {
    const qid = `q_${i}`;
    canonical40Questions.push({
      id: qid,
      number: i,
      topic: 'part1_topic',
      questionText: `Part 1 Question ${i}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      multiple: false,
      difficulty: 'medium',
      version: 1,
    });
    // Correct answer is always option 0 for single-choice in this fixture
    protectedAnswersMap[qid] = {
      correctAnswers: [0],
      explanation: `Explanation for Q${i}`,
    };
    publicQuestionsMap[qid] = {
      topic: 'part1_topic',
      questionText: `Part 1 Question ${i}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      multiple: false,
      difficulty: 'medium',
    };
  }

  for (let i = 31; i <= 40; i++) {
    const qid = `q_${i}`;
    canonical40Questions.push({
      id: qid,
      number: i,
      topic: 'part2_topic',
      questionText: `Part 2 Question ${i}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
      multiple: true,
      difficulty: 'hard',
      version: 1,
    });
    // Correct answers are options 0 and 2 for multi-choice in this fixture
    protectedAnswersMap[qid] = {
      correctAnswers: [0, 2],
      explanation: `Explanation for Q${i}`,
    };
    publicQuestionsMap[qid] = {
      topic: 'part2_topic',
      questionText: `Part 2 Question ${i}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
      multiple: true,
      difficulty: 'hard',
    };
  }

  // Build student answers:
  // Part 1 (Q1-30, 1 pt each):
  // - Q1..25: student selects [0] (CORRECT -> 25 * 1 = 25 pts)
  // - Q26..30: student selects [1] (WRONG -> 5 * 0 = 0 pts)
  // Part 1 expected: 25 / 30 pts.
  //
  // Part 2 (Q31-40, 2 pts each):
  // - Q31..35 (5 questions): student selects [0, 2] (FULL CREDIT: 0 errors -> 5 * 2 = 10 pts)
  // - Q36..38 (3 questions): student selects [0] (PARTIAL CREDIT: 1 omission -> 3 * 1 = 3 pts)
  // - Q39..40 (2 questions): student selects [1, 3] (ZERO CREDIT: 2 errors -> 2 * 0 = 0 pts)
  // Part 2 expected: 10 + 3 + 0 = 13 / 20 pts.
  //
  // Total expected score: 25 + 13 = 38 / 50 pts (76%).
  const studentAnswers = {};
  for (let i = 1; i <= 25; i++) {
    studentAnswers[`q_${i}`] = [0];
  }
  for (let i = 26; i <= 30; i++) {
    studentAnswers[`q_${i}`] = [1];
  }
  for (let i = 31; i <= 35; i++) {
    studentAnswers[`q_${i}`] = [0, 2];
  }
  for (let i = 36; i <= 38; i++) {
    studentAnswers[`q_${i}`] = [0];
  }
  for (let i = 39; i <= 40; i++) {
    studentAnswers[`q_${i}`] = [1, 3];
  }

  it('1. Verifies getQuestionsByIds never returns correctAnswers to students on client', async () => {
    // Mock Firestore for questions collection
    const mockFirestore = {
      _publicQuestions: publicQuestionsMap,
    };

    // Instantiate repository with default includeAnswers = false
    const repo = createQuestionRepository(mockFirestore);

    // Call getQuestionsByIds for all 40 questions WITHOUT options (default client call)
    const clientLoaded = await repo.getQuestionsByIds(
      canonical40Questions.map((q) => q.id)
    );

    expect(clientLoaded).toHaveLength(40);
    for (const q of clientLoaded) {
      expect(q.correctAnswers).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    }
  });

  it('2. Pure server-side scoring authoritatively evaluates 40 questions (38/50 points)', () => {
    const protectedQuestions = canonical40Questions.map((q) => ({
      id: q.id,
      number: q.number,
      topic: q.topic,
      options: q.options,
      questionText: q.questionText,
      multiple: q.multiple,
      correctAnswers: protectedAnswersMap[q.id].correctAnswers,
    }));

    const result = evaluateAnswers(studentAnswers, protectedQuestions);

    expect(result.totalScore).toBe(38);
    expect(result.part1Score).toBe(25);
    expect(result.part2Score).toBe(13);
    expect(result.maxPossibleScore).toBe(50);
    expect(result.percentage).toBe(76);
    expect(result.passed).toBe(true);
    expect(result.questionResults).toHaveLength(40);

    // Verify questionResults contains pointsAwarded, isCorrect, isPartiallyCorrect but NOT correctAnswers
    for (let i = 0; i < 25; i++) {
      const qr = result.questionResults[i];
      expect(qr.pointsAwarded).toBe(1);
      expect(qr.isCorrect).toBe(true);
      expect(qr.isPartiallyCorrect).toBe(false);
      expect(qr.correctAnswers).toBeUndefined();
    }

    for (let i = 25; i < 30; i++) {
      const qr = result.questionResults[i];
      expect(qr.pointsAwarded).toBe(0);
      expect(qr.isCorrect).toBe(false);
      expect(qr.isPartiallyCorrect).toBe(false);
      expect(qr.correctAnswers).toBeUndefined();
    }

    // Part 2 full credit
    for (let i = 30; i < 35; i++) {
      const qr = result.questionResults[i];
      expect(qr.pointsAwarded).toBe(2);
      expect(qr.isCorrect).toBe(true);
      expect(qr.isPartiallyCorrect).toBe(false);
      expect(qr.correctAnswers).toBeUndefined();
    }

    // Part 2 partial credit
    for (let i = 35; i < 38; i++) {
      const qr = result.questionResults[i];
      expect(qr.pointsAwarded).toBe(1);
      expect(qr.isCorrect).toBe(false);
      expect(qr.isPartiallyCorrect).toBe(true);
      expect(qr.correctAnswers).toBeUndefined();
    }

    // Part 2 zero credit
    for (let i = 38; i < 40; i++) {
      const qr = result.questionResults[i];
      expect(qr.pointsAwarded).toBe(0);
      expect(qr.isCorrect).toBe(false);
      expect(qr.isPartiallyCorrect).toBe(false);
      expect(qr.correctAnswers).toBeUndefined();
    }
  });

  it('3. submitExamSessionService evaluates test_session for non-admin student and writes correct points to Firestore', async () => {
    let savedPatch = null;
    const testSessionDoc = {
      id: 'test_session_student_40q',
      userId: studentUser.uid,
      status: 'in_progress',
      questionIds: canonical40Questions.map((q) => q.id),
      answers: studentAnswers,
      startedAt: 1700000000000,
    };

    const mockDb = {
      _sessionData: testSessionDoc,
      _answersMap: protectedAnswersMap,
      _questionsMap: publicQuestionsMap,
      _onUpdate: (_id, patch) => {
        savedPatch = patch;
      },
    };

    const response = await submitExamSessionService(
      mockDb,
      studentUser,
      {
        sessionId: 'test_session_student_40q',
        answers: studentAnswers,
      }
    );

    // Verify response
    expect(response.status).toBe('completed');
    expect(response.totalScore).toBe(38);
    expect(response.part1Score).toBe(25);
    expect(response.part2Score).toBe(13);
    expect(response.maxPossibleScore).toBe(50);
    expect(response.percentage).toBe(76);
    expect(response.passed).toBe(true);
    expect(response.questionResults).toHaveLength(40);

    // Verify patch written to Firestore test_sessions
    expect(savedPatch).not.toBeNull();
    expect(savedPatch.status).toBe('completed');
    expect(savedPatch.totalScore).toBe(38);
    expect(savedPatch.part1Score).toBe(25);
    expect(savedPatch.part2Score).toBe(13);
    expect(savedPatch.score).toEqual({
      totalScore: 38,
      part1Score: 25,
      part2Score: 13,
      maxPossibleScore: 50,
      percentage: 76,
      passed: true,
      byTopicBreakdown: expect.any(Object),
    });
    expect(savedPatch.questionResults).toHaveLength(40);
  });
});
