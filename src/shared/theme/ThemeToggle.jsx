import { useTheme } from './useTheme';
import styles from './ThemeToggle.module.css';

/**
 * Universal theme toggle button for dark / light modes.
 */
export function ThemeToggle({ showLabel = true, className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${styles.themeToggle} ${className}`.trim()}
      aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      {showLabel && (
        <span className={styles.label}>
          {isDark ? 'Светлая' : 'Тёмная'}
        </span>
      )}
    </button>
  );
}
