import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authModule from '@features/auth';
import { useStudentAnalytics } from './useStudentAnalytics';

describe('useStudentAnalytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty analytics and stops loading when user is null', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({ user: null });

    const mockRepo = {
      getUserSessions: vi.fn(),
    };

    const { result } = renderHook(() =>
      useStudentAnalytics({ repository: mockRepo })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.analytics.hasAttempts).toBe(false);
    expect(mockRepo.getUserSessions).not.toHaveBeenCalled();
  });

  it('fetches sessions and aggregates student analytics successfully', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { uid: 'student-123', email: 'student@example.com' },
    });

    const mockSessions = [
      {
        id: 'sess-1',
        status: 'completed',
        startedAt: 1000,
        score: {
          totalScore: 40,
          maxPossibleScore: 50,
          percentage: 80,
          byTopicBreakdown: {
            python_loops: { score: 4, maxScore: 4, totalQuestions: 4 },
          },
        },
      },
    ];

    const mockRepo = {
      getUserSessions: vi.fn().mockResolvedValue(mockSessions),
    };

    const { result } = renderHook(() =>
      useStudentAnalytics({ repository: mockRepo })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockRepo.getUserSessions).toHaveBeenCalledWith('student-123');
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.analytics.hasAttempts).toBe(true);
    expect(result.current.analytics.kpis.totalTests).toBe(1);
    expect(result.current.analytics.kpis.topScore).toBe(40);
  });

  it('handles repository errors gracefully', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { uid: 'student-err' },
    });

    const mockRepo = {
      getUserSessions: vi.fn().mockRejectedValue(new Error('Network failure')),
    };

    const { result } = renderHook(() =>
      useStudentAnalytics({ repository: mockRepo })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network failure');
    expect(result.current.sessions).toEqual([]);
  });
});
