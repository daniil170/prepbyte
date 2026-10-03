import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudentExamSession } from './useStudentExamSession';

vi.mock('@features/auth', () => ({
  useAuth: () => ({
    user: { id: 'student_123', email: 'student@test.local', name: 'Иван Студент' },
  }),
}));

describe('useStudentExamSession hook', () => {
  const mockExam = {
    id: 'exam_1',
    title: 'ЕНТ — Информатика',
    status: 'active',
    durationMinutes: 40,
    questionIds: ['q1', 'q2', 'q3'],
  };

  const mockSession = {
    id: 'exam_1_student_123',
    examId: 'exam_1',
    studentId: 'student_123',
    status: 'in_progress',
    questionOrder: ['q1', 'q2', 'q3'],
    answers: { q1: [0] },
    flagged: ['q2'],
    startedAt: Date.now(),
    expiresAt: Date.now() + 2400 * 1000,
  };

  const mockQuestions = [
    { id: 'q1', questionText: 'Вопрос 1', options: ['A', 'B', 'C', 'D'], topic: 'Темы 1', multiple: false },
    { id: 'q2', questionText: 'Вопрос 2', options: ['X', 'Y', 'Z'], topic: 'Темы 2', multiple: true },
    { id: 'q3', questionText: 'Вопрос 3', options: ['1', '2', '3', '4'], topic: 'Темы 1', multiple: false },
  ];

  let mockExamRepo;
  let mockQuestionRepo;

  beforeEach(() => {
    vi.clearAllMocks();

    mockExamRepo = {
      subscribeToExam: vi.fn((id, onUpdate) => {
        onUpdate(mockExam);
        return () => {};
      }),
      subscribeToStudentSession: vi.fn((id, onUpdate) => {
        onUpdate(mockSession);
        return () => {};
      }),
      getOrCreateExamSession: vi.fn().mockResolvedValue(mockSession),
      saveStudentAnswer: vi.fn().mockResolvedValue({}),
      toggleQuestionFlag: vi.fn().mockResolvedValue({}),
      submitSession: vi.fn().mockResolvedValue({
        status: 'submitted',
        score: 40,
        totalScore: 40,
        maxPossibleScore: 50,
        percentage: 80,
        correctAnswersCount: 24,
      }),
    };

    mockQuestionRepo = {
      getQuestionsByIds: vi.fn().mockResolvedValue(mockQuestions),
    };
  });

  it('initializes exam session and loads questions matching session question order', async () => {
    const { result } = renderHook(() =>
      useStudentExamSession('exam_1', {
        examRepo: mockExamRepo,
        questionRepo: mockQuestionRepo,
      })
    );

    await waitFor(() => expect(result.current.questions).toEqual(mockQuestions));

    expect(result.current.exam).toEqual(mockExam);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.currentQuestion).toEqual(mockQuestions[0]);
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.flagged).toEqual(['q2']);
  });

  it('supports navigation between questions (Next, Previous, Jump)', async () => {
    const { result } = renderHook(() =>
      useStudentExamSession('exam_1', {
        examRepo: mockExamRepo,
        questionRepo: mockQuestionRepo,
      })
    );

    await waitFor(() => expect(result.current.questions.length).toBeGreaterThan(0));

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.setCurrentIndex(1);
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentQuestion).toEqual(mockQuestions[1]);

    act(() => {
      result.current.setCurrentIndex(2);
    });
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentQuestion).toEqual(mockQuestions[2]);
  });

  it('selects single choice answer and persists to repository', async () => {
    const { result } = renderHook(() =>
      useStudentExamSession('exam_1', {
        examRepo: mockExamRepo,
        questionRepo: mockQuestionRepo,
      })
    );

    await waitFor(() => expect(result.current.questions.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.selectAnswer('q1', 2, { multiple: false });
    });

    expect(mockExamRepo.saveStudentAnswer).toHaveBeenCalledWith(
      'exam_1_student_123',
      'q1',
      [2]
    );
    expect(result.current.session.answers['q1']).toEqual([2]);
  });

  it('selects multiple choice answer, toggles options, and persists sorted array', async () => {
    const { result } = renderHook(() =>
      useStudentExamSession('exam_1', {
        examRepo: mockExamRepo,
        questionRepo: mockQuestionRepo,
      })
    );

    await waitFor(() => expect(result.current.questions.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.selectAnswer('q2', 0, { multiple: true });
    });
    expect(result.current.session.answers['q2']).toEqual([0]);

    await act(async () => {
      await result.current.selectAnswer('q2', 2, { multiple: true });
    });
    expect(result.current.session.answers['q2']).toEqual([0, 2]);

    expect(mockExamRepo.saveStudentAnswer).toHaveBeenLastCalledWith(
      'exam_1_student_123',
      'q2',
      [0, 2]
    );
  });

  it('toggles question flag and updates flagged list', async () => {
    const { result } = renderHook(() =>
      useStudentExamSession('exam_1', {
        examRepo: mockExamRepo,
        questionRepo: mockQuestionRepo,
      })
    );

    await waitFor(() => expect(result.current.questions.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.toggleFlag('q1');
    });

    expect(mockExamRepo.toggleQuestionFlag).toHaveBeenCalledWith(
      'exam_1_student_123',
      'q1'
    );
    expect(result.current.flagged).toEqual(['q2', 'q1']);
  });

  it('submits exam session via repository', async () => {
    const { result } = renderHook(() =>
      useStudentExamSession('exam_1', {
        examRepo: mockExamRepo,
        questionRepo: mockQuestionRepo,
      })
    );

    await waitFor(() => expect(result.current.questions.length).toBeGreaterThan(0));

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submit();
    });

    expect(mockExamRepo.submitSession).toHaveBeenCalledWith(
      'exam_1_student_123',
      mockSession.answers,
      expect.anything()
    );
    expect(submitResult).toEqual({
      status: 'submitted',
      score: 40,
      totalScore: 40,
      maxPossibleScore: 50,
      percentage: 80,
      correctAnswersCount: 24,
    });
  });
});
