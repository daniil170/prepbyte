import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth';
import { createSession } from '../domain/testSession';
import { TestingProvider } from './TestingProvider';
import { useTestSession } from './useTestSession';

describe('useTestSession', () => {
  let currentTime;
  let mockUser;
  let mockAuthRepo;
  let mockQuestions;

  beforeEach(() => {
    vi.useFakeTimers();
    currentTime = 1700000000000;
    mockUser = { uid: 'u1', email: 'student@prepbyte.kz' };
    mockAuthRepo = {
      subscribeToAuthState: (cb) => {
        cb(mockUser);
        return () => {};
      },
    };
    mockQuestions = [
      {
        id: 'q-1',
        topic: 'python_loops',
        questionText: 'Test question 1',
        options: ['A', 'B'],
        correctAnswers: [0],
        explanation: 'Exp',
        difficulty: 'easy',
        version: 1,
      },
      {
        id: 'q-2',
        topic: 'python_loops',
        questionText: 'Test question 2',
        options: ['X', 'Y', 'Z'],
        correctAnswers: [0, 1],
        explanation: 'Exp',
        difficulty: 'medium',
        version: 1,
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createWrapper({
    sessionRepo,
    questionRepo = {
      getQuestionsByIds: vi.fn().mockResolvedValue(mockQuestions),
    },
  }) {
    return function Wrapper({ children }) {
      return (
        <AuthProvider repository={mockAuthRepo}>
          <TestingProvider
            sessionRepository={sessionRepo}
            questionRepository={questionRepo}
            now={() => currentTime}
          >
            {children}
          </TestingProvider>
        </AuthProvider>
      );
    };
  }

  it('debounces autosave by 800ms when answering a question', async () => {
    const session = createSession({
      id: 'sess-1',
      userId: 'u1',
      questionIds: ['q-1', 'q-2'],
      durationLimitSec: 3600,
      now: currentTime,
    });

    const sessionRepo = {
      getSessionById: vi.fn().mockResolvedValue(session),
      saveProgress: vi.fn().mockResolvedValue(undefined),
      finishSession: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useTestSession('sess-1'), { wrapper });

    // Initial load
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.saveState).toBe('saved');

    // Select answer option 1 for q-1
    act(() => {
      result.current.actions.select(1);
    });

    expect(result.current.session.answers['q-1']).toEqual([1]);
    expect(sessionRepo.saveProgress).not.toHaveBeenCalled();

    // Advance 400ms - still debounced
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(sessionRepo.saveProgress).not.toHaveBeenCalled();

    // Advance remaining 400ms (total 800ms)
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(sessionRepo.saveProgress).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe('saved');
  });

  it('retries autosave after 5 seconds on network error', async () => {
    const session = createSession({
      id: 'sess-retry',
      userId: 'u1',
      questionIds: ['q-1'],
      durationLimitSec: 3600,
      now: currentTime,
    });

    let attempts = 0;
    const sessionRepo = {
      getSessionById: vi.fn().mockResolvedValue(session),
      saveProgress: vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve();
      }),
      finishSession: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useTestSession('sess-retry'), {
      wrapper,
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.actions.select(0);
    });

    // Advance through debounce 800ms
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Failed first attempt
    expect(result.current.saveState).toBe('error');
    expect(attempts).toBe(1);

    // Advance 5000ms to trigger retry
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(attempts).toBe(2);
    expect(result.current.saveState).toBe('saved');
  });

  it('finishes immediately on load if session is already expired', async () => {
    const pastStart = currentTime - 5000 * 1000;
    const session = createSession({
      id: 'sess-past',
      userId: 'u1',
      questionIds: ['q-1'],
      durationLimitSec: 3600,
      now: pastStart,
    });

    const sessionRepo = {
      getSessionById: vi.fn().mockResolvedValue(session),
      saveProgress: vi.fn(),
      finishSession: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useTestSession('sess-past'), {
      wrapper,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.session.status).toBe('completed');
    expect(sessionRepo.finishSession).toHaveBeenCalled();
  });

  it('automatically finishes session when timer reaches 0 during exam', async () => {
    const session = createSession({
      id: 'sess-live',
      userId: 'u1',
      questionIds: ['q-1'],
      durationLimitSec: 10,
      now: currentTime,
    });

    const sessionRepo = {
      getSessionById: vi.fn().mockResolvedValue(session),
      saveProgress: vi.fn(),
      finishSession: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useTestSession('sess-live'), {
      wrapper,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.session.status).toBe('in_progress');

    // Advance 10s to expire
    await act(async () => {
      currentTime += 10000;
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    expect(result.current.session.status).toBe('completed');
    expect(sessionRepo.finishSession).toHaveBeenCalled();
  });

  it('does not overwrite newer state when an older response resolves (concurrency guard)', async () => {
    const session = createSession({
      id: 'sess-concurrency',
      userId: 'u1',
      questionIds: ['q-1', 'q-2'],
      durationLimitSec: 3600,
      now: currentTime,
    });

    let resolveFirstSave;
    const firstSavePromise = new Promise((resolve) => {
      resolveFirstSave = resolve;
    });

    const sessionRepo = {
      getSessionById: vi.fn().mockResolvedValue(session),
      saveProgress: vi.fn().mockImplementation((s) => {
        if (s.answers['q-1']?.[0] === 0) {
          return firstSavePromise;
        }
        return Promise.resolve();
      }),
      finishSession: vi.fn(),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useTestSession('sess-concurrency'), {
      wrapper,
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Action 1
    act(() => {
      result.current.actions.select(0);
    });

    // Debounce triggers action 1 save
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.saveState).toBe('saving');

    // Action 2 occurs while Action 1 is still in-flight
    act(() => {
      result.current.actions.goTo(1);
    });

    // Debounce triggers action 2 save
    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    // Now resolve the older in-flight Action 1 save
    await act(async () => {
      resolveFirstSave();
      await Promise.resolve();
    });

    // Save state stays saved and answers remain latest
    expect(result.current.saveState).toBe('saved');
    expect(result.current.session.currentIndex).toBe(1);
  });
});
