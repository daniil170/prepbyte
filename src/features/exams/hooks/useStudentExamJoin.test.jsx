import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStudentExamJoin } from './useStudentExamJoin';
import * as authModule from '@features/auth';

describe('useStudentExamJoin hook', () => {
  it('validates PIN and creates session for enrolled student', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 's1', email: 'student@pifagorschool.kz', groupId: 'g1' },
    });

    const mockExam = {
      id: 'exam-1',
      pin: '123456',
      status: 'waiting',
      groupId: 'g1',
      durationSeconds: 3600,
    };

    const mockExamRepo = {
      findExamByPin: vi.fn().mockResolvedValue(mockExam),
      getOrCreateExamSession: vi.fn().mockResolvedValue({
        id: 'exam-1_s1',
        examId: 'exam-1',
        studentId: 's1',
        status: 'waiting',
      }),
    };

    const mockGroupRepo = {
      getGroupById: vi.fn().mockResolvedValue({ id: 'g1', studentIds: ['s1'] }),
    };

    const { result } = renderHook(() =>
      useStudentExamJoin({
        examRepo: mockExamRepo,
        groupRepo: mockGroupRepo,
      })
    );

    act(() => {
      result.current.setPin('123456');
    });

    expect(result.current.pin).toBe('123456');

    let joinResult;
    await act(async () => {
      joinResult = await result.current.joinExam();
    });

    expect(joinResult).not.toBeNull();
    expect(joinResult.exam.id).toBe('exam-1');
    expect(joinResult.session.id).toBe('exam-1_s1');
  });

  it('rejects invalid PIN format', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 's1', email: 'student@pifagorschool.kz' },
    });

    const { result } = renderHook(() => useStudentExamJoin());

    let joinResult;
    await act(async () => {
      joinResult = await result.current.joinExam('123');
    });

    expect(joinResult).toBeNull();
    expect(result.current.error).toContain('Введите корректный 6-значный PIN-код');
  });
});
