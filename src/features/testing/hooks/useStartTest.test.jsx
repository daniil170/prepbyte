import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth';
import { TestingProvider } from './TestingProvider';
import { useStartTest } from './useStartTest';

describe('useStartTest', () => {
  const mockQuestions = Array.from({ length: 45 }, (_, i) => ({
    id: `q-${i}`,
    topic: `topic_${i % 5}`,
  }));

  function createWrapper({ user = { uid: 'u1' }, sessionRepo, questionRepo }) {
    const mockAuthRepo = {
      subscribeToAuthState: (cb) => {
        cb(user);
        return () => {};
      },
    };

    return function Wrapper({ children }) {
      return (
        <AuthProvider repository={mockAuthRepo}>
          <TestingProvider
            sessionRepository={sessionRepo}
            questionRepository={questionRepo}
            now={() => 1700000000000}
          >
            {children}
          </TestingProvider>
        </AuthProvider>
      );
    };
  }

  it('successfully starts a new test and returns session id', async () => {
    let savedSession = null;
    const sessionRepo = {
      startSession: vi.fn().mockImplementation((s) => {
        savedSession = s;
        return Promise.resolve(s);
      }),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };

    const wrapper = createWrapper({ sessionRepo, questionRepo });
    const { result } = renderHook(() => useStartTest(), { wrapper });

    let newSessionId;
    await act(async () => {
      newSessionId = await result.current.startTest();
    });

    expect(newSessionId).toBeDefined();
    expect(sessionRepo.startSession).toHaveBeenCalledTimes(1);
    expect(savedSession.questionIds).toHaveLength(40);
    expect(savedSession.userId).toBe('u1');
    expect(savedSession.status).toBe('in_progress');
  });

  it('throws an error if user is unauthenticated', async () => {
    const sessionRepo = { startSession: vi.fn() };
    const questionRepo = { getAllQuestions: vi.fn() };

    const wrapper = createWrapper({
      user: null,
      sessionRepo,
      questionRepo,
    });
    const { result } = renderHook(() => useStartTest(), { wrapper });

    await act(async () => {
      await expect(result.current.startTest()).rejects.toThrow(
        'Для прохождения теста необходимо авторизоваться.'
      );
    });
  });
});
