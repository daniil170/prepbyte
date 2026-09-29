import styles from './SaveIndicator.module.css';

/**
 * Visual indicator displaying autosave status in Russian.
 *
 * @param {object} props
 * @param {'saved'|'saving'|'error'} [props.saveState='saved']
 */
export function SaveIndicator({ saveState = 'saved' }) {
  let text = 'Сохранено';
  let icon = '✓';
  let stateClass = styles.saved;

  if (saveState === 'saving') {
    text = 'Сохранение...';
    icon = '●';
    stateClass = styles.saving;
  } else if (saveState === 'error') {
    text = 'Ошибка сохранения';
    icon = '[!]';
    stateClass = styles.error;
  }

  return (
    <div className={`${styles.indicator} ${stateClass}`} aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
