import { Link, useParams } from 'react-router-dom';
import { useTeacherExamResults } from '../hooks/useTeacherExamResults';
import styles from './TeacherExamResultsPage.module.css';

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status) {
  switch (status) {
    case 'completed':
      return <span className={`${styles.badge} ${styles.badgeCompleted}`}>Завершён</span>;
    case 'disqualified':
      return <span className={`${styles.badge} ${styles.badgeDisqualified}`}>Аннулирован</span>;
    case 'in_progress':
      return <span className={`${styles.badge} ${styles.badgeInProgress}`}>● В процессе</span>;
    case 'waiting':
      return <span className={`${styles.badge} ${styles.badgeWaiting}`}>Ожидает</span>;
    case 'not_started':
    default:
      return <span className={`${styles.badge} ${styles.badgeNotStarted}`}>Не начал</span>;
  }
}

export function TeacherExamResultsPage() {
  const { examId } = useParams();
  const {
    exam,
    summary,
    participants,
    allParticipantsCount,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isLoading,
    error,
  } = useTeacherExamResults({ examId });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка результатов экзамена...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Link to="/teacher/exams" className={styles.backLink}>
          &larr; Назад к экзаменам
        </Link>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  const scoreDist = summary?.scoreDistribution || {};
  const maxDistCount = Math.max(...Object.values(scoreDist), 1);
  const topicPerf = summary?.topicPerformance || {};

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/teacher/exams" className={styles.backLink}>
          &larr; Назад к экзаменам
        </Link>
        <h1 className={styles.title}>
          Результаты: {exam?.title || 'Экзамен'}
        </h1>
        <div className={styles.subtitle}>
          Группа: <strong>{exam?.groupName || 'Все'}</strong> • Вопросов:{' '}
          <strong>{exam?.totalQuestions || 0}</strong> • Статус:{' '}
          <strong>{exam?.status || 'draft'}</strong>
        </div>
      </header>

      {/* Grouped KPI Cards (Linear / Vercel SaaS style) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Участники</div>
          <div className={styles.kpiValue}>
            {summary?.totalParticipants || 0}
          </div>
          <div className={styles.kpiSub}>
            <span className={styles.kpiSubSuccess}>{summary?.completedCount || 0} сдал</span>
            <span className={styles.kpiSubDot}>·</span>
            <span className={styles.kpiSubWarning}>{(summary?.notStartedCount || 0) + (summary?.waitingCount || 0)} не начал</span>
            <span className={styles.kpiSubDot}>·</span>
            <span className={styles.kpiSubInfo}>{summary?.inProgressCount || 0} в процессе</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Средний результат</div>
          <div className={styles.kpiValue}>
            {summary?.averagePercentage || 0}%
          </div>
          <div className={styles.kpiSub}>
            <span>{summary?.averageScore || 0} баллов из {exam?.totalQuestions || 'N'}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Диапазон баллов</div>
          <div className={styles.scoreRangeWrapper}>
            <div className={styles.scoreRangeItem}>
              <span className={styles.scoreRangeLabel}>Мин.</span>
              <span className={styles.scoreRangeVal}>{summary?.lowestScore ?? 0}</span>
            </div>
            <div className={styles.scoreRangeDivider} />
            <div className={styles.scoreRangeItem}>
              <span className={styles.scoreRangeLabel}>Макс.</span>
              <span className={styles.scoreRangeVal}>{summary?.highestScore ?? 0}</span>
            </div>
          </div>
          <div className={styles.kpiSub}>
            <span>Разброс: {(summary?.highestScore || 0) - (summary?.lowestScore || 0)} б.</span>
          </div>
        </div>
      </div>

      {/* Analytics Visuals Grid */}
      <div className={styles.visualsGrid}>
        {/* Score Distribution Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Распределение результатов</h2>
            <span className={styles.cardHint}>По диапазонам %</span>
          </div>
          <div className={styles.distContainer}>
            {Object.entries(scoreDist).map(([range, count]) => {
              const pctWidth = Math.round((count / maxDistCount) * 100);
              return (
                <div key={range} className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>{range}</span>
                    <span className={styles.progressValue}>{count} чел.</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFillPrimary}
                      style={{ width: `${pctWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Performance Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Успеваемость по темам (класс)</h2>
            <span className={styles.cardHint}>Средний балл темы</span>
          </div>
          {Object.keys(topicPerf).length === 0 ? (
            <div className={styles.emptyChartBox}>Данные по темам отсутствуют</div>
          ) : (
            <div className={styles.topicsContainer}>
              {Object.entries(topicPerf).map(([tName, tPct]) => (
                <div key={tName} className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>{tName}</span>
                    <span className={styles.progressValue}>{tPct}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFillSuccess}
                      style={{ width: `${tPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participants List & Table (Requirements 6J) */}
      <div className={styles.card}>
        <div className={styles.tableHeaderRow}>
          <h2 className={styles.cardTitle}>
            Список участников ({allParticipantsCount})
          </h2>

          <div className={styles.filtersBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по имени ученика..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="completed">Завершённые</option>
              <option value="disqualified">Аннулированные</option>
              <option value="in_progress">В процессе</option>
              <option value="waiting">Ожидают</option>
              <option value="not_started">Не начали</option>
            </select>

            <select
              className={styles.filterSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="score">Сортировка: Балл</option>
              <option value="percentage">Сортировка: Процент</option>
              <option value="studentName">Сортировка: Имя</option>
            </select>

            <button
              type="button"
              className={styles.sortOrderBtn}
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title="Переключить порядок сортировки"
            >
              {sortOrder === 'asc' ? '▲ Возр.' : '▼ Убыв.'}
            </button>
          </div>
        </div>

        {participants.length === 0 ? (
          <div className={styles.emptyTableBox}>Участники не найдены.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Статус</th>
                  <th>Попытка</th>
                  <th>Нарушения</th>
                  <th>Балл</th>
                  <th>Процент</th>
                  <th>Начало</th>
                  <th>Сдача</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.studentId}>
                    <td>
                      <strong className={styles.studentName}>{p.studentName}</strong>
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      {p.attemptNumber ? `Attempt ${p.attemptNumber}` : '—'}
                    </td>
                    <td>
                      {p.status !== 'not_started' ? (
                        <span style={{ color: p.violationCount > 0 ? '#ef4444' : 'inherit' }}>
                          {p.violationCount || 0} / {p.maxViolations || 3}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {p.status === 'completed'
                        ? `${p.score} / ${p.maxPossibleScore}`
                        : '—'}
                    </td>
                    <td>
                      {p.status === 'completed' ? (
                        <strong className={styles.percentageText}>{p.percentage}%</strong>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{formatDate(p.startedAt)}</td>
                    <td>{formatDate(p.submittedAt)}</td>
                    <td>
                      {p.status !== 'not_started' ? (
                        <Link
                          to={`/teacher/exams/${examId}/results/${p.studentId}`}
                          className={styles.analyticsLink}
                        >
                          Аналитика &rarr;
                        </Link>
                      ) : (
                        <span className={styles.disabledLink}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
