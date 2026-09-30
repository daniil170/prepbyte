import { TOPICS } from '../domain/topics';
import styles from './VariantValidationSummary.module.css';

/**
 * Visual report of variant validation results (errors, warnings, and metrics).
 *
 * @param {object} props
 * @param {object} props.validationResult - Result from validateVariantPayload.
 * @param {string} [props.fileName] - Name of uploaded file.
 */
export function VariantValidationSummary({ validationResult, fileName }) {
  if (!validationResult) return null;

  const { isValid, errors, warnings, stats, meta } = validationResult;

  return (
    <div className={styles.container} aria-label="Результат валидации варианта">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.variantTitle}>
            {meta?.title || fileName || 'Вариант заданий'}
          </h3>
          {meta?.variantId && (
            <span className={styles.variantId}>ID: {meta.variantId}</span>
          )}
        </div>
        <div className={styles.statusBadgeWrapper}>
          {isValid ? (
            <span className={styles.statusValid}>[✓ ВАЛИДАЦИЯ ПРОЙДЕНА]</span>
          ) : (
            <span className={styles.statusInvalid}>[✗ ЕСТЬ ОШИБКИ]</span>
          )}
        </div>
      </div>

      {/* Errors display */}
      {!isValid && errors && errors.length > 0 && (
        <div className={styles.errorCard} role="alert">
          <h4 className={styles.errorHeading}>
            Обнаружены ошибки ({errors.length}):
          </h4>
          <ul className={styles.errorList}>
            {errors.map((err, idx) => (
              <li key={idx} className={styles.errorItem}>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings display */}
      {warnings && warnings.length > 0 && (
        <div className={styles.warningCard}>
          <h4 className={styles.warningHeading}>
            Примечания ({warnings.length}):
          </h4>
          <ul className={styles.warningList}>
            {warnings.map((w, idx) => (
              <li key={idx} className={styles.warningItem}>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats display if valid */}
      {stats && (
        <div className={styles.statsSection}>
          <div className={styles.kpiRow}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Заданий</span>
              <span className={styles.kpiValue}>{stats.totalQuestions}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Макс. балл</span>
              <span className={styles.kpiValue}>
                {stats.totalPoints}{' '}
                <span className={styles.subValue}>
                  {stats.isStandard40UNT ? '(ЕНТ)' : ''}
                </span>
              </span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Одиночный выбор</span>
              <span className={styles.kpiValue}>
                {stats.singleChoiceCount}{' '}
                <span className={styles.subValue}>× 1 балл</span>
              </span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Множественный выбор</span>
              <span className={styles.kpiValue}>
                {stats.multiChoiceCount}{' '}
                <span className={styles.subValue}>× 2 балла</span>
              </span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Темы ЕНТ</span>
              <span className={styles.kpiValue}>
                {stats.coveredTopicsCount} / 12
              </span>
            </div>
          </div>

          <div className={styles.distributionBlock}>
            <h4 className={styles.subHeading}>Баланс сложности:</h4>
            <div className={styles.difficultyPills}>
              <span className={`${styles.diffPill} ${styles.diffEasy}`}>
                Easy: {stats.difficultyCounts.easy || 0}
              </span>
              <span className={`${styles.diffPill} ${styles.diffMedium}`}>
                Medium: {stats.difficultyCounts.medium || 0}
              </span>
              <span className={`${styles.diffPill} ${styles.diffHard}`}>
                Hard: {stats.difficultyCounts.hard || 0}
              </span>
            </div>
          </div>

          <div className={styles.distributionBlock}>
            <h4 className={styles.subHeading}>Распределение по 12 темам:</h4>
            <div className={styles.topicGrid}>
              {TOPICS.map((topic) => {
                const count = stats.topicCounts[topic.id] || 0;
                return (
                  <div
                    key={topic.id}
                    className={`${styles.topicChip} ${
                      count > 0 ? styles.topicActive : styles.topicZero
                    }`}
                  >
                    <span className={styles.topicName}>{topic.label}</span>
                    <span className={styles.topicCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
