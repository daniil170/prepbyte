import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useExamBuilder } from './useExamBuilder';

vi.mock('@features/auth', () => ({
  useAuth: () => ({
    user: { id: 'teacherA', role: 'teacher' },
  }),
}));

describe('useExamBuilder hook', () => {
  const mockGroups = [
    { id: 'groupA', name: 'Группа 10-А', studentIds: ['s1'] },
    { id: 'groupB', name: 'Группа 10-Б', studentIds: ['s2'] },
  ];

  const mockQuestions = [
    { id: 'q1', questionText: 'Вопрос 1', topic: 'math', difficulty: 'easy', multiple: false, status: 'active' },
    { id: 'q2', questionText: 'Вопрос 2', topic: 'physics', difficulty: 'medium', multiple: true, status: 'active' },
    { id: 'q3', questionText: 'Вопрос 3', topic: 'math', difficulty: 'hard', multiple: false, status: 'active' },
  ];

  const mockExam = {
    id: 'examDraft1',
    title: 'Существующий экзамен',
    teacherId: 'teacherA',
    groupId: 'groupA',
    groupName: 'Группа 10-А',
    durationMinutes: 45,
    questionIds: ['q1', 'q2'],
    status: 'draft',
  };

  const createMockRepos = () => ({
    groupRepo: {
      getTeacherGroups: vi.fn().mockResolvedValue(mockGroups),
    },
    questionRepo: {
      getTeacherQuestions: vi.fn().mockResolvedValue(mockQuestions),
    },
    examRepo: {
      getExamById: vi.fn().mockResolvedValue(mockExam),
      saveExamDraft: vi.fn().mockImplementation(async (draft) => ({ id: draft.id || 'examNew', ...draft })),
      deleteExam: vi.fn().mockResolvedValue(),
    },
  });

  it('initializes new exam mode with default values', async () => {
    const repos = createMockRepos();
    const { result } = renderHook(() =>
      useExamBuilder({
        examRepo: repos.examRepo,
        groupRepo: repos.groupRepo,
        questionRepo: repos.questionRepo,
      })
    );

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.groupId).toBe('groupA');
    expect(result.current.groups).toHaveLength(2);
    expect(result.current.questionIds).toEqual([]);
    expect(result.current.pickerQuestions).toHaveLength(3);
  });

  it('initializes edit mode loading existing exam', async () => {
    const repos = createMockRepos();
    const { result } = renderHook(() =>
      useExamBuilder({
        examId: 'examDraft1',
        examRepo: repos.examRepo,
        groupRepo: repos.groupRepo,
        questionRepo: repos.questionRepo,
      })
    );

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEditMode).toBe(true);
    expect(result.current.title).toBe('Существующий экзамен');
    expect(result.current.durationMinutes).toBe(45);
    expect(result.current.questionIds).toEqual(['q1', 'q2']);
    expect(result.current.selectedQuestions.map((q) => q.id)).toEqual(['q1', 'q2']);
    // Picker excludes selected questions q1 & q2
    expect(result.current.pickerQuestions.map((q) => q.id)).toEqual(['q3']);
  });

  it('handles question adding, removing, and reordering', async () => {
    const repos = createMockRepos();
    const { result } = renderHook(() =>
      useExamBuilder({
        examRepo: repos.examRepo,
        groupRepo: repos.groupRepo,
        questionRepo: repos.questionRepo,
      })
    );

    await act(async () => {});

    // Add q1 and q2
    act(() => {
      result.current.addQuestion(mockQuestions[0]);
      result.current.addQuestion(mockQuestions[1]);
    });
    expect(result.current.questionIds).toEqual(['q1', 'q2']);

    // Move q2 up
    act(() => {
      result.current.moveQuestionUp(1);
    });
    expect(result.current.questionIds).toEqual(['q2', 'q1']);

    // Move q2 down
    act(() => {
      result.current.moveQuestionDown(0);
    });
    expect(result.current.questionIds).toEqual(['q1', 'q2']);

    // Remove q1
    act(() => {
      result.current.removeQuestion('q1');
    });
    expect(result.current.questionIds).toEqual(['q2']);
  });

  it('validates form before saving draft', async () => {
    const repos = createMockRepos();
    const { result } = renderHook(() =>
      useExamBuilder({
        examRepo: repos.examRepo,
        groupRepo: repos.groupRepo,
        questionRepo: repos.questionRepo,
      })
    );

    await act(async () => {});

    let saveRes;
    await act(async () => {
      saveRes = await result.current.saveDraft();
    });

    expect(saveRes).toBe(false);
    expect(result.current.validationErrors.title).toBeDefined();
    expect(result.current.validationErrors.questions).toBeDefined();
    expect(repos.examRepo.saveExamDraft).not.toHaveBeenCalled();

    // Fill valid data
    act(() => {
      result.current.setTitle('Новый тест 10 класс');
      result.current.addQuestion(mockQuestions[0]);
    });

    await act(async () => {
      saveRes = await result.current.saveDraft();
    });

    expect(saveRes).toBeTruthy();
    expect(repos.examRepo.saveExamDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Новый тест 10 класс',
        groupId: 'groupA',
        groupName: 'Группа 10-А',
        questionIds: ['q1'],
        teacherId: 'teacherA',
      })
    );
  });

  it('deletes draft when in edit mode', async () => {
    const repos = createMockRepos();
    const { result } = renderHook(() =>
      useExamBuilder({
        examId: 'examDraft1',
        examRepo: repos.examRepo,
        groupRepo: repos.groupRepo,
        questionRepo: repos.questionRepo,
      })
    );

    await act(async () => {});

    let deleteRes;
    await act(async () => {
      deleteRes = await result.current.deleteDraft();
    });

    expect(deleteRes).toBe(true);
    expect(repos.examRepo.deleteExam).toHaveBeenCalledWith('examDraft1');
  });
});
