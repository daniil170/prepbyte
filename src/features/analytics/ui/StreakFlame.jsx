import styles from './StreakFlame.module.css';

/**
 * Animated flame component for study streak (ударный режим).
 * Features an organic multi-layered SVG flame with flickering tongues,
 * ambient glowing radial backdrop, and floating rising embers.
 *
 * @param {object} props
 * @param {number} [props.streak=0] Current streak count in days.
 * @param {number} [props.size=26] Size of the flame in pixels.
 * @param {string} [props.className=''] Additional CSS class name.
 */
export function StreakFlame({ streak = 0, size = 26, className = '' }) {
  const numStreak = Number(streak) || 0;
  const isActive = numStreak > 0;
  const label = isActive
    ? `Ударный режим: ${numStreak} дн.`
    : 'Ударный режим: нет активной серии';

  return (
    <div
      className={`${styles.flameContainer} ${isActive ? styles.active : styles.inactive} ${className}`}
      style={{ '--flame-size': `${size}px` }}
      role="img"
      aria-label={label}
      title={label}
      data-testid="streak-flame"
      data-active={isActive ? 'true' : 'false'}
    >
      {/* Ambient glowing backdrop */}
      <div className={styles.ambientGlow} />

      {/* Floating ember sparks when active */}
      {isActive && (
        <div className={styles.sparksContainer} aria-hidden="true">
          <span className={`${styles.spark} ${styles.spark1}`} />
          <span className={`${styles.spark} ${styles.spark2}`} />
          <span className={`${styles.spark} ${styles.spark3}`} />
        </div>
      )}

      {/* SVG Multi-layer flame */}
      <svg
        viewBox="0 0 32 36"
        width={size}
        height={Math.round(size * (36 / 32))}
        className={styles.flameSvg}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Outer flame gradient: rich crimson to fiery orange */}
          <linearGradient
            id="prepbyte-flame-outer"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="35%" stopColor="#ea580c" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          {/* Inner flame gradient: golden amber to glowing bright yellow */}
          <linearGradient
            id="prepbyte-flame-inner"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Hot core gradient: white-yellow spark */}
          <linearGradient
            id="prepbyte-flame-core"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Inactive flame gradient: sleek muted slate */}
          <linearGradient
            id="prepbyte-flame-dormant"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="60%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>

        {/* Outer Flame Silhouette */}
        <path
          className={styles.outerFlame}
          d="M16 2C16.8 5.5 19 8.5 22 10.5C25.5 12.8 27 16.5 27 20.5C27 26.5 22 31 16 31C10 31 5 26.5 5 20.5C5 15 8.5 11 12 8C12.5 10.8 14 12.5 16.5 13C15.8 10 15.5 5.5 16 2Z"
          fill={
            isActive
              ? 'url(#prepbyte-flame-outer)'
              : 'url(#prepbyte-flame-dormant)'
          }
        />

        {/* Secondary flicking tongue */}
        <path
          className={styles.tongueFlame}
          d="M16 8C17 11 19 13 20.5 15C22 17 22.5 19 22.5 21C22.5 24.5 19.5 27.5 16 27.5C13.5 27.5 11.5 25.5 11.5 23C11.5 20.5 13.5 18.5 15 16.5C15.5 15 15.8 12 16 8Z"
          fill={isActive ? '#fb923c' : '#71717a'}
          opacity={isActive ? 0.85 : 0.4}
        />

        {/* Inner Flame Core */}
        <path
          className={styles.innerFlame}
          d="M16 13C16.5 15 17.8 16.8 19 18.2C20.2 19.6 21 21.2 21 23C21 25.8 18.8 28 16 28C13.2 28 11 25.8 11 23C11 20.5 13 18 14.5 16.2C15 15 15.6 13.8 16 13Z"
          fill={isActive ? 'url(#prepbyte-flame-inner)' : '#a1a1aa'}
          opacity={isActive ? 0.95 : 0.5}
        />

        {/* White-Hot Center Heart */}
        {isActive && (
          <path
            className={styles.coreFlame}
            d="M16 20C17 21 17.8 22.2 17.8 23.5C17.8 24.9 17 26 16 26C15 26 14.2 24.9 14.2 23.5C14.2 22.2 15 21 16 20Z"
            fill="url(#prepbyte-flame-core)"
          />
        )}
      </svg>
    </div>
  );
}
