import { useEffect, useRef, useState } from 'react';
import { LOGO_CELLS } from '@shared/ui/Logo/Logo';
import { scrambleText } from '@shared/lib/scrambleText';
import styles from './BrandIntro.module.css';

export const BRAND_INTRO_SESSION_KEY = 'prepbyte_intro_shown';

const INTRO_CELLS = Object.freeze(
  LOGO_CELLS.map((cell, index) => {
    const glyphs = ['1', '0', '1', '0', '0', '1', '1', '0', '1', '0', '1', '0'];
    const offsets = [
      { dx: '-55px', dy: '-40px', delay: '0.04s' },
      { dx: '35px', dy: '-65px', delay: '0.12s' },
      { dx: '-20px', dy: '-50px', delay: '0.08s' },
      { dx: '70px', dy: '-30px', delay: '0.15s' },
      { dx: '-80px', dy: '15px', delay: '0.18s' },
      { dx: '65px', dy: '25px', delay: '0.06s' },
      { dx: '-65px', dy: '40px', delay: '0.14s' },
      { dx: '-30px', dy: '55px', delay: '0.10s' },
      { dx: '25px', dy: '45px', delay: '0.20s' },
      { dx: '55px', dy: '60px', delay: '0.16s' },
      { dx: '-45px', dy: '80px', delay: '0.07s' },
      { dx: '-25px', dy: '95px', delay: '0.11s' },
    ];
    return {
      ...cell,
      glyph: glyphs[index],
      ...offsets[index],
    };
  })
);

function hasPlayedIntro() {
  try {
    return sessionStorage.getItem(BRAND_INTRO_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function markIntroPlayed() {
  try {
    sessionStorage.setItem(BRAND_INTRO_SESSION_KEY, 'true');
  } catch {
    // Ignore restricted storage errors
  }
}

function shouldReduceMotion() {
  try {
    return Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    );
  } catch {
    return false;
  }
}

export function BrandIntro() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (hasPlayedIntro()) return false;
    if (shouldReduceMotion()) {
      markIntroPlayed();
      return false;
    }
    return true;
  });

  const [displayText, setDisplayText] = useState('');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;

    const dismiss = () => {
      markIntroPlayed();
      setIsVisible(false);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };

    const handleKeyDown = () => {
      dismiss();
    };

    window.addEventListener('keydown', handleKeyDown);

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;

      if (elapsed < 1400) {
        // 0-1.4s: Cells drifting and flipping
        setDisplayText('');
      } else if (elapsed < 2400) {
        // 1.4-2.4s: Wordmark decoding from 0/1 noise to PrepByte
        const progress = (elapsed - 1400) / 1000;
        setDisplayText(scrambleText('PrepByte', progress));
      } else if (elapsed < 2800) {
        // 2.4-2.8s: Overlay fading out
        setDisplayText('PrepByte');
        setIsFadingOut(true);
      } else {
        // 2.8s+: Dismiss overlay
        dismiss();
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const handleOverlayClick = () => {
    markIntroPlayed();
    setIsVisible(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  return (
    <aside
      className={`${styles.overlay} ${isFadingOut ? styles.overlayFading : ''}`.trim()}
      onClick={handleOverlayClick}
      aria-hidden="true"
      tabIndex={-1}
      data-testid="brand-intro-overlay"
    >
      <div className={styles.brand}>
        <div className={styles.grid}>
          {INTRO_CELLS.map((cell) => (
            <span
              key={`${cell.x}-${cell.y}`}
              className={styles.cell}
              style={{
                '--col': cell.x,
                '--row': cell.y,
                '--dx': cell.dx,
                '--dy': cell.dy,
                '--delay': cell.delay,
              }}
            >
              {cell.glyph}
            </span>
          ))}
        </div>
        <div className={styles.wordmarkWrapper}>
          <span className={styles.wordmark}>{displayText}</span>
          <span className={styles.cursor} />
        </div>
      </div>
    </aside>
  );
}
