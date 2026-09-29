import { LOGO_CELLS } from './logoCells';
import styles from './Logo.module.css';

export { LOGO_CELLS };

export function Logo({ variant = 'full', size = 24, className = '' }) {
  const isFull = variant === 'full';

  return (
    <div className={`${styles.logo} ${className}`.trim()}>
      <svg
        role="img"
        aria-label="PrepByte"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={styles.mark}
        fill="currentColor"
      >
        {LOGO_CELLS.map((cell) => (
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x * 5}
            y={cell.y * 5}
            width="4"
            height="4"
            rx="0.5"
          />
        ))}
      </svg>
      {isFull && <span className={styles.wordmark}>PrepByte</span>}
    </div>
  );
}
