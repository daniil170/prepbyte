import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTutorChat } from './useTutorChat';

describe('useTutorChat hook', () => {
  it('initializes with a friendly welcome message', () => {
    const { result } = renderHook(() => useTutorChat());

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toContain('ИИ-тьютор');
    expect(result.current.isLoading).toBe(false);
  });

  it('sends user message and updates history with assistant response', async () => {
    const mockClientFn = vi
      .fn()
      .mockResolvedValue('Отличный ответ наставника!');
    const { result } = renderHook(() =>
      useTutorChat({ clientFn: mockClientFn })
    );

    await act(async () => {
      await result.current.sendMessage('Как работает цикл for?');
    });

    expect(mockClientFn).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toHaveLength(3); // welcome + user + assistant
    expect(result.current.messages[1].role).toBe('user');
    expect(result.current.messages[1].content).toBe('Как работает цикл for?');
    expect(result.current.messages[2].role).toBe('assistant');
    expect(result.current.messages[2].content).toBe(
      'Отличный ответ наставника!'
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('handles client errors gracefully', async () => {
    const mockErrorClient = vi
      .fn()
      .mockRejectedValue(new Error('Сетевой сбой'));
    const { result } = renderHook(() =>
      useTutorChat({ clientFn: mockErrorClient })
    );

    await act(async () => {
      await result.current.sendMessage('Тест ошибки');
    });

    expect(result.current.error).toContain('Сетевой сбой');
    expect(result.current.isLoading).toBe(false);
  });

  it('clears conversation history back to the initial welcome message', async () => {
    const mockClientFn = vi.fn().mockResolvedValue('Ответ');
    const { result } = renderHook(() =>
      useTutorChat({ clientFn: mockClientFn })
    );

    await act(async () => {
      await result.current.sendMessage('Вопрос');
    });
    expect(result.current.messages.length).toBeGreaterThan(1);

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].meta.isWelcome).toBe(true);
  });
});
