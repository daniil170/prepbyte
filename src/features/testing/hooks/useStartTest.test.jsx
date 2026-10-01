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

  function createWrapper({
    user = { uid: 'u1' },
    sessionRepo,
    questionRepo,
    exposureRepo,
  }) {
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
            exposureRepository={exposureRepo}
            now={() => 1700000000000}
          >
            {children}
          </TestingProvider>
        </AuthProvider>
      );
    };
  }

  it('successfully starts a new test and updates exposure', async () => {
    let savedSession = null;
    const sessionRepo = {
      startSession: vi.fn().mockImplementation((s) => {
        savedSession = s;
        return Promise.resolve(s);
      }),
      getActiveSession: vi.fn().mockResolvedValue(null),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({
        'q-0': { timesSeen: 1, lastSeenAt: 1690000000000 },
      }),
      saveExposure: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo, questionRepo, exposureRepo });
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

    expect(exposureRepo.getExposure).toHaveBeenCalledWith('u1');
    expect(exposureRepo.saveExposure).toHaveBeenCalledTimes(1);
    const savedExposure = exposureRepo.saveExposure.mock.calls[0][1];
    expect(savedExposure).toBeDefined();
    // Saved exposure should contain newly assigned questions with timestamp 1700000000000
    for (const qid of savedSession.questionIds) {
      expect(savedExposure[qid]).toBeDefined();
      expect(savedExposure[qid].lastSeenAt).toBe(1700000000000);
    }
  });

  it('backfills exposure from past sessions when exposure document is missing (null)', async () => {
    let savedExposure = null;
    const sessionRepo = {
      startSession: vi.fn().mockImplementation((s) => Promise.resolve(s)),
      getActiveSession: vi.fn().mockResolvedValue(null),
      getAllSessionsForExposure: vi.fn().mockResolvedValue([
        {
          id: 'past-1',
          status: 'completed',
          finishedAt: 1690000000000,
          questionIds: ['q-0', 'q-1'],
        },
      ]),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue(null),
      saveExposure: vi.fn().mockImplementation((_uid, exp) => {
        savedExposure = exp;
        return Promise.resolve();
      }),
    };

    const wrapper = createWrapper({ sessionRepo, questionRepo, exposureRepo });
    const { result } = renderHook(() => useStartTest(), { wrapper });

    await act(async () => {
      await result.current.startTest();
    });

    expect(sessionRepo.getAllSessionsForExposure).toHaveBeenCalledWith('u1');
    // saveExposure called for backfill + final update
    expect(exposureRepo.saveExposure).toHaveBeenCalled();
    expect(savedExposure).toBeDefined();
  });

  it('releases unengaged questions when an active session is abandoned', async () => {
    let savedFinalExposure = null;
    const sessionRepo = {
      startSession: vi.fn().mockImplementation((s) => Promise.resolve(s)),
      getActiveSession: vi.fn().mockResolvedValue({
        id: 'active-1',
        status: 'in_progress',
        questionIds: ['q-unengaged', 'q-engaged'],
        answers: { 'q-engaged': ['A'] },
      }),
    };
    const questionRepo = {
      // Return bank where q-unengaged is NOT in the questions list so it won't be re-picked
      getAllQuestions: vi
        .fn()
        .mockResolvedValue(mockQuestions.filter((q) => q.id !== 'q-unengaged')),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({
        'q-unengaged': { timesSeen: 1, lastSeenAt: 1690000000000 },
        'q-engaged': { timesSeen: 1, lastSeenAt: 1690000000000 },
      }),
      saveExposure: vi.fn().mockImplementation((_uid, exp) => {
        savedFinalExposure = exp;
        return Promise.resolve();
      }),
    };

    const wrapper = createWrapper({ sessionRepo, questionRepo, exposureRepo });
    const { result } = renderHook(() => useStartTest(), { wrapper });

    await act(async () => {
      await result.current.startTest();
    });

    // q-unengaged should have been released (deleted since timesSeen dropped to 0)
    expect(savedFinalExposure['q-unengaged']).toBeUndefined();
    // q-engaged was engaged, so it stays seen
    expect(savedFinalExposure['q-engaged']).toBeDefined();
  });

  it('gracefully degrades on exposure read failure and still starts test', async () => {
    const sessionRepo = {
      startSession: vi.fn().mockImplementation((s) => Promise.resolve(s)),
      getActiveSession: vi.fn().mockResolvedValue(null),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockRejectedValue(new Error('Network error')),
      saveExposure: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo, questionRepo, exposureRepo });
    const { result } = renderHook(() => useStartTest(), { wrapper });

    let sessionId;
    await act(async () => {
      sessionId = await result.current.startTest();
    });

    expect(sessionId).toBeDefined();
    expect(sessionRepo.startSession).toHaveBeenCalledTimes(1);
  });

  it('gracefully degrades on exposure write failure without failing startTest', async () => {
    const sessionRepo = {
      startSession: vi.fn().mockImplementation((s) => Promise.resolve(s)),
      getActiveSession: vi.fn().mockResolvedValue(null),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({}),
      saveExposure: vi
        .fn()
        .mockRejectedValue(new Error('Write permission denied')),
    };

    const wrapper = createWrapper({ sessionRepo, questionRepo, exposureRepo });
    const { result } = renderHook(() => useStartTest(), { wrapper });

    let sessionId;
    await act(async () => {
      sessionId = await result.current.startTest();
    });

    expect(sessionId).toBeDefined();
    expect(sessionRepo.startSession).toHaveBeenCalledTimes(1);
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
