import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth';
import { createSession } from '../domain/testSession';
import { TestingProvider } from './TestingProvider';
import { useActiveSession } from './useActiveSession';

describe('useActiveSession', () => {
  const currentTime = 1700000000000;

  function createWrapper({ user = { uid: 'u1' }, sessionRepo }) {
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
            now={() => currentTime}
          >
            {children}
          </TestingProvider>
        </AuthProvider>
      );
    };
  }

  it('returns active in-progress session if valid and not expired', async () => {
    const session = createSession({
      id: 'sess-active',
      userId: 'u1',
      questionIds: ['q1'],
      durationLimitSec: 3600,
      now: currentTime - 60 * 1000,
    });

    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(session),
      finishSession: vi.fn(),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useActiveSession(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeSession).toEqual(session);
    expect(sessionRepo.finishSession).not.toHaveBeenCalled();
  });

  it('treats expired in-progress session as inactive, finishes it, and returns null', async () => {
    const expiredSession = createSession({
      id: 'sess-expired',
      userId: 'u1',
      questionIds: ['q1'],
      durationLimitSec: 1000,
      now: currentTime - 5000 * 1000,
    });

    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(expiredSession),
      finishSession: vi.fn().mockResolvedValue(undefined),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useActiveSession(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeSession).toBeNull();
    expect(sessionRepo.finishSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sess-expired',
        status: 'completed',
      })
    );
  });

  it('returns null if there is no active session', async () => {
    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(null),
      finishSession: vi.fn(),
    };

    const wrapper = createWrapper({ sessionRepo });
    const { result } = renderHook(() => useActiveSession(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeSession).toBeNull();
  });
});
