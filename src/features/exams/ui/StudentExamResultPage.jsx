import { Link } from 'react-router-dom';
import styles from './StudentExamResultPage.module.css';

export function StudentExamResultPage({ session, exam }) {
  const score = session?.score || {};
  const totalScore = session?.totalScore ?? score.totalScore ?? 0;
  const maxScore = session?.maxPossibleScore ?? score.maxPossibleScore ?? 50;
  const percentage = session?.percentage ?? score.percentage ?? 0;
  const passed = percentage >= 50;
  const breakdown = score.byTopicBreakdown || {};

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Экзамен завершён</h1>
          <p className={styles.subtitle}>
            {exam?.title || 'Онлайн-экзамен PrepByte'}
          </p>
        </div>

        <div className={styles.scoreBanner}>
          <span className={styles.scoreValue}>
            {totalScore} / {maxScore}
          </span>
          <span className={styles.scoreLabel}>Набрано баллов ({percentage}%)</span>
          <span className={passed ? styles.badgePassed : styles.badgeFailed}>
            {passed ? '✓ Порог ЕНТ пройден (50%+)' : '✗ Порог ЕНТ не набран (<50%)'}
          </span>
        </div>

        {Object.keys(breakdown).length > 0 && (
          <div className={styles.topicsContainer}>
            <span className={styles.topicsTitle}>Результаты по темам</span>
            {Object.values(breakdown).map((t) => (
              <div key={t.topic} className={styles.topicRow}>
                <span>{t.topic}</span>
                <strong>
                  {t.score} / {t.maxScore} б. ({t.percentage}%)
                </strong>
              </div>
            ))}
          </div>
        )}

        <Link to="/" className={styles.homeBtn}>
          Вернуться на главную платформы
        </Link>
      </div>
    </div>
  );
}
