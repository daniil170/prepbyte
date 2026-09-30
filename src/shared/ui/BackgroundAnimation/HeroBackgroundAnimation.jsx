import { useEffect, useRef } from 'react';
import styles from './HeroBackgroundAnimation.module.css';

const CODE_GLYPHS = [
  '0',
  '1',
  '{ }',
  '< >',
  'λ',
  '0x',
  'def',
  'sql',
  '&&',
  '!=',
  '[]',
  ';',
  'fn',
];

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

/**
 * Interactive cybernetic background animation for the Hero section.
 * Renders glowing ambient mesh gradients, a digital matrix grid,
 * and high-performance canvas particles representing CS tokens with mouse interaction.
 */
export function HeroBackgroundAnimation({ className = '' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (shouldReduceMotion()) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Mouse coordinates relative to canvas
    const mouse = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const initSize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    initSize();

    // Create particles
    const particleCount = Math.min(
      45,
      Math.max(24, Math.floor((width * height) / 18000))
    );
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const isGlyph = Math.random() > 0.45;
      particles.push({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 400),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.15 - Math.random() * 0.35, // gentle upward floating
        radius: isGlyph ? 0 : 1.2 + Math.random() * 1.6,
        isGlyph,
        glyph: isGlyph
          ? CODE_GLYPHS[Math.floor(Math.random() * CODE_GLYPHS.length)]
          : '',
        alpha: 0.15 + Math.random() * 0.35,
        baseAlpha: 0.15 + Math.random() * 0.35,
      });
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState !== 'hidden';
    };

    const handleResize = () => {
      initSize();
    };

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Render mouse spotlight if active
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          160
        );
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.08)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw faint connection lines between close particles
      const maxDist = 85;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 197, 94, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Mouse avoidance/repulsion
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdistSq = mdx * mdx + mdy * mdy;
          const repulsionRadius = 90;

          if (mdistSq < repulsionRadius * repulsionRadius && mdistSq > 0) {
            const mdist = Math.sqrt(mdistSq);
            const force = (repulsionRadius - mdist) / repulsionRadius;
            p.x += (mdx / mdist) * force * 1.5;
            p.y += (mdy / mdist) * force * 1.5;
            p.alpha = Math.min(0.85, p.baseAlpha + force * 0.4);
          } else {
            p.alpha += (p.baseAlpha - p.alpha) * 0.05;
          }
        }

        // Draw particle
        if (p.isGlyph) {
          ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
          ctx.fillText(p.glyph, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 197, 94, ${p.alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove, {
        passive: true,
      });
      container.addEventListener('mouseleave', handleMouseLeave, {
        passive: true,
      });
    }

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`.trim()}
      aria-hidden="true"
    >
      {/* Ambient gradient aura orbs */}
      <div className={styles.ambientGlowPrimary} />
      <div className={styles.ambientGlowSecondary} />
      <div className={styles.ambientGlowAccent} />

      {/* Cybernetic digital grid overlay */}
      <div className={styles.gridOverlay} />

      {/* Interactive canvas particles */}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
