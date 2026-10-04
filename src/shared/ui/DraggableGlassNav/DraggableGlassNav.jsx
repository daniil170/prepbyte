import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './DraggableGlassNav.module.css';

/**
 * Apple-style Liquid Glass Navbar with click-and-drag horizontal scroll,
 * mouse wheel support, and smooth spring hover/active visual effects.
 */
export function DraggableGlassNav({ children, className = '', ariaLabel = 'Навигация' }) {
  const navRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);

  const handleMouseDown = useCallback((e) => {
    if (!navRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeft(navRef.current.scrollLeft);
    setDraggedDistance(0);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !navRef.current) return;
      e.preventDefault();
      const x = e.pageX - navRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed factor
      navRef.current.scrollLeft = scrollLeft - walk;
      setDraggedDistance((prev) => prev + Math.abs(x - startX));
    },
    [isDragging, startX, scrollLeft]
  );

  const handleWheel = useCallback((e) => {
    if (!navRef.current) return;
    if (e.deltaY !== 0) {
      navRef.current.scrollLeft += e.deltaY * 0.8;
    }
  }, []);

  // Prevent link click if user was dragging
  const handleClickCapture = useCallback(
    (e) => {
      if (draggedDistance > 8) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [draggedDistance]
  );

  return (
    <nav
      ref={navRef}
      className={`${styles.glassNav} ${isDragging ? styles.isDragging : ''} ${className}`}
      aria-label={ariaLabel}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onClickCapture={handleClickCapture}
    >
      <div className={styles.innerTrack}>{children}</div>
    </nav>
  );
}
