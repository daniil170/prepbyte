import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StreakFlame } from '@features/analytics';
import { useTeacherStudentDetails } from '../hooks/useTeacherStudentDetails';
import { formatActivityDate } from '../domain/studentProfile';
import styles from './TeacherStudentDetailPage.module.css';

export function TeacherStudentDetailPage() {
  const { studentId } = useParams();
  const { student, sessions, kpis, topicMastery, scoreTimeline, loading, error, refresh } =
    useTeacherStudentDetails(studentId);
  const [topicFilter, setTopicFilter] = useState('all');

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка данных ученика...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className={styles.page}>
        <Link to="/teacher/students" className={styles.backLink}>
          &larr; Назад к списку учеников
        </Link>
        <div className={styles.errorBox}>
          <p>{error || 'Ученик не найден'}</p>
          <button
            type="button"
            onClick={refresh}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  const hasSessions = sessions && sessions.length > 0;
  const completedSessions = (sessions || []).filter((s) => s.status === 'completed');

  let displayedTopics = topicMastery?.allTopics || [];
  if (topicFilter === 'strong') {
    displayedTopics = topicMastery?.strongTopics || [];
  } else if (topicFilter === 'growth') {
    displayedTopics = topicMastery?.growthTopics || [];
  }

  return (
    <div className={styles.page}>
      <Link to="/teacher/students" className={styles.backLink}>
        &larr; Назад к списку учеников
      </Link>

      <header className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <h1 className={styles.displayName}>
            {student.displayName || 'Ученик без имени'}
          </h1>
          <span className={styles.email}>{student.email}</span>

          <div className={styles.metaRow}>
            {student.school && (
              <span className={styles.metaItem}>
                Школа: <strong>{student.school}</strong>
              </span>
            )}
            {student.grade && (
              <span className={styles.metaItem}>
                Класс: <strong>{student.grade}</strong>
              </span>
            )}
            <span className={styles.metaItem}>
              UID: <code>{student.uid}</code>
            </span>
          </div>
        </div>
      </header>

      {!hasSessions ? (
        <div className={styles.emptyBox}>
          <h3>Нет активности по тестам</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Этот ученик пока не запустил ни одной сессии тестирования.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <section className={styles.kpiGrid} aria-label="Метрики ученика">
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Средний балл</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{kpis?.averageScore ?? 0}</span>
                <span className={styles.kpiSubValue}>/ 50</span>
              </div>
              <span className={styles.kpiDescription}>По шкале ЕНТ</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Лучший результат</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{kpis?.topScore ?? 0}</span>
                <span className={styles.kpiSubValue}>/ 50</span>
              </div>
              <span className={styles.kpiDescription}>Максимальный балл</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Пройдено тестов</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{kpis?.completedTests ?? 0}</span>
                <span className={styles.kpiSubValue}>из {kpis?.totalTests ?? 0}</span>
              </div>
              <span className={styles.kpiDescription}>Завершаемость {kpis?.completionRate ?? 0}%</span>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiLabel}>
                <span>Ударный режим</span>
                <StreakFlame streak={kpis?.studyStreak ?? 0} />
              </div>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{kpis?.studyStreak ?? 0}</span>
                <span className={styles.kpiSubValue}>дн.</span>
              </div>
              <span className={styles.kpiDescription}>Непрерывной подготовки</span>
            </div>
          </section>

          {/* Score Timeline */}
          {scoreTimeline && scoreTimeline.length > 0 && (
            <section className={styles.section} aria-label="Динамика результатов">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Динамика баллов</h2>
                <span className={styles.kpiLabel}>
                  Последние {scoreTimeline.length} тестов
                </span>
              </div>

              <div className={styles.timelineCard}>
                <div className={styles.timelineBars}>
                  {scoreTimeline.map((item, idx) => {
                    const heightPercent = Math.max(8, Math.min(100, item.percentage));
                    return (
                      <div key={idx} className={styles.timelineColumn}>
                        <span className={styles.timelineBarScore}>{item.score}</span>
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
          )}

          {/* Topic Mastery */}
          {topicMastery && (
            <section className={styles.section} aria-label="Освоение тем ЕНТ">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Освоение профильных тем</h2>

                <div className={styles.filterBar}>
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
                          topic.isMastered
                            ? styles.progressBarFillMastered
                            : styles.progressBarFillGrowth
                        }`}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>

                    <div className={styles.topicFooter}>
                      <span>{topic.percentage}%</span>
                      <span>{topic.isMastered ? 'Освоено (≥70%)' : 'Зона роста (<70%)'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sessions Table */}
          <section className={styles.section} aria-label="История сессий">
            <h2 className={styles.sectionTitle}>История тестирований</h2>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Сессия</th>
                    <th className={styles.th}>Дата завершения</th>
                    <th className={styles.th}>Балл</th>
                    <th className={styles.th}>Процент</th>
                    <th className={styles.th}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map((s) => (
                    <tr key={s.id} className={styles.tr}>
                      <td className={styles.td}>
                        <code style={{ fontSize: '0.75rem' }}>{s.id.slice(0, 8)}...</code>
                      </td>
                      <td className={styles.td}>
                        {formatActivityDate(s.finishedAt)}
                      </td>
                      <td className={styles.td}>
                        <strong>{s.score?.totalScore ?? 0}</strong> / 50
                      </td>
                      <td className={styles.td}>
                        {s.score?.percentage ?? 0}%
                      </td>
                      <td className={styles.td}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                          }}
                        >
                          Завершен
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
