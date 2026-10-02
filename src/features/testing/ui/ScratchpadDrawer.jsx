import { useState } from 'react';
import styles from './ScratchpadDrawer.module.css';

/**
 * Clean white sheet scratchpad drawer for exam calculations & scratch work.
 */
export function ScratchpadDrawer({ isOpen, onClose, sessionId }) {
  const storageKey = `prepbyte_scratchpad_${sessionId || 'general'}`;
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || '';
    } catch {
      return '';
    }
  });

  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // Ignore localStorage quota errors
    }
  };

  const handleClear = () => {
    if (window.confirm('Очистить черновик?')) {
      setContent('');
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  };

  const insertSnippet = (snippet) => {
    setContent((prev) => {
      const updated = prev ? `${prev}\n${snippet}` : snippet;
      try {
        localStorage.setItem(storageKey, updated);
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <aside className={styles.drawer} role="complementary" aria-label="Черновик для вычислений">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Белый лист / Черновик</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Скрыть черновик"
        >
          ✕
        </button>
      </div>

      <div className={styles.quickBar}>
        <span className={styles.quickLabel}>Вставить:</span>
        <button
          type="button"
          className={styles.quickBtn}
          onClick={() => insertSnippet('2^0=1, 2^1=2, 2^2=4, 2^3=8, 2^4=16, 2^5=32, 2^6=64, 2^7=128, 2^8=256, 2^9=512, 2^10=1024')}
          title="Степени двойки"
        >
          2ⁿ
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          onClick={() => insertSnippet('| A | B | A and B | A or B | not A |\n|---|---|---------|--------|-------|\n| 0 | 0 |    0    |   0    |   1   |\n| 0 | 1 |    0    |   1    |   1   |\n| 1 | 0 |    0    |   1    |   0   |\n| 1 | 1 |    1    |   1    |   0   |')}
          title="Таблица истинности"
        >
          Истинность
        </button>
        <button
          type="button"
          className={styles.quickBtn}
          onClick={() => insertSnippet('i | value | result\n--|-------|-------')}
          title="Трассировка цикла"
        >
          Трассировка
        </button>
      </div>

      <div className={styles.editorArea}>
        <textarea
          className={styles.textarea}
          placeholder="Используйте этот белый лист для любых черновых записей, подсчетов систем счисления, трассировки кода..."
          value={content}
          onChange={handleChange}
          aria-label="Поле для черновых вычислений"
        />
      </div>

      <div className={styles.footer}>
        <span>Автосохранение включено</span>
        <button
          type="button"
          className={styles.clearBtn}
          onClick={handleClear}
        >
          Очистить
        </button>
      </div>
    </aside>
  );
}
