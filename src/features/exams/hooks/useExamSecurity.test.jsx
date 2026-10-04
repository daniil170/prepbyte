import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamSecurity } from './useExamSecurity';

describe('useExamSecurity hook', () => {
  let onViolationMock;

  beforeEach(() => {
    onViolationMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers TAB_SWITCH violation when document.hidden becomes true', () => {
    renderHook(() =>
      useExamSecurity({
        sessionId: 'sess-1',
        isActive: true,
        onViolation: onViolationMock,
      })
    );

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(onViolationMock).toHaveBeenCalledTimes(1);
    expect(onViolationMock.mock.calls[0][0]).toMatchObject({
      sessionId: 'sess-1',
      type: 'TAB_SWITCH',
    });
  });

  it('triggers COPY_ATTEMPT and prevents default on copy event', () => {
    renderHook(() =>
      useExamSecurity({
        sessionId: 'sess-1',
        isActive: true,
        onViolation: onViolationMock,
      })
    );

    const copyEvent = new Event('copy', { cancelable: true });
    act(() => {
      document.dispatchEvent(copyEvent);
    });

    expect(copyEvent.defaultPrevented).toBe(true);
    expect(onViolationMock).toHaveBeenCalledTimes(1);
    expect(onViolationMock.mock.calls[0][0]).toMatchObject({
      sessionId: 'sess-1',
      type: 'COPY_ATTEMPT',
    });
  });

  it('triggers CUT_ATTEMPT and PASTE_ATTEMPT on clipboard events', () => {
    renderHook(() =>
      useExamSecurity({
        sessionId: 'sess-1',
        isActive: true,
        onViolation: onViolationMock,
      })
    );

    const cutEvent = new Event('cut', { cancelable: true });
    const pasteEvent = new Event('paste', { cancelable: true });

    act(() => {
      document.dispatchEvent(cutEvent);
      document.dispatchEvent(pasteEvent);
    });

    expect(cutEvent.defaultPrevented).toBe(true);
    expect(pasteEvent.defaultPrevented).toBe(true);
    expect(onViolationMock).toHaveBeenCalledTimes(2);
    expect(onViolationMock.mock.calls[0][0].type).toBe('CUT_ATTEMPT');
    expect(onViolationMock.mock.calls[1][0].type).toBe('PASTE_ATTEMPT');
  });

  it('triggers CONTEXT_MENU and prevents default on contextmenu event', () => {
    renderHook(() =>
      useExamSecurity({
        sessionId: 'sess-1',
        isActive: true,
        onViolation: onViolationMock,
      })
    );

    const contextMenuEvent = new Event('contextmenu', { cancelable: true });
    act(() => {
      document.dispatchEvent(contextMenuEvent);
    });

    expect(contextMenuEvent.defaultPrevented).toBe(true);
    expect(onViolationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-1',
        type: 'CONTEXT_MENU',
      })
    );
  });

  it('triggers KEYBOARD_SHORTCUT for Ctrl+A or Cmd+S shortcuts', () => {
    renderHook(() =>
      useExamSecurity({
        sessionId: 'sess-1',
        isActive: true,
        onViolation: onViolationMock,
      })
    );

    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      cancelable: true,
    });

    act(() => {
      document.dispatchEvent(keyEvent);
    });

    expect(keyEvent.defaultPrevented).toBe(true);
    expect(onViolationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess-1',
        type: 'KEYBOARD_SHORTCUT',
      })
    );
  });

  it('does NOT trigger violations when isActive is false', () => {
    renderHook(() =>
      useExamSecurity({
        sessionId: 'sess-1',
        isActive: false,
        onViolation: onViolationMock,
      })
    );

    act(() => {
      document.dispatchEvent(new Event('copy'));
      document.dispatchEvent(new Event('contextmenu'));
    });

    expect(onViolationMock).not.toHaveBeenCalled();
  });
});
