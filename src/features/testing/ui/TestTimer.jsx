import styles from './TestTimer.module.css';

function formatRemainingTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Renders remaining exam time in monospace format mm:ss (or h:mm:ss).
 * Indicates low-time state (<= 5 min) with both styling and a non-color warning icon.
 *
 * @param {object} props
 * @param {number} props.remainingSeconds
 */
export function TestTimer({ remainingSeconds }) {
  const isLowTime = remainingSeconds <= 300 && remainingSeconds > 0;
  const formatted = formatRemainingTime(remainingSeconds);

  return (
    <div
      role="timer"
      aria-live="off"
      className={`${styles.timer} ${isLowTime ? styles.lowTime : ''}`}
    >
      <span className={styles.clockIcon} aria-hidden="true">
        ⏱
      </span>
      <span>{formatted}</span>
      {isLowTime ? (
        <span
          className={styles.warningIcon}
          aria-hidden="true"
          title="Осталось менее 5 минут"
        >
          [!]
        </span>
      ) : null}
    </div>
  );
}
