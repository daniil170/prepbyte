import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSession } from '../domain/testSession';
import { TestingProvider } from './TestingProvider';
import { useRemainingSeconds } from './useRemainingSeconds';

describe('useRemainingSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks down each second and triggers onExpire once at 0', () => {
    let currentTime = 1700000000000;
    const now = () => currentTime;
    const onExpire = vi.fn();

    const session = createSession({
      id: 'sess-timer',
      userId: 'u1',
      questionIds: ['q1'],
      durationLimitSec: 5,
      now,
    });

    const wrapper = ({ children }) => (
      <TestingProvider now={now}>{children}</TestingProvider>
    );

    const { result } = renderHook(
      () => useRemainingSeconds(session, { onExpire }),
      { wrapper }
    );

    expect(result.current).toBe(5);

    // Advance 2 seconds
    act(() => {
      currentTime += 2000;
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(3);
    expect(onExpire).not.toHaveBeenCalled();

    // Advance remaining 3 seconds
    act(() => {
      currentTime += 3000;
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);

    // Advance further — onExpire should NOT be called again
    act(() => {
      currentTime += 2000;
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('immediately fires onExpire if session is already expired on mount', () => {
    const startTime = 1700000000000;
    const now = () => startTime + 5000 * 1000; // 5000s elapsed
    const onExpire = vi.fn();

    const session = createSession({
      id: 'sess-expired',
      userId: 'u1',
      questionIds: ['q1'],
      durationLimitSec: 3600,
      now: startTime,
    });

    const wrapper = ({ children }) => (
      <TestingProvider now={now}>{children}</TestingProvider>
    );

    const { result } = renderHook(
      () => useRemainingSeconds(session, { onExpire }),
      { wrapper }
    );

    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
