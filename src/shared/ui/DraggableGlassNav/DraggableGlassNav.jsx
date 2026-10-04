import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './DraggableGlassNav.module.css';

/**
 * Apple-style Liquid Glass Navbar with click-and-drag horizontal scroll,
 * tactile elastic spring offset, mouse wheel support, and smooth visual effects.
 */
export function DraggableGlassNav({ children, className = '', ariaLabel = 'Навигация' }) {
  const navRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);
  const [elasticOffset, setElasticOffset] = useState(0);

  const handleMouseDown = useCallback((e) => {
    if (!navRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(navRef.current.scrollLeft);
    setDraggedDistance(0);
    setElasticOffset(0);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setElasticOffset(0);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setElasticOffset(0);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !navRef.current) return;
      e.preventDefault();
      const deltaX = e.pageX - startX;
      setDraggedDistance((prev) => prev + Math.abs(deltaX));

      const { scrollWidth, clientWidth } = navRef.current;
      const canScroll = scrollWidth > clientWidth;

      if (canScroll) {
        // Scroll horizontally if overflowing
        navRef.current.scrollLeft = scrollLeft - deltaX * 1.5;
      } else {
        // If content fits comfortably, apply elastic Apple-style spring offset
        const damping = 0.35;
        setElasticOffset(deltaX * damping);
      }
    },
    [isDragging, startX, scrollLeft]
  );

  const handleWheel = useCallback((e) => {
    if (!navRef.current) return;
    if (e.deltaY !== 0 || e.deltaX !== 0) {
      navRef.current.scrollLeft += (e.deltaX || e.deltaY) * 0.8;
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
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={handleClickCapture}
    >
      <div
        className={styles.innerTrack}
        style={{
          transform: `translateX(${elasticOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {children}
      </div>
    </nav>
  );
}
