import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth';
import { TestingProvider } from './TestingProvider';
import { useQuestionCoverage } from './useQuestionCoverage';

describe('useQuestionCoverage', () => {
  function createWrapper({ user = { uid: 'u1' }, questionRepo, exposureRepo }) {
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
            questionRepository={questionRepo}
            exposureRepository={exposureRepo}
          >
            {children}
          </TestingProvider>
        </AuthProvider>
      );
    };
  }

  it('calculates coverage correctly when user has exposure data', async () => {
    const questionRepo = {
      getQuestionCount: vi.fn().mockResolvedValue(119),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({
        'q-1': { timesSeen: 1 },
        'q-2': { timesSeen: 2 },
        'q-3': { timesSeen: 1 },
      }),
    };

    const wrapper = createWrapper({ questionRepo, exposureRepo });
    const { result } = renderHook(() => useQuestionCoverage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.total).toBe(119);
    expect(result.current.seen).toBe(3);
    expect(result.current.unseen).toBe(116);
    expect(result.current.error).toBeNull();
  });

  it('clamps unseen to 0 when seen exceeds total', async () => {
    const questionRepo = {
      getQuestionCount: vi.fn().mockResolvedValue(2),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({
        'q-1': { timesSeen: 1 },
        'q-2': { timesSeen: 1 },
        'q-3': { timesSeen: 1 },
      }),
    };

    const wrapper = createWrapper({ questionRepo, exposureRepo });
    const { result } = renderHook(() => useQuestionCoverage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.seen).toBe(3);
    expect(result.current.unseen).toBe(0);
  });

  it('degrades gracefully if exposure read fails', async () => {
    const questionRepo = {
      getQuestionCount: vi.fn().mockResolvedValue(100),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    const wrapper = createWrapper({ questionRepo, exposureRepo });
    const { result } = renderHook(() => useQuestionCoverage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.total).toBe(100);
    expect(result.current.seen).toBe(0);
    expect(result.current.unseen).toBe(100);
    expect(result.current.error).toBeNull();
  });

  it('handles error when question count fails', async () => {
    const questionRepo = {
      getQuestionCount: vi
        .fn()
        .mockRejectedValue(new Error('Failed to fetch count')),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({}),
    };

    const wrapper = createWrapper({ questionRepo, exposureRepo });
    const { result } = renderHook(() => useQuestionCoverage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch count');
  });

  it('handles unauthenticated user with seen = 0', async () => {
    const questionRepo = {
      getQuestionCount: vi.fn().mockResolvedValue(119),
    };
    const exposureRepo = {
      getExposure: vi.fn(),
    };

    const wrapper = createWrapper({ user: null, questionRepo, exposureRepo });
    const { result } = renderHook(() => useQuestionCoverage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.total).toBe(119);
    expect(result.current.seen).toBe(0);
    expect(result.current.unseen).toBe(119);
    expect(exposureRepo.getExposure).not.toHaveBeenCalled();
  });
});
