import { useEffect, useRef, useCallback } from 'react';
import { isDebugMode } from '@features/debug-mode';

/**
 * Custom hook for client-side browser violation detection during active exams.
 *
 * Intercepts:
 * - Fullscreen exit (EXIT_FULLSCREEN)
 * - Tab switching / Visibility change (TAB_SWITCH)
 * - Window blur (WINDOW_BLUR with deduplication)
 * - Copy / Cut / Paste attempts (COPY_ATTEMPT, CUT_ATTEMPT, PASTE_ATTEMPT)
 * - Context menu attempts (CONTEXT_MENU)
 * - Dangerous keyboard shortcuts (KEYBOARD_SHORTCUT)
 */
export function useExamSecurity({
  sessionId,
  isActive = false,
  onViolation,
}) {
  const lastTabSwitchRef = useRef(0);
  const wasInFullscreenRef = useRef(false);

  const report = useCallback(
    (type, metadata = {}) => {
       if (isDebugMode()) return;  
      if (!sessionId || !isActive || typeof onViolation !== 'function') return;

      const now = Date.now();
      // Deduplicate window blur if tab switch occurred within 1.5 seconds
      if (type === 'WINDOW_BLUR' && now - lastTabSwitchRef.current < 1500) {
        return;
      }
      if (type === 'TAB_SWITCH') {
        lastTabSwitchRef.current = now;
      }

      const eventId = `${type}_${now}_${Math.random().toString(36).slice(2, 7)}`;
      onViolation({ sessionId, type, eventId, metadata });
    },
    [sessionId, isActive, onViolation]
  );

  useEffect(() => {
    if (!isActive || !sessionId) {
      wasInFullscreenRef.current = false;
      return () => {};
    }

    // 1. Fullscreen Listener
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (isFs) {
        wasInFullscreenRef.current = true;
      } else if (wasInFullscreenRef.current) {
        wasInFullscreenRef.current = false;
        report('EXIT_FULLSCREEN');
      }
    };

    // 2. Tab Switch Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        report('TAB_SWITCH');
      }
    };

    // 3. Window Blur Listener
    const handleWindowBlur = () => {
      report('WINDOW_BLUR');
    };

    // 4. Clipboard Event Listeners
    const handleCopy = (e) => {
      e.preventDefault();
      report('COPY_ATTEMPT');
    };

    const handleCut = (e) => {
      e.preventDefault();
      report('CUT_ATTEMPT');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      report('PASTE_ATTEMPT');
    };

    // 5. Context Menu Listener
    const handleContextMenu = (e) => {
      e.preventDefault();
      report('CONTEXT_MENU');
    };

    // 6. Keyboard Shortcuts Listener
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';

      if (isCtrlOrCmd && ['c', 'v', 'x', 'a', 'p', 's'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();

        if (key === 'c') report('COPY_ATTEMPT', { key: 'Ctrl+C' });
        else if (key === 'v') report('PASTE_ATTEMPT', { key: 'Ctrl+V' });
        else if (key === 'x') report('CUT_ATTEMPT', { key: 'Ctrl+X' });
        else report('KEYBOARD_SHORTCUT', { key: `Ctrl+${key.toUpperCase()}` });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, sessionId, report]);

  const requestFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      wasInFullscreenRef.current = true;
    } catch {
      // Safe fallback if user gesture is missing or denied by browser
    }
  }, []);

  return {
    requestFullscreen,
  };
}
