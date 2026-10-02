import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@shared/ui/Logo/Logo';
import { ThemeToggle } from '@shared/theme';
import { useStudentAnalytics } from '../hooks/useStudentAnalytics';
import styles from './AnalyticsDashboard.module.css';

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return '';
  const diffSec = Math.max(0, Math.round((finishedAt - startedAt) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins} мин ${secs} сек`;
}

export function AnalyticsDashboard({ hook = useStudentAnalytics }) {
  const { analytics, isLoading, error, refetch } = hook();
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | 'strong' | 'growth'

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link to="/" className={styles.homeLink} title="PrepByte Главная">
              <Logo variant="mark" size={24} />
            </Link>
            <span className={styles.headerTitle}>Аналитика</span>
          </div>
        </header>

        <div className={styles.statusCard}>
          <Logo variant="mark" size={32} />
          <h2 className={styles.statusTitle}>Загрузка аналитики...</h2>
          <p className={styles.statusDescription}>
            Сбор истории попыток и вычисление статистики мастерства.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link to="/" className={styles.homeLink} title="PrepByte Главная">
              <Logo variant="mark" size={24} />
            </Link>
            <span className={styles.headerTitle}>Аналитика</span>
          </div>
        </header>

        <div className={styles.statusCard}>
          <h2 className={styles.statusTitle}>Ошибка загрузки</h2>
          <p className={styles.statusDescription}>{error}</p>
          <button
            type="button"
            onClick={refetch}
            className={styles.primaryButton}
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  const { kpis, topicMastery, scoreTimeline, recentAttempts, hasAttempts } =
    analytics;

  // Filtered topics
  let displayedTopics = topicMastery.allTopics;
  if (topicFilter === 'strong') {
    displayedTopics = topicMastery.strongTopics;
  } else if (topicFilter === 'growth') {
    displayedTopics = topicMastery.growthTopics;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.homeLink} title="PrepByte Главная">
            <Logo variant="full" size={24} />
          </Link>
          <span className={styles.headerTitle}>Учебный дашборд</span>
        </div>

        <div className={styles.headerRight}>
          <ThemeToggle />
          <Link to="/" className={styles.navLink}>
            ← К тестированию
          </Link>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Аналитика подготовки</h1>
          <p className={styles.pageSubtitle}>
            Индивидуальные метрики прогресса, профилирование сильных тем и
            динамика баллов.
          </p>
        </div>

        {!hasAttempts ? (
          <div className={styles.statusCard} aria-label="Нет пройденных тестов">
            <Logo variant="mark" size={36} />
            <h2 className={styles.statusTitle}>Пока нет пройденных тестов</h2>
            <p className={styles.statusDescription}>
              Пройдите пробный вариант ЕНТ по информатике, чтобы сформировать
              карту знаний и отслеживать динамику подготовки.
            </p>
            <Link to="/" className={styles.primaryButton}>
              Начать первый тест →
            </Link>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <section aria-label="Ключевые показатели">
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Всего тестов</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{kpis.totalTests}</span>
                  </div>
                  <p className={styles.kpiDescription}>
                    Завершено: {kpis.completedTests} из {kpis.totalTests}
                  </p>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Средний балл</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{kpis.averageScore}</span>
                    <span className={styles.kpiSubValue}>/ 50</span>
                  </div>
                  <p className={styles.kpiDescription}>
                    По официальной шкале ЕНТ
                  </p>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Лучший результат</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{kpis.topScore}</span>
                    <span className={styles.kpiSubValue}>/ 50</span>
                  </div>
                  <p className={styles.kpiDescription}>
                    Максимальный зафиксированный балл
                  </p>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Завершаемость</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>
                      {kpis.completionRate}%
                    </span>
                  </div>
                  <p className={styles.kpiDescription}>
                    Доведенных до финиша тестов
                  </p>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Ударный режим</span>
                  </div>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{kpis.studyStreak}</span>
                    <span className={styles.kpiSubValue}>дн.</span>
                  </div>
                  <p className={styles.kpiDescription}>
                    Дней непрерывной подготовки
                  </p>
                </div>
              </div>
            </section>

            {/* Score Timeline Trend */}
            {scoreTimeline.length > 0 ? (
              <section
                className={styles.section}
                aria-label="Динамика результатов"
              >
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Динамика баллов</h2>
                  <span className={styles.kpiLabel}>
                    Последние {scoreTimeline.length} тестов
                  </span>
                </div>

                <div className={styles.timelineCard}>
                  <div className={styles.timelineBars}>
                    {scoreTimeline.map((item, idx) => {
                      const heightPercent = Math.max(
                        8,
                        Math.min(100, item.percentage)
                      );
                      return (
                        <div key={idx} className={styles.timelineColumn}>
                          <span className={styles.timelineBarScore}>
                            {item.score}
                          </span>
                          <div className={styles.timelineBarTrack}>
                            <div
                              className={styles.timelineBarFill}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className={styles.timelineBarDate}>
                            {item.formattedDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            {/* Topic Mastery Section */}
            <section className={styles.section} aria-label="Освоение тем ЕНТ">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Освоение профильных тем</h2>

                <div className={styles.filterBar} role="tablist">
                  <button
                    type="button"
                    onClick={() => setTopicFilter('all')}
                    className={`${styles.filterButton} ${
                      topicFilter === 'all' ? styles.filterButtonActive : ''
                    }`}
                  >
                    Все темы ({topicMastery.allTopics.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicFilter('strong')}
                    className={`${styles.filterButton} ${
                      topicFilter === 'strong' ? styles.filterButtonActive : ''
                    }`}
                  >
                    Сильные темы ({topicMastery.strongTopics.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicFilter('growth')}
                    className={`${styles.filterButton} ${
                      topicFilter === 'growth' ? styles.filterButtonActive : ''
                    }`}
                  >
                    Зоны роста ({topicMastery.growthTopics.length})
                  </button>
                </div>
              </div>

              <div className={styles.topicsGrid}>
                {displayedTopics.map((topic) => (
                  <div key={topic.id} className={styles.topicCard}>
                    <div className={styles.topicCardHeader}>
                      <h3 className={styles.topicName}>{topic.label}</h3>
                      <span className={styles.topicScore}>
                        {topic.score} / {topic.maxScore} б.
                      </span>
                    </div>

                    <div className={styles.progressBarTrack}>
                      <div
                        className={`${styles.progressBarFill} ${
                          topic.isStrong
                            ? styles.progressBarFillStrong
                            : styles.progressBarFillGrowth
                        }`}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>

                    <div className={styles.topicFooter}>
                      <span>Вопросов решено: {topic.questionsAttempted}</span>
                      <span
                        className={`${styles.topicTag} ${
                          topic.isStrong ? styles.tagStrong : styles.tagGrowth
                        }`}
                      >
                        {topic.isStrong ? 'Сильная тема' : 'Зона роста'} (
                        {topic.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Attempts History */}
            <section className={styles.section} aria-label="История попыток">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>История попыток</h2>
                <span className={styles.kpiLabel}>
                  Всего: {recentAttempts.length}
                </span>
              </div>

              <div className={styles.attemptsList}>
                {recentAttempts.map((attempt) => {
                  const isCompleted = attempt.status === 'completed';
                  const isInProgress = attempt.status === 'in_progress';
                  const statusClass = isCompleted
                    ? styles.statusCompleted
                    : isInProgress
                      ? styles.statusInProgress
                      : styles.statusAbandoned;

                  const statusLabel = isCompleted
                    ? 'Завершён'
                    : isInProgress
                      ? 'В процессе'
                      : 'Отменён';

                  const duration = formatDuration(
                    attempt.startedAt,
                    attempt.finishedAt
                  );
                  const scoreTotal = attempt.score?.totalScore ?? null;
                  const scoreMax = attempt.score?.maxPossibleScore ?? 50;

                  return (
                    <div key={attempt.id} className={styles.attemptItem}>
                      <div className={styles.attemptLeft}>
                        <span
                          className={`${styles.attemptStatusBadge} ${statusClass}`}
                        >
                          {statusLabel}
                        </span>

                        <div className={styles.attemptMeta}>
                          <span className={styles.attemptDate}>
                            {formatDate(attempt.startedAt)}
                          </span>
                          {duration ? (
                            <span className={styles.attemptDetails}>
                              Время: {duration}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.attemptRight}>
                        {scoreTotal !== null ? (
                          <div className={styles.attemptScore}>
                            <span className={styles.attemptScoreValue}>
                              {scoreTotal}
                            </span>
                            <span className={styles.attemptScoreMax}>
                              / {scoreMax} б.
                            </span>
                          </div>
                        ) : null}

                        <Link
                          to={`/test/${attempt.id}`}
                          className={styles.attemptLink}
                        >
                          {isInProgress ? 'Продолжить →' : 'Открыть разбор →'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
