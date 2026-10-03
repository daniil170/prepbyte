import {
  submitExamSessionService,
  submitExamSessionClient,
  SubmitExamSessionError,
} from './submitExamSessionService';

function createMockFirestore({
  sessionData = null,
  examData = null,
  answersMap = {},
  questionsMap = {},
  onUpdate = vi.fn(),
} = {}) {
  return {
    _sessionData: sessionData,
    _examData: examData,
    _answersMap: answersMap,
    _questionsMap: questionsMap,
    _onUpdate: onUpdate,
  };
}

// Mock Firebase Firestore modular SDK functions for unit testing
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, col, id) => ({ _col: col, _id: id, _db: db })),
  collection: vi.fn((db, col) => ({ _col: col, _db: db })),
  query: vi.fn((colRef) => colRef),
  where: vi.fn(),
  documentId: vi.fn(),
  serverTimestamp: vi.fn(() => 1234567890),
  getDoc: vi.fn(async (docRef) => {
    const db = docRef._db;
    if (docRef._col === 'exam_sessions') {
      const exists = Boolean(db._sessionData);
      return {
        id: docRef._id,
        exists: () => exists,
        data: () => db._sessionData,
      };
    }
    if (docRef._col === 'exams') {
      const exists = Boolean(db._examData);
      return {
        id: docRef._id,
        exists: () => exists,
        data: () => db._examData,
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
    docRef._db._onUpdate(docRef._id, patch);
  }),
}));

describe('submitExamSessionService Unit Tests', () => {
  const sampleExam = {
    title: 'ЕНТ Информатика',
    groupId: 'group1',
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
  };

  const sampleAnswersMap = {
    q1: { correctAnswers: [0], explanation: 'Exp 1' }, // single-choice: 1 point
    q2: { correctAnswers: [1], explanation: 'Exp 2' }, // single-choice: 1 point
    q3: { correctAnswers: [0, 2], explanation: 'Exp 3' }, // multi-choice: 2 points
    q4: { correctAnswers: [1, 3], explanation: 'Exp 4' }, // multi-choice: 2 points
    q5: { correctAnswers: [0, 1, 2], explanation: 'Exp 5' }, // multi-choice: 2 points
  };

  const sampleQuestionsMap = {
    q1: { topic: 'python' },
    q2: { topic: 'python' },
    q3: { topic: 'sql' },
    q4: { topic: 'sql' },
    q5: { topic: 'networks' },
  };

  it('1. Throws UNAUTHENTICATED if auth context is missing', async () => {
    const db = createMockFirestore({});
    await expect(
      submitExamSessionService(db, null, { sessionId: 'exam1_student1' })
    ).rejects.toThrow(SubmitExamSessionError);

    await expect(
      submitExamSessionService(db, {}, { sessionId: 'exam1_student1' })
    ).rejects.toThrow('Для отправки экзамена требуется аутентификация.');
  });

  it('2. Throws NOT_FOUND if exam session does not exist', async () => {
    const db = createMockFirestore({ sessionData: null });
    await expect(
      submitExamSessionService(db, { uid: 'student1' }, { sessionId: 'missing_session' })
    ).rejects.toThrow('Сессия экзамена [id=missing_session] не найдена.');
  });

  it('3. Throws PERMISSION_DENIED if student attempts to submit another student session', async () => {
    const db = createMockFirestore({
      sessionData: {
        studentId: 'studentB',
        examId: 'exam1',
        status: 'in_progress',
      },
    });

    await expect(
      submitExamSessionService(db, { uid: 'studentA' }, { sessionId: 'exam1_studentB' })
    ).rejects.toThrow('Вы не являетесь владельцем этой экзаменационной сессии.');
  });

  it('4. Successfully and deterministically scores 5 questions with mixed single/multi choice', async () => {
    const onUpdate = vi.fn();
    const db = createMockFirestore({
      sessionData: {
        studentId: 'student1',
        examId: 'exam1',
        groupId: 'group1',
        status: 'in_progress',
        answers: {},
      },
      examData: sampleExam,
      answersMap: sampleAnswersMap,
      questionsMap: sampleQuestionsMap,
      onUpdate,
    });

    // Student answers:
    // Q1: [0] -> correct (1/1 pt)
    // Q2: [3] -> incorrect (0/1 pt)
    // Q3: [0, 2] -> fully correct (2/2 pts)
    // Q4: [1] -> 1 error/omission (1/2 pts)
    // Q5: [3] -> >=2 errors (0/2 pts)
    const answers = {
      q1: [0],
      q2: [3],
      q3: [0, 2],
      q4: [1],
      q5: [3],
    };

    const result = await submitExamSessionService(
      db,
      { uid: 'student1' },
      { sessionId: 'exam1_student1', answers }
    );

    // Total score: 1 + 0 + 2 + 1 + 0 = 4 out of (1+1+2+2+2) = 8
    expect(result.totalScore).toBe(4);
    expect(result.maxPossibleScore).toBe(8);
    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(true);
    expect(result.correctAnswersCount).toBe(2); // Q1 and Q3 are fully correct

    // Verify Firestore patch
    expect(onUpdate).toHaveBeenCalledWith(
      'exam1_student1',
      expect.objectContaining({
        status: 'submitted',
        score: 4,
        totalScore: 4,
        maxPossibleScore: 8,
        percentage: 50,
        correctAnswersCount: 2,
        passed: true,
      })
    );

    // Verify correctAnswers are NOT leaked in response
    expect(result).not.toHaveProperty('correctAnswers');
    expect(result).not.toHaveProperty('explanation');
  });

  it('5. Ignores client-forged scores and calculates strictly from protected answer bank', async () => {
    const onUpdate = vi.fn();
    const db = createMockFirestore({
      sessionData: {
        studentId: 'student1',
        examId: 'exam1',
        status: 'in_progress',
      },
      examData: sampleExam,
      answersMap: sampleAnswersMap,
      questionsMap: sampleQuestionsMap,
      onUpdate,
    });

    const forgedPayload = {
      sessionId: 'exam1_student1',
      answers: { q1: [0] }, // Only Q1 is answered correctly: 1 point
      score: 100,
      totalScore: 100,
      percentage: 100,
      correctAnswersCount: 5,
    };

    const result = await submitExamSessionService(
      db,
      { uid: 'student1' },
      forgedPayload
    );

    // Server-authoritative calculation overrides client-forged score
    expect(result.totalScore).toBe(1);
    expect(result.percentage).toBe(13); // 1/8 * 100 = 13%
    expect(result.correctAnswersCount).toBe(1);
  });

  it('6. Idempotent: submitting an already submitted session returns existing score without modification', async () => {
    const onUpdate = vi.fn();
    const db = createMockFirestore({
      sessionData: {
        studentId: 'student1',
        examId: 'exam1',
        status: 'submitted',
        score: 6,
        totalScore: 6,
        maxPossibleScore: 8,
        percentage: 75,
        correctAnswersCount: 4,
        passed: true,
      },
      examData: sampleExam,
      answersMap: sampleAnswersMap,
      questionsMap: sampleQuestionsMap,
      onUpdate,
    });

    const result = await submitExamSessionService(
      db,
      { uid: 'student1' },
      { sessionId: 'exam1_student1', answers: { q1: [3] } }
    );

    expect(result.alreadySubmitted).toBe(true);
    expect(result.totalScore).toBe(6);
    expect(result.percentage).toBe(75);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('7. Handles edge cases: unanswered questions, unknown IDs, duplicate option indices, malformed inputs', async () => {
    const onUpdate = vi.fn();
    const db = createMockFirestore({
      sessionData: {
        studentId: 'student1',
        examId: 'exam1',
        status: 'in_progress',
      },
      examData: sampleExam,
      answersMap: sampleAnswersMap,
      questionsMap: sampleQuestionsMap,
      onUpdate,
    });

    const malformedPayload = {
      sessionId: 'exam1_student1',
      answers: {
        q1: [0, 0, 0], // Duplicates in answer
        q_unknown: [0, 1], // Unknown question ID
        q2: 999, // Invalid format (number instead of array)
        q3: null, // Null instead of array
        // q4 and q5 are omitted (unanswered)
      },
    };

    const result = await submitExamSessionService(
      db,
      { uid: 'student1' },
      malformedPayload
    );

    // Q1 with duplicate [0, 0, 0] evaluates to set {0}, which matches correct [0] -> 1 pt
    // All other questions -> 0 pts
    expect(result.totalScore).toBe(1);
    expect(result.maxPossibleScore).toBe(8);
    expect(result.correctAnswersCount).toBe(1);
  });
});

describe('submitExamSessionClient Transport Unit Tests', () => {
  it('1. Validates sessionId is present and non-empty', async () => {
    await expect(submitExamSessionClient({})).rejects.toThrow(SubmitExamSessionError);
    await expect(submitExamSessionClient({ sessionId: '   ' })).rejects.toThrow(
      'Идентификатор сессии (sessionId) обязателен.'
    );
  });

  it('2. Invokes httpsCallable and returns data payload', async () => {
    const mockCallable = vi.fn().mockResolvedValue({
      data: {
        sessionId: 'exam1_student1',
        status: 'submitted',
        totalScore: 5,
        percentage: 63,
      },
    });
    const callableFactory = vi.fn(() => mockCallable);
    const mockFunctions = {};

    const result = await submitExamSessionClient(
      { sessionId: 'exam1_student1', answers: { q1: [0] } },
      mockFunctions,
      { callableFactory }
    );

    expect(callableFactory).toHaveBeenCalledWith(
      mockFunctions,
      'submitExamSession'
    );
    expect(mockCallable).toHaveBeenCalledWith({
      sessionId: 'exam1_student1',
      answers: { q1: [0] },
    });
    expect(result.totalScore).toBe(5);
    expect(result.percentage).toBe(63);
  });

  it('3. Wraps callable errors in SubmitExamSessionError', async () => {
    const mockCallable = vi.fn().mockRejectedValue({
      code: 'functions/permission-denied',
      message: 'Вы не являетесь владельцем этой экзаменационной сессии.',
    });
    const callableFactory = vi.fn(() => mockCallable);
    const mockFunctions = {};

    await expect(
      submitExamSessionClient(
        { sessionId: 'exam1_student1' },
        mockFunctions,
        { callableFactory }
      )
    ).rejects.toThrow(SubmitExamSessionError);
  });
});

